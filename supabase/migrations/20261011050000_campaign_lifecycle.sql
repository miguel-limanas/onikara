-- Ciclo de vida da campanha: descrição (história), convites com aceite,
-- encerramento e histórico de combates visível a todos os membros.

-- 1. Descrição, encerramento e uma campanha ativa por mestre ------------------------

alter table public.campaigns
  add column if not exists description text not null default '' check (length(description) <= 4000),
  add column if not exists ended_at timestamptz;

-- Mantém só a campanha ativa mais recente de cada mestre antes de criar o índice único.
update public.campaigns c
set status = 'archived', ended_at = coalesce(c.ended_at, now())
where c.status = 'active'
  and exists (
    select 1 from public.campaigns newer
    where newer.master_user_id = c.master_user_id
      and newer.status = 'active'
      and (newer.created_at, newer.id) > (c.created_at, c.id)
  );

create unique index if not exists campaigns_one_active_per_master
  on public.campaigns (master_user_id)
  where status = 'active';

-- 2. Membros da campanha leem todos os combates dela (histórico) ----------------------

create or replace function public.can_view_combat(p_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.combat_sessions session
    where session.id = p_session_id
      and (
        exists (select 1 from public.profiles p where p.id = session.profile_id and p.user_id = auth.uid())
        or (session.campaign_id is not null and (
          exists (
            select 1 from public.campaigns c where c.id = session.campaign_id and c.master_user_id = auth.uid()
          )
          or public.is_campaign_member(session.campaign_id)
        ))
        or exists (
          select 1
          from public.combat_participants cp
          join public.profiles p on p.id = cp.profile_id
          where cp.combat_session_id = session.id and p.user_id = auth.uid()
        )
      )
  );
$$;

-- 3. Convites ------------------------------------------------------------------------

create table public.campaign_invitations (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  invited_by uuid not null references auth.users(id),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz not null default now(),
  responded_at timestamptz
);

create unique index campaign_invitations_one_pending
  on public.campaign_invitations (campaign_id, profile_id)
  where status = 'pending';
create index campaign_invitations_profile_idx on public.campaign_invitations (profile_id, status);

alter table public.campaign_invitations enable row level security;

create policy "masters can read campaign invitations" on public.campaign_invitations
  for select using (public.is_campaign_master(campaign_id));
create policy "players can read own campaign invitations" on public.campaign_invitations
  for select using (
    exists (select 1 from public.profiles p where p.id = profile_id and p.user_id = auth.uid())
  );
create policy "admins can read campaign invitations" on public.campaign_invitations
  for select using (public.is_admin());

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'campaign_invitations'
  ) then
    alter publication supabase_realtime add table public.campaign_invitations;
  end if;
end $$;

-- Sugestões enquanto o mestre digita: nome do personagem ou e-mail do jogador.
create or replace function public.search_campaign_candidates(p_campaign_id uuid, p_query text)
returns table (profile_id uuid, character_name text, email text, level integer, class_id text, invited boolean)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_term text := lower(btrim(coalesce(p_query, '')));
begin
  if not public.is_campaign_master(p_campaign_id) then
    raise exception 'Somente o mestre da campanha pode buscar jogadores.' using errcode = '42501';
  end if;
  if length(v_term) < 2 then
    return;
  end if;
  v_term := replace(replace(v_term, '%', ''), '_', '');

  return query
  select p.id, p.character_name, u.email::text, p.level, p.class_id,
         exists (
           select 1 from public.campaign_invitations i
           where i.campaign_id = p_campaign_id and i.profile_id = p.id and i.status = 'pending'
         )
  from public.profiles p
  join auth.users u on u.id = p.user_id
  where (lower(p.character_name) like '%' || v_term || '%' or lower(u.email) like '%' || v_term || '%')
    and not exists (select 1 from public.campaign_members m where m.profile_id = p.id)
  order by (lower(p.character_name) like v_term || '%') desc, p.character_name
  limit 8;
end;
$$;

