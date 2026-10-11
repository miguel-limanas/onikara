-- Missões conduzidas pelo mestre: ele atribui a missão, confirma os objetivos e
-- entrega a recompensa. O jogador aceita a missão e acompanha o progresso, mas não
-- resgata a recompensa sozinho.

-- 1. O mestre lê as missões dos jogadores da própria campanha.
create policy "masters can read campaign member quests" on public.character_quests
  for select using (public.is_master_of_profile(profile_id));

-- 2. Funções do mestre -----------------------------------------------------------

create or replace function public.master_assign_quest(p_profile_id uuid, p_quest_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quest public.quests;
  v_existing public.character_quests;
begin
  if not public.is_master_of_profile(p_profile_id) then
    raise exception 'Esse jogador não está na sua campanha.' using errcode = '42501';
  end if;
  select * into v_quest from public.quests where id = p_quest_id;
  if not found then
    raise exception 'Missão não encontrada.' using errcode = 'P0002';
  end if;

  select * into v_existing from public.character_quests
  where profile_id = p_profile_id and quest_id = p_quest_id for update;
  if found then
    if v_existing.status = 'active' then
      return;
    end if;
    if v_existing.status = 'completed' and not v_quest.repeatable then
      raise exception 'Essa missão já foi concluída.' using errcode = 'P0001';
    end if;
    update public.character_quests
    set status = 'active', progress = '{}'::jsonb, started_at = now(), completed_at = null
    where profile_id = p_profile_id and quest_id = p_quest_id;
  else
    insert into public.character_quests (profile_id, quest_id, status, progress)
    values (p_profile_id, p_quest_id, 'active', '{}'::jsonb);
  end if;
end;
$$;

create or replace function public.master_set_quest_step(
  p_profile_id uuid,
  p_quest_id text,
  p_step_id text,
  p_count integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_step public.quest_steps;
  v_row public.character_quests;
begin
  if not public.is_master_of_profile(p_profile_id) then
    raise exception 'Esse jogador não está na sua campanha.' using errcode = '42501';
  end if;
  select * into v_step from public.quest_steps where id = p_step_id and quest_id = p_quest_id;
  if not found then
    raise exception 'Objetivo não encontrado.' using errcode = 'P0002';
  end if;
  select * into v_row from public.character_quests
  where profile_id = p_profile_id and quest_id = p_quest_id for update;
  if not found or v_row.status <> 'active' then
    raise exception 'A missão não está ativa para esse jogador.' using errcode = 'P0001';
  end if;

  update public.character_quests
  set progress = jsonb_set(
    case when progress ? 'steps' then progress else coalesce(progress, '{}'::jsonb) || '{"steps": {}}'::jsonb end,
    array['steps', p_step_id],
    to_jsonb(greatest(0, least(p_count, v_step.target_count)))
  )
  where profile_id = p_profile_id and quest_id = p_quest_id;
end;
$$;

-- Conclui a missão e entrega a recompensa (xp e itens) ao jogador.
create or replace function public.master_complete_quest(p_profile_id uuid, p_quest_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quest public.quests;
  v_row public.character_quests;
  v_step record;
  v_done integer;
  v_granted jsonb;
begin
  if not public.is_master_of_profile(p_profile_id) then
    raise exception 'Esse jogador não está na sua campanha.' using errcode = '42501';
  end if;
  select * into v_quest from public.quests where id = p_quest_id;
  select * into v_row from public.character_quests
  where profile_id = p_profile_id and quest_id = p_quest_id for update;
  if not found or v_row.status <> 'active' then
    raise exception 'A missão não está ativa para esse jogador.' using errcode = 'P0001';
  end if;

  for v_step in select * from public.quest_steps where quest_id = p_quest_id order by step_order loop
    v_done := coalesce((v_row.progress -> 'steps' ->> v_step.id)::integer, 0);
    if v_done < v_step.target_count then
      raise exception 'Ainda há objetivos pendentes nesta missão.' using errcode = 'P0001';
    end if;
  end loop;

  v_granted := public.grant_profile_rewards(
    p_profile_id,
    coalesce((v_quest.rewards ->> 'xp')::integer, 0),
    coalesce(v_quest.rewards -> 'items', '[]'::jsonb)
  );

  update public.character_quests
  set status = 'completed', completed_at = now()
  where profile_id = p_profile_id and quest_id = p_quest_id;

  return v_granted;
end;
$$;

create or replace function public.master_fail_quest(p_profile_id uuid, p_quest_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_master_of_profile(p_profile_id) then
    raise exception 'Esse jogador não está na sua campanha.' using errcode = '42501';
  end if;
  update public.character_quests
  set status = 'failed', completed_at = now()
  where profile_id = p_profile_id and quest_id = p_quest_id and status = 'active';
end;
$$;

-- A recompensa passa a ser entregue pelo mestre.
revoke execute on function public.claim_quest_reward(text) from authenticated;

revoke all on function public.master_assign_quest(uuid, text) from public, anon;
revoke all on function public.master_set_quest_step(uuid, text, text, integer) from public, anon;
revoke all on function public.master_complete_quest(uuid, text) from public, anon;
revoke all on function public.master_fail_quest(uuid, text) from public, anon;
grant execute on function public.master_assign_quest(uuid, text) to authenticated;
grant execute on function public.master_set_quest_step(uuid, text, text, integer) to authenticated;
grant execute on function public.master_complete_quest(uuid, text) to authenticated;
grant execute on function public.master_fail_quest(uuid, text) to authenticated;
