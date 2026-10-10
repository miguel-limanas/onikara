-- Fase 5 / plano 05-04: o servidor passa a ser a autoridade do combate.
-- O jogador só lê as tabelas de combate; a escrita acontece pela Edge Function
-- `combat` (chave de serviço no servidor) por meio de persist_combat_step.

-- 1. Remove a escrita direta de jogadores (e do admin) nas tabelas de combate.
drop policy if exists "users can manage own combat sessions" on public.combat_sessions;
drop policy if exists "users can manage own combat participants" on public.combat_participants;
drop policy if exists "users can manage own combat events" on public.combat_events;
drop policy if exists "admins can manage all combat sessions" on public.combat_sessions;
drop policy if exists "admins can manage all combat participants" on public.combat_participants;
drop policy if exists "admins can manage all combat events" on public.combat_events;

create policy "users can read own combat sessions" on public.combat_sessions for select using (
  exists (
    select 1
    from public.profiles
    where profiles.id = combat_sessions.profile_id
      and profiles.user_id = auth.uid()
  )
);

-- 2. Concorrência otimista e ordem estável dos eventos.
alter table public.combat_sessions add column if not exists version integer not null default 0;

alter table public.combat_events add column if not exists seq bigint;

update public.combat_events as target
set seq = ordered.position
from (
  select id, row_number() over (partition by combat_session_id order by created_at, id) as position
  from public.combat_events
) as ordered
where target.id = ordered.id
  and target.seq is null;

alter table public.combat_events alter column seq set not null;
create unique index if not exists combat_events_session_seq_key on public.combat_events (combat_session_id, seq);

-- 3. Uma sessão ativa por jogador.
update public.combat_sessions
set status = 'abandoned', ended_at = now()
where status = 'active'
  and id not in (
    select distinct on (profile_id) id
    from public.combat_sessions
    where status = 'active'
    order by profile_id, started_at desc
  );

create unique index if not exists combat_sessions_one_active_per_profile
  on public.combat_sessions (profile_id)
  where status = 'active';

-- 4. Elemento do personagem (escolhido na criação; nulo = neutro).
alter table public.profiles
  add column if not exists element_id text references public.elements(id);

-- 5. Persistência transacional de um passo do combate.
create or replace function public.persist_combat_step(
  p_session_id uuid,
  p_expected_version integer,
  p_status text,
  p_turn_number integer,
  p_snapshot jsonb,
  p_participants jsonb,
  p_events jsonb
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_version integer;
  v_seq bigint;
begin
  update public.combat_sessions
  set status = p_status,
      turn_number = p_turn_number,
      snapshot = p_snapshot,
      version = version + 1,
      ended_at = case when p_status <> 'active' then now() else null end,
      updated_at = now()
  where id = p_session_id
    and version = p_expected_version
    and status = 'active'
  returning version into v_version;

  if v_version is null then
    raise exception 'combat_version_conflict' using errcode = 'P0001';
  end if;

  update public.combat_participants as participant
  set current_stats = incoming.current_stats,
      status_effects = incoming.status_effects
  from jsonb_to_recordset(p_participants) as incoming(id uuid, current_stats jsonb, status_effects jsonb)
  where participant.id = incoming.id
    and participant.combat_session_id = p_session_id;

  select coalesce(max(seq), 0) into v_seq
  from public.combat_events
  where combat_session_id = p_session_id;

  insert into public.combat_events (
    combat_session_id, turn_number, actor_participant_id, target_participant_id, event_type, payload, seq
  )
  select
    p_session_id,
    incoming.turn_number,
    incoming.actor_participant_id,
    incoming.target_participant_id,
    incoming.event_type,
    coalesce(incoming.payload, '{}'::jsonb),
    v_seq + incoming.idx
  from jsonb_to_recordset(p_events) as incoming(
    idx integer,
    turn_number integer,
    actor_participant_id uuid,
    target_participant_id uuid,
    event_type text,
    payload jsonb
  );

  return v_version;
end;
$$;

revoke all on function public.persist_combat_step(uuid, integer, text, integer, jsonb, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.persist_combat_step(uuid, integer, text, integer, jsonb, jsonb, jsonb) to service_role;
