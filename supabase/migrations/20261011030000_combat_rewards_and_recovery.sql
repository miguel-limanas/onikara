-- Fase 5 / plano 05-07: recompensas, missões e recuperação fora de combate.
-- Quem concede recompensas é o mestre (D-21); o servidor calcula e grava de forma idempotente.
-- O jogador só chama RPCs que atuam sobre o próprio perfil (aceitar/resgatar missão, descansar,
-- teste de medicina, usar consumível).

-- 1. Regras de recuperação (versionadas, como as demais regras de balanceamento) ------

create table public.recovery_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  version integer not null check (version >= 1),
  status text not null check (status in ('draft', 'active', 'archived')),
  regeneration jsonb not null,
  medicine jsonb not null default '{}'::jsonb,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, version)
);

create trigger recovery_rules_set_updated_at before update on public.recovery_rules
  for each row execute function public.set_updated_at();
create trigger recovery_rules_admin_audit after insert or update or delete on public.recovery_rules
  for each row execute function public.audit_admin_row_change();

create view public.active_recovery_rules
with (security_invoker = true)
as select * from public.recovery_rules where status = 'active';

alter table public.recovery_rules enable row level security;
create policy "active recovery rules are readable by everyone" on public.recovery_rules
  for select using (status = 'active');
create policy "admins can manage recovery rules" on public.recovery_rules
  for all using (public.is_admin()) with check (public.is_admin());

insert into public.recovery_rules (name, version, status, regeneration, medicine, notes)
values (
  'mvp-default-recovery',
  1,
  'active',
  '{"hp_per_day_die": 6, "hp_per_day_flat": 1, "max_days_counted": 30}'::jsonb,
  '{"default_dt": 12, "heal_percent": 25, "attribute": "intelligence"}'::jsonb,
  'Regeneração de HP por dias (dado variável) e teste de medicina d20 contra a DT definida pelo mestre.'
)
on conflict (name, version) do nothing;

-- DT do teste de medicina definida pelo mestre da campanha (nulo = padrão da regra).
alter table public.campaigns
  add column if not exists medicine_dt integer check (medicine_dt between 1 and 40);

-- 2. Recompensas de combate -----------------------------------------------------------

create table public.combat_rewards (
  id uuid primary key default gen_random_uuid(),
  combat_session_id uuid not null unique references public.combat_sessions(id) on delete cascade,
  awarded_by uuid references auth.users(id),
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.combat_rewards enable row level security;
create policy "participants and masters can read combat rewards" on public.combat_rewards
  for select using (public.can_view_combat(combat_session_id));
create policy "admins can read combat rewards" on public.combat_rewards
  for select using (public.is_admin());

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'combat_rewards'
  ) then
    alter publication supabase_realtime add table public.combat_rewards;
  end if;
end $$;

-- 3. Funções internas (somente service_role) -------------------------------------------

create or replace function public.xp_needed(p_level integer, p_curve jsonb)
returns integer
language sql
immutable
as $$
  select greatest(
    1,
    round(
      coalesce((p_curve ->> 'base_xp')::numeric, 100)
      * power(coalesce((p_curve ->> 'level_multiplier')::numeric, 1.35), greatest(1, p_level) - 1)
    )::integer
  );
$$;

