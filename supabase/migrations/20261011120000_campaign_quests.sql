-- Missões da campanha: o mestre cadastra missões e escolhe as recompensas.
-- Missões do catálogo (campaign_id nulo) continuam visíveis a todos; as da
-- campanha só ao mestre e aos jogadores dela.

alter table public.quests
  add column if not exists campaign_id uuid references public.campaigns(id) on delete cascade,
  add column if not exists created_by uuid references auth.users(id);

create index if not exists quests_campaign_idx on public.quests (campaign_id);

-- Título único por escopo (catálogo ou campanha), não mais globalmente.
alter table public.quests drop constraint if exists quests_title_key;
create unique index if not exists quests_title_scope_key
  on public.quests (coalesce(campaign_id::text, ''), lower(title));

-- Visibilidade -------------------------------------------------------------------

drop policy if exists "catalogs are readable by everyone" on public.quests;
drop policy if exists "catalogs are readable by everyone" on public.quest_steps;

create policy "quests are readable by scope" on public.quests
  for select using (
    campaign_id is null
    or public.is_campaign_master(campaign_id)
    or public.is_campaign_member(campaign_id)
    or public.is_admin()
  );

create policy "quest steps are readable by scope" on public.quest_steps
  for select using (
    exists (
      select 1 from public.quests q
      where q.id = quest_steps.quest_id
        and (
          q.campaign_id is null
          or public.is_campaign_master(q.campaign_id)
          or public.is_campaign_member(q.campaign_id)
          or public.is_admin()
        )
    )
  );

-- Criação e remoção pelo mestre ----------------------------------------------------

create or replace function public.master_create_quest(
  p_campaign_id uuid,
  p_title text,
  p_description text,
  p_min_level integer,
  p_repeatable boolean,
  p_xp integer,
  p_items jsonb,
  p_steps jsonb
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text;
  v_title text := btrim(coalesce(p_title, ''));
  v_item jsonb;
  v_step jsonb;
  v_order integer := 0;
  v_items jsonb := '[]'::jsonb;
begin
  if not public.is_campaign_master(p_campaign_id) then
    raise exception 'Somente o mestre da campanha pode cadastrar missões.' using errcode = '42501';
  end if;
  if length(v_title) < 3 or length(v_title) > 80 then
    raise exception 'O título da missão deve ter de 3 a 80 caracteres.' using errcode = '22023';
  end if;
  if coalesce(p_xp, 0) < 0 or coalesce(p_xp, 0) > 100000 then
    raise exception 'XP da recompensa inválido.' using errcode = '22023';
  end if;
  if jsonb_typeof(coalesce(p_steps, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_steps, '[]'::jsonb)) > 12 then
    raise exception 'Objetivos inválidos (no máximo 12).' using errcode = '22023';
  end if;

  for v_item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    if not exists (select 1 from public.items where id = v_item ->> 'item_id') then
      raise exception 'Item de recompensa não encontrado.' using errcode = 'P0002';
    end if;
    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'item_id', v_item ->> 'item_id',
      'quantity', greatest(1, least(99, coalesce((v_item ->> 'quantity')::integer, 1)))
    ));
  end loop;

  v_id := 'c' || substr(replace(p_campaign_id::text, '-', ''), 1, 8) || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);

  insert into public.quests (id, title, description, min_level, rewards, repeatable, campaign_id, created_by)
  values (
    v_id,
    v_title,
    left(btrim(coalesce(p_description, '')), 1000),
    greatest(1, least(coalesce(p_min_level, 1), 99)),
    jsonb_build_object('xp', coalesce(p_xp, 0), 'items', v_items),
    coalesce(p_repeatable, false),
    p_campaign_id,
    auth.uid()
  );

  for v_step in select * from jsonb_array_elements(coalesce(p_steps, '[]'::jsonb)) loop
    v_order := v_order + 1;
    insert into public.quest_steps (id, quest_id, step_order, objective_type, target_ref, target_count, metadata)
    values (
      v_id || '-' || lpad(v_order::text, 2, '0'),
      v_id,
      v_order,
      'custom',
      null,
      greatest(1, least(coalesce((v_step ->> 'count')::integer, 1), 99)),
      jsonb_build_object('label', left(btrim(coalesce(v_step ->> 'label', 'Objetivo')), 120))
    );
  end loop;

  return v_id;
end;
$$;

create or replace function public.master_delete_quest(p_quest_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_campaign uuid;
begin
  select campaign_id into v_campaign from public.quests where id = p_quest_id;
  if v_campaign is null or not public.is_campaign_master(v_campaign) then
    raise exception 'Missão não encontrada na sua campanha.' using errcode = 'P0002';
  end if;
  if exists (select 1 from public.character_quests where quest_id = p_quest_id) then
    raise exception 'Algum jogador já aceitou ou concluiu essa missão e ela não pode ser removida.' using errcode = 'P0001';
  end if;
  delete from public.quests where id = p_quest_id;
end;
$$;

-- Jogador só aceita missões do catálogo ou da própria campanha.
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
  if v_quest.campaign_id is not null and not public.is_campaign_member(v_quest.campaign_id) then
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

revoke all on function public.master_create_quest(uuid, text, text, integer, boolean, integer, jsonb, jsonb) from public, anon;
revoke all on function public.master_delete_quest(text) from public, anon;
grant execute on function public.master_create_quest(uuid, text, text, integer, boolean, integer, jsonb, jsonb) to authenticated;
grant execute on function public.master_delete_quest(text) to authenticated;
