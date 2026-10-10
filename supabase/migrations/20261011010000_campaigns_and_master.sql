-- Fase 5 / plano 05-05: campanha mínima e papel do mestre.
-- O mestre atribui inimigos e magias aos jogadores da campanha e conduz o combate
-- (pela Edge Function `combat`). O admin só lê, para suporte.

-- 1. Tabelas ---------------------------------------------------------------------

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  master_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(btrim(name)) between 2 and 80),
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.campaign_members (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (campaign_id, profile_id),
  -- Um jogador participa de uma campanha por vez no MVP (D-20).
  unique (profile_id)
);

create table public.campaign_enemies (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  enemy_id text not null references public.enemies(id),
  granted_at timestamptz not null default now(),
  primary key (campaign_id, enemy_id)
);

create table public.campaign_member_spells (
  campaign_id uuid not null,
  profile_id uuid not null,
  spell_id text not null references public.spells(id),
  granted_at timestamptz not null default now(),
  primary key (campaign_id, profile_id, spell_id),
  foreign key (campaign_id, profile_id)
    references public.campaign_members (campaign_id, profile_id) on delete cascade
);

create trigger campaigns_set_updated_at before update on public.campaigns
  for each row execute function public.set_updated_at();

-- 2. Funções de apoio (SECURITY DEFINER evita recursão entre políticas) -------------

create or replace function public.is_campaign_master(p_campaign_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.campaigns
    where id = p_campaign_id and master_user_id = auth.uid()
  );
$$;

create or replace function public.is_campaign_member(p_campaign_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.campaign_members member
    join public.profiles profile on profile.id = member.profile_id
    where member.campaign_id = p_campaign_id and profile.user_id = auth.uid()
  );
$$;

create or replace function public.is_master_of_profile(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.campaign_members member
    join public.campaigns campaign on campaign.id = member.campaign_id
    where member.profile_id = p_profile_id and campaign.master_user_id = auth.uid()
  );
$$;

-- 3. Sessões de campanha ----------------------------------------------------------

alter table public.combat_sessions add column if not exists campaign_id uuid references public.campaigns(id);
alter table public.combat_sessions alter column profile_id drop not null;
alter table public.combat_sessions
  add constraint combat_sessions_owner_check check (profile_id is not null or campaign_id is not null);

drop index if exists public.combat_sessions_one_active_per_profile;
create unique index combat_sessions_one_active_per_profile
  on public.combat_sessions (profile_id)
  where status = 'active' and campaign_id is null;
create unique index combat_sessions_one_active_per_campaign
  on public.combat_sessions (campaign_id)
  where status = 'active' and campaign_id is not null;

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
        or (session.campaign_id is not null and exists (
          select 1 from public.campaigns c where c.id = session.campaign_id and c.master_user_id = auth.uid()
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

drop policy if exists "users can read own combat sessions" on public.combat_sessions;
drop policy if exists "users can read own combat participants" on public.combat_participants;
drop policy if exists "users can read own combat events" on public.combat_events;

create policy "participants and masters can read combat sessions" on public.combat_sessions
  for select using (public.can_view_combat(id));
create policy "participants and masters can read combat participants" on public.combat_participants
  for select using (public.can_view_combat(combat_session_id));
create policy "participants and masters can read combat events" on public.combat_events
  for select using (public.can_view_combat(combat_session_id));

-- 4. RLS das tabelas novas ---------------------------------------------------------

alter table public.campaigns enable row level security;
alter table public.campaign_members enable row level security;
alter table public.campaign_enemies enable row level security;
alter table public.campaign_member_spells enable row level security;

create policy "masters and members can read campaigns" on public.campaigns
  for select using (master_user_id = auth.uid() or public.is_campaign_member(id));
create policy "admins can read campaigns" on public.campaigns
  for select using (public.is_admin());
create policy "masters can create campaigns" on public.campaigns
  for insert with check (public.is_master() and master_user_id = auth.uid());
create policy "masters can update own campaigns" on public.campaigns
  for update using (master_user_id = auth.uid()) with check (master_user_id = auth.uid());

create policy "masters and members can read campaign members" on public.campaign_members
  for select using (public.is_campaign_master(campaign_id) or public.is_campaign_member(campaign_id));
create policy "admins can read campaign members" on public.campaign_members
  for select using (public.is_admin());
create policy "masters can remove campaign members" on public.campaign_members
  for delete using (public.is_campaign_master(campaign_id));

create policy "masters and members can read campaign enemies" on public.campaign_enemies
  for select using (public.is_campaign_master(campaign_id) or public.is_campaign_member(campaign_id));
create policy "admins can read campaign enemies" on public.campaign_enemies
  for select using (public.is_admin());
create policy "masters can manage campaign enemies" on public.campaign_enemies
  for all using (public.is_campaign_master(campaign_id)) with check (public.is_campaign_master(campaign_id));

create policy "masters and members can read granted spells" on public.campaign_member_spells
  for select using (
    public.is_campaign_master(campaign_id)
    or exists (
      select 1 from public.profiles p where p.id = profile_id and p.user_id = auth.uid()
    )
  );
create policy "admins can read granted spells" on public.campaign_member_spells
  for select using (public.is_admin());
create policy "masters can manage granted spells" on public.campaign_member_spells
  for all using (public.is_campaign_master(campaign_id)) with check (public.is_campaign_master(campaign_id));

-- O mestre lê os perfis dos jogadores da própria campanha.
create policy "masters can read campaign member profiles" on public.profiles
  for select using (public.is_master_of_profile(id));

-- 5. Convite de jogador pelo nome do personagem -------------------------------------

create or replace function public.add_campaign_member(p_campaign_id uuid, p_character_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_matches integer;
  v_profile uuid;
begin
  if not public.is_campaign_master(p_campaign_id) then
    raise exception 'Somente o mestre da campanha pode convidar jogadores.' using errcode = '42501';
  end if;

  select count(*), min(id::text)::uuid into v_matches, v_profile
  from public.profiles
  where lower(btrim(character_name)) = lower(btrim(p_character_name));

  if v_matches = 0 then
    raise exception 'Nenhum personagem com esse nome.' using errcode = 'P0002';
  elsif v_matches > 1 then
    raise exception 'Mais de um personagem com esse nome.' using errcode = 'P0003';
  end if;

  if exists (select 1 from public.campaign_members where profile_id = v_profile) then
    raise exception 'Esse jogador já participa de uma campanha.' using errcode = '23505';
  end if;

  insert into public.campaign_members (campaign_id, profile_id) values (p_campaign_id, v_profile);
  return v_profile;
end;
$$;

revoke all on function public.add_campaign_member(uuid, text) from public, anon;
grant execute on function public.add_campaign_member(uuid, text) to authenticated;