create or replace function public.grant_profile_rewards(p_profile uuid, p_xp integer, p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
  v_curve jsonb;
  v_max integer;
  v_level integer;
  v_xp integer;
  v_level_before integer;
  v_need integer;
  v_granted jsonb := '[]'::jsonb;
  v_entry record;
begin
  select * into v_profile from public.profiles where id = p_profile for update;
  if not found then
    raise exception 'Perfil não encontrado.' using errcode = 'P0002';
  end if;

  select xp_curve into v_curve from public.active_progression_rules limit 1;
  v_max := coalesce((v_curve ->> 'max_level')::integer, 20);
  v_level := v_profile.level;
  v_level_before := v_level;
  v_xp := v_profile.xp + greatest(coalesce(p_xp, 0), 0);

  loop
    exit when v_level >= v_max;
    v_need := public.xp_needed(v_level, v_curve);
    exit when v_xp < v_need;
    v_xp := v_xp - v_need;
    v_level := v_level + 1;
  end loop;
  if v_level >= v_max then
    v_xp := 0;
  end if;

  update public.profiles set level = v_level, xp = v_xp where id = p_profile;

  for v_entry in
    select incoming.item_id, incoming.quantity, item.max_stack
    from jsonb_to_recordset(coalesce(p_items, '[]'::jsonb)) as incoming(item_id text, quantity integer)
    join public.items item on item.id = incoming.item_id
    where incoming.quantity > 0
  loop
    insert into public.inventory (profile_id, item_id, quantity)
    values (p_profile, v_entry.item_id, least(v_entry.quantity, v_entry.max_stack))
    on conflict (profile_id, item_id) do update
      set quantity = least(v_entry.max_stack, public.inventory.quantity + excluded.quantity),
          updated_at = now();
    v_granted := v_granted || jsonb_build_array(jsonb_build_object('item_id', v_entry.item_id, 'quantity', v_entry.quantity));
  end loop;

  return jsonb_build_object(
    'profile_id', p_profile,
    'xp', coalesce(p_xp, 0),
    'level_before', v_level_before,
    'level_after', v_level,
    'items', v_granted
  );
end;
$$;

-- Concede as recompensas de uma vitória de uma vez só (idempotente por sessão).
create or replace function public.award_combat_rewards(p_session_id uuid, p_awarded_by uuid, p_awards jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing jsonb;
  v_session public.combat_sessions;
  v_award record;
  v_result jsonb;
  v_results jsonb := '[]'::jsonb;
  v_step record;
begin
  select summary into v_existing from public.combat_rewards where combat_session_id = p_session_id;
  if found then
    return v_existing;
  end if;

  select * into v_session from public.combat_sessions where id = p_session_id for update;
  if not found or v_session.status <> 'victory' then
    raise exception 'Só é possível conceder recompensas de um combate vencido.' using errcode = 'P0001';
  end if;

  for v_award in
    select * from jsonb_to_recordset(p_awards) as incoming(profile_id uuid, xp integer, items jsonb)
  loop
    -- o perfil precisa ter participado do combate
    if not exists (
      select 1 from public.combat_participants
      where combat_session_id = p_session_id and profile_id = v_award.profile_id
    ) then
      raise exception 'Perfil fora do combate.' using errcode = '42501';
    end if;

    v_result := public.grant_profile_rewards(v_award.profile_id, v_award.xp, v_award.items);

    -- progresso de missões com objetivo "derrotar inimigo"
    for v_step in
      select qs.id as step_id, qs.quest_id, qs.target_count, defeated.total
      from public.character_quests cq
      join public.quest_steps qs on qs.quest_id = cq.quest_id and qs.objective_type = 'defeat_enemy'
      join (
        select enemy_id, count(*)::integer as total
        from public.combat_participants
        where combat_session_id = p_session_id
          and participant_type = 'enemy'
          and (current_stats ->> 'hp')::numeric <= 0
        group by enemy_id
      ) defeated on defeated.enemy_id = qs.target_ref
      where cq.profile_id = v_award.profile_id and cq.status = 'active'
    loop
      update public.character_quests
      set progress = jsonb_set(
        coalesce(progress, '{}'::jsonb) || jsonb_build_object('steps', coalesce(progress -> 'steps', '{}'::jsonb)),
        array['steps', v_step.step_id],
        to_jsonb(least(v_step.target_count, coalesce((progress -> 'steps' ->> v_step.step_id)::integer, 0) + v_step.total))
      )
      where profile_id = v_award.profile_id and quest_id = v_step.quest_id;
    end loop;

    v_results := v_results || jsonb_build_array(v_result);
  end loop;

  insert into public.combat_rewards (combat_session_id, awarded_by, summary)
  values (p_session_id, p_awarded_by, jsonb_build_object('awards', v_results));

  return jsonb_build_object('awards', v_results);
end;
$$;

-- Grava HP e mana ao fim do combate. Derrota: volta com 1 de HP; a mana gasta fica gasta (D-10).
create or replace function public.settle_combat_vitals(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
begin
  for v_row in
    select profile_id, current_stats
    from public.combat_participants
    where combat_session_id = p_session_id and participant_type = 'profile' and profile_id is not null
  loop
    update public.profiles
    set current_state = coalesce(current_state, '{}'::jsonb) || jsonb_build_object(
      'hp', greatest(1, (v_row.current_stats ->> 'hp')::numeric),
      'mana', greatest(0, (v_row.current_stats ->> 'mana')::numeric),
      'hp_at', now(),
      'mana_at', now()
    )
    where id = v_row.profile_id;
  end loop;
end;
$$;

-- Regeneração preguiçosa: HP por dias (dado variável) e mana por minuto fora de combate.
create or replace function public.recover_profile(p_profile uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_state jsonb;
  v_hp numeric;
  v_max_hp numeric;
  v_mana numeric;
  v_max_mana numeric;
  v_hp_at timestamptz;
  v_mana_at timestamptz;
  v_days integer;
  v_minutes numeric;
  v_rule jsonb;
  v_die integer;
  v_flat integer;
  v_cap integer;
  v_rate numeric;
  v_gained numeric := 0;
  v_index integer;
begin
  select current_state into v_state from public.profiles where id = p_profile for update;
  if v_state is null then
    return null;
  end if;

  v_max_hp := coalesce((v_state ->> 'max_hp')::numeric, (v_state ->> 'hp')::numeric, 1);
  v_max_mana := coalesce((v_state ->> 'max_mana')::numeric, (v_state ->> 'mana')::numeric, 0);
  v_hp := least(v_max_hp, coalesce((v_state ->> 'hp')::numeric, v_max_hp));
  v_mana := least(v_max_mana, coalesce((v_state ->> 'mana')::numeric, v_max_mana));
  v_hp_at := coalesce((v_state ->> 'hp_at')::timestamptz, now());
  v_mana_at := coalesce((v_state ->> 'mana_at')::timestamptz, now());

  select regeneration into v_rule from public.active_recovery_rules limit 1;
  v_die := greatest(1, coalesce((v_rule ->> 'hp_per_day_die')::integer, 6));
  v_flat := coalesce((v_rule ->> 'hp_per_day_flat')::integer, 1);
  v_cap := coalesce((v_rule ->> 'max_days_counted')::integer, 30);

  v_days := floor(extract(epoch from (now() - v_hp_at)) / 86400)::integer;
  if v_days > 0 then
    if v_hp < v_max_hp then
      for v_index in 1..least(v_days, v_cap) loop
        v_gained := v_gained + v_flat + 1 + floor(random() * v_die);
      end loop;
      v_hp := least(v_max_hp, v_hp + v_gained);
    end if;
    v_hp_at := v_hp_at + (v_days * interval '1 day');
  end if;

  select regeneration into v_rule from public.active_mana_rules limit 1;
  v_rate := coalesce((v_rule ->> 'rest_per_minute')::numeric, 25);
  v_minutes := floor(extract(epoch from (now() - v_mana_at)) / 60);
  if v_minutes > 0 then
    v_mana := least(v_max_mana, v_mana + v_minutes * v_rate);
    v_mana_at := now();
  end if;

  v_state := v_state || jsonb_build_object(
    'hp', v_hp, 'mana', v_mana, 'hp_at', v_hp_at, 'mana_at', v_mana_at
  );
  update public.profiles set current_state = v_state where id = p_profile;
  return v_state;
end;
$$;

revoke all on function public.grant_profile_rewards(uuid, integer, jsonb) from public, anon, authenticated;
revoke all on function public.award_combat_rewards(uuid, uuid, jsonb) from public, anon, authenticated;
revoke all on function public.settle_combat_vitals(uuid) from public, anon, authenticated;
revoke all on function public.recover_profile(uuid) from public, anon, authenticated;
grant execute on function public.grant_profile_rewards(uuid, integer, jsonb) to service_role;
grant execute on function public.award_combat_rewards(uuid, uuid, jsonb) to service_role;
grant execute on function public.settle_combat_vitals(uuid) to service_role;
grant execute on function public.recover_profile(uuid) to service_role;

-- 4. RPCs do jogador (atuam só sobre o próprio perfil) ----------------------------------

create or replace function public.own_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.profiles where user_id = auth.uid();
$$;

create or replace function public.rest_recover()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile uuid := public.own_profile_id();
begin
  if v_profile is null then
    raise exception 'Crie seu personagem primeiro.' using errcode = 'P0002';
  end if;
  return public.recover_profile(v_profile);
end;
$$;

create or replace function public.attempt_medicine()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
  v_class public.rpg_classes;
  v_state jsonb;
  v_rule jsonb;
  v_dt integer;
  v_percent numeric;
  v_intelligence integer;
  v_modifier integer;
  v_roll integer;
  v_total integer;
  v_success boolean;
  v_max_hp numeric;
  v_hp numeric;
  v_healed numeric := 0;
  v_last timestamptz;
begin
  select * into v_profile from public.profiles where user_id = auth.uid() for update;
  if not found then
    raise exception 'Crie seu personagem primeiro.' using errcode = 'P0002';
  end if;
  select * into v_class from public.rpg_classes where id = v_profile.class_id;

  v_state := coalesce(v_profile.current_state, '{}'::jsonb);
  v_last := (v_state ->> 'medicine_at')::timestamptz;
  if v_last is not null and now() - v_last < interval '1 day' then
    raise exception 'Você já tentou cuidar dos ferimentos hoje.' using errcode = 'P0001';
  end if;

  select medicine into v_rule from public.active_recovery_rules limit 1;
  select coalesce(
    (select c.medicine_dt
     from public.campaign_members m join public.campaigns c on c.id = m.campaign_id
     where m.profile_id = v_profile.id and c.status = 'active'
     limit 1),
    (v_rule ->> 'default_dt')::integer,
    12
  ) into v_dt;
  v_percent := coalesce((v_rule ->> 'heal_percent')::numeric, 25);

  v_intelligence := coalesce((v_profile.base_stats ->> 'intelligence')::integer, 10)
    + coalesce((v_class.scaling ->> 'intelligence')::integer, 0) * (v_profile.level - 1);
  v_modifier := floor((v_intelligence - 10) / 2.0)::integer;
  v_roll := 1 + floor(random() * 20)::integer;
  v_total := v_roll + v_modifier;
  v_success := v_total >= v_dt;

  v_max_hp := coalesce((v_state ->> 'max_hp')::numeric, (v_state ->> 'hp')::numeric, 1);
  v_hp := least(v_max_hp, coalesce((v_state ->> 'hp')::numeric, v_max_hp));
  if v_success then
    v_healed := least(v_max_hp - v_hp, ceil(v_max_hp * v_percent / 100));
    v_hp := v_hp + v_healed;
  end if;

  update public.profiles
  set current_state = v_state || jsonb_build_object('hp', v_hp, 'medicine_at', now())
  where id = v_profile.id;

  return jsonb_build_object(
    'roll', v_roll, 'modifier', v_modifier, 'total', v_total, 'dt', v_dt,
    'success', v_success, 'healed', v_healed, 'hp', v_hp, 'max_hp', v_max_hp
  );
end;
$$;

create or replace function public.use_consumable(p_item_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
  v_item public.items;
  v_inventory public.inventory;
  v_state jsonb;
  v_max_hp numeric;
  v_max_mana numeric;
  v_hp numeric;
  v_mana numeric;
begin
  select * into v_profile from public.profiles where user_id = auth.uid() for update;
  if not found then
    raise exception 'Crie seu personagem primeiro.' using errcode = 'P0002';
  end if;
  select * into v_item from public.items where id = p_item_id and item_type = 'consumable';
  if not found then
    raise exception 'Esse item não pode ser usado.' using errcode = 'P0001';
  end if;
  select * into v_inventory from public.inventory
  where profile_id = v_profile.id and item_id = p_item_id for update;
  if not found or v_inventory.quantity < 1 then
    raise exception 'Você não tem esse item.' using errcode = 'P0001';
  end if;
  if (v_item.effects ->> 'restore_hp') is null and (v_item.effects ->> 'restore_mana') is null then
    raise exception 'Esse item não tem efeito fora de combate.' using errcode = 'P0001';
  end if;

  v_state := coalesce(v_profile.current_state, '{}'::jsonb);
  v_max_hp := coalesce((v_state ->> 'max_hp')::numeric, (v_state ->> 'hp')::numeric, 1);
  v_max_mana := coalesce((v_state ->> 'max_mana')::numeric, (v_state ->> 'mana')::numeric, 0);
  v_hp := least(v_max_hp, coalesce((v_state ->> 'hp')::numeric, v_max_hp) + coalesce((v_item.effects ->> 'restore_hp')::numeric, 0));
  v_mana := least(v_max_mana, coalesce((v_state ->> 'mana')::numeric, v_max_mana) + coalesce((v_item.effects ->> 'restore_mana')::numeric, 0));

  update public.profiles
  set current_state = v_state || jsonb_build_object('hp', v_hp, 'mana', v_mana)
  where id = v_profile.id;

  if v_inventory.quantity <= 1 then
    delete from public.inventory where id = v_inventory.id;
  else
    update public.inventory set quantity = quantity - 1, updated_at = now() where id = v_inventory.id;
  end if;

  return jsonb_build_object('hp', v_hp, 'mana', v_mana, 'max_hp', v_max_hp, 'max_mana', v_max_mana);
end;
$$;

create or replace function public.start_quest(p_quest_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
  v_quest public.quests;
  v_existing public.character_quests;
begin
  select * into v_profile from public.profiles where user_id = auth.uid();
  if not found then
    raise exception 'Crie seu personagem primeiro.' using errcode = 'P0002';
  end if;
  select * into v_quest from public.quests where id = p_quest_id;
  if not found then
    raise exception 'Missão não encontrada.' using errcode = 'P0002';
  end if;
  if v_profile.level < v_quest.min_level then
    raise exception 'Nível insuficiente para esta missão.' using errcode = 'P0001';
  end if;

  select * into v_existing from public.character_quests
  where profile_id = v_profile.id and quest_id = p_quest_id for update;
  if found then
    if v_existing.status = 'active' then
      return jsonb_build_object('quest_id', p_quest_id, 'status', 'active');
    end if;
    if v_existing.status = 'completed' and not v_quest.repeatable then
      raise exception 'Essa missão já foi concluída.' using errcode = 'P0001';
    end if;
    update public.character_quests
    set status = 'active', progress = '{}'::jsonb, started_at = now(), completed_at = null
    where profile_id = v_profile.id and quest_id = p_quest_id;
  else
    insert into public.character_quests (profile_id, quest_id, status, progress)
    values (v_profile.id, p_quest_id, 'active', '{}'::jsonb);
  end if;
  return jsonb_build_object('quest_id', p_quest_id, 'status', 'active');
end;
$$;

create or replace function public.claim_quest_reward(p_quest_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
  v_quest public.quests;
  v_row public.character_quests;
  v_step record;
  v_done integer;
  v_granted jsonb;
begin
  select * into v_profile from public.profiles where user_id = auth.uid();
  if not found then
    raise exception 'Crie seu personagem primeiro.' using errcode = 'P0002';
  end if;
  select * into v_quest from public.quests where id = p_quest_id;
  select * into v_row from public.character_quests
  where profile_id = v_profile.id and quest_id = p_quest_id for update;
  if not found or v_row.status <> 'active' then
    raise exception 'Essa missão não está ativa.' using errcode = 'P0001';
  end if;

  for v_step in select * from public.quest_steps where quest_id = p_quest_id order by step_order loop
    if v_step.objective_type = 'defeat_enemy' then
      v_done := coalesce((v_row.progress -> 'steps' ->> v_step.id)::integer, 0);
      if v_done < v_step.target_count then
        raise exception 'Objetivos pendentes nesta missão.' using errcode = 'P0001';
      end if;
    elsif v_step.objective_type = 'collect_item' then
      select coalesce(sum(quantity), 0) into v_done
      from public.inventory where profile_id = v_profile.id and item_id = v_step.target_ref;
      if v_done < v_step.target_count then
        raise exception 'Objetivos pendentes nesta missão.' using errcode = 'P0001';
      end if;
    elsif v_step.objective_type = 'reach_level' then
      if v_profile.level < coalesce(nullif(v_step.target_ref, '')::integer, 1) then
        raise exception 'Objetivos pendentes nesta missão.' using errcode = 'P0001';
      end if;
    end if;
  end loop;

  v_granted := public.grant_profile_rewards(
    v_profile.id,
    coalesce((v_quest.rewards ->> 'xp')::integer, 0),
    coalesce(v_quest.rewards -> 'items', '[]'::jsonb)
  );

  update public.character_quests
  set status = 'completed', completed_at = now()
  where profile_id = v_profile.id and quest_id = p_quest_id;

  return v_granted;
end;
$$;

revoke all on function public.own_profile_id() from public, anon;
revoke all on function public.rest_recover() from public, anon;
revoke all on function public.attempt_medicine() from public, anon;
revoke all on function public.use_consumable(text) from public, anon;
revoke all on function public.start_quest(text) from public, anon;
revoke all on function public.claim_quest_reward(text) from public, anon;
grant execute on function public.own_profile_id() to authenticated;
grant execute on function public.rest_recover() to authenticated;
grant execute on function public.attempt_medicine() to authenticated;
grant execute on function public.use_consumable(text) to authenticated;
grant execute on function public.start_quest(text) to authenticated;
grant execute on function public.claim_quest_reward(text) to authenticated;