create or replace function public.invite_campaign_member(p_campaign_id uuid, p_profile_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.is_campaign_master(p_campaign_id) then
    raise exception 'Somente o mestre da campanha pode convidar jogadores.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.campaigns where id = p_campaign_id and status = 'active') then
    raise exception 'Esta campanha foi encerrada.' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.profiles where id = p_profile_id) then
    raise exception 'Personagem não encontrado.' using errcode = 'P0002';
  end if;
  if exists (select 1 from public.campaign_members where profile_id = p_profile_id) then
    raise exception 'Esse jogador já participa de uma campanha.' using errcode = '23505';
  end if;

  select id into v_id
  from public.campaign_invitations
  where campaign_id = p_campaign_id and profile_id = p_profile_id and status = 'pending';
  if v_id is not null then
    return v_id;
  end if;

  insert into public.campaign_invitations (campaign_id, profile_id, invited_by)
  values (p_campaign_id, p_profile_id, auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.cancel_campaign_invitation(p_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_campaign uuid;
begin
  select campaign_id into v_campaign from public.campaign_invitations where id = p_invitation_id;
  if v_campaign is null or not public.is_campaign_master(v_campaign) then
    raise exception 'Convite não encontrado.' using errcode = 'P0002';
  end if;
  update public.campaign_invitations
  set status = 'cancelled', responded_at = now()
  where id = p_invitation_id and status = 'pending';
end;
$$;

create or replace function public.respond_campaign_invitation(p_invitation_id uuid, p_accept boolean)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invitation public.campaign_invitations;
begin
  select i.* into v_invitation
  from public.campaign_invitations i
  join public.profiles p on p.id = i.profile_id
  where i.id = p_invitation_id and p.user_id = auth.uid()
  for update of i;

  if not found or v_invitation.status <> 'pending' then
    raise exception 'Convite não encontrado ou já respondido.' using errcode = 'P0002';
  end if;

  if not p_accept then
    update public.campaign_invitations set status = 'declined', responded_at = now() where id = v_invitation.id;
    return 'declined';
  end if;

  if not exists (select 1 from public.campaigns where id = v_invitation.campaign_id and status = 'active') then
    update public.campaign_invitations set status = 'cancelled', responded_at = now() where id = v_invitation.id;
    raise exception 'Esta campanha já foi encerrada.' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.campaign_members where profile_id = v_invitation.profile_id) then
    raise exception 'Você já participa de uma campanha.' using errcode = '23505';
  end if;

  insert into public.campaign_members (campaign_id, profile_id) values (v_invitation.campaign_id, v_invitation.profile_id);
  update public.campaign_invitations set status = 'accepted', responded_at = now() where id = v_invitation.id;
  update public.campaign_invitations
  set status = 'cancelled', responded_at = now()
  where profile_id = v_invitation.profile_id and status = 'pending' and id <> v_invitation.id;
  return 'accepted';
end;
$$;

-- 4. Encerramento --------------------------------------------------------------------
-- Libera os jogadores (um por campanha) e mantém combates e recompensas como histórico.

create or replace function public.end_campaign(p_campaign_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_campaign_master(p_campaign_id) then
    raise exception 'Somente o mestre da campanha pode encerrá-la.' using errcode = '42501';
  end if;

  update public.combat_sessions
  set status = 'abandoned', ended_at = now(), updated_at = now()
  where campaign_id = p_campaign_id and status = 'active';

  update public.campaign_invitations
  set status = 'cancelled', responded_at = now()
  where campaign_id = p_campaign_id and status = 'pending';

  delete from public.campaign_members where campaign_id = p_campaign_id;

  update public.campaigns
  set status = 'archived', ended_at = now()
  where id = p_campaign_id and status = 'active';
end;
$$;

revoke all on function public.search_campaign_candidates(uuid, text) from public, anon;
revoke all on function public.invite_campaign_member(uuid, uuid) from public, anon;
revoke all on function public.cancel_campaign_invitation(uuid) from public, anon;
revoke all on function public.respond_campaign_invitation(uuid, boolean) from public, anon;
revoke all on function public.end_campaign(uuid) from public, anon;
grant execute on function public.search_campaign_candidates(uuid, text) to authenticated;
grant execute on function public.invite_campaign_member(uuid, uuid) to authenticated;
grant execute on function public.cancel_campaign_invitation(uuid) to authenticated;
grant execute on function public.respond_campaign_invitation(uuid, boolean) to authenticated;
grant execute on function public.end_campaign(uuid) to authenticated;
