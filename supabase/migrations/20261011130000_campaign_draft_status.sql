-- Campanha "em construção": o mestre monta (história, jogadores, missões) antes de ativar.
-- Só uma campanha ativa por mestre (índice já existente); rascunhos podem ser vários.

alter table public.campaigns drop constraint if exists campaigns_status_check;
alter table public.campaigns
  add constraint campaigns_status_check check (status in ('draft', 'active', 'archived'));

create or replace function public.activate_campaign(p_campaign_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_campaign_master(p_campaign_id) then
    raise exception 'Somente o mestre da campanha pode ativá-la.' using errcode = '42501';
  end if;
  if exists (
    select 1 from public.campaigns
    where master_user_id = auth.uid() and status = 'active' and id <> p_campaign_id
  ) then
    raise exception 'Você já tem uma campanha ativa. Encerre-a antes de ativar outra.' using errcode = 'P0001';
  end if;
  update public.campaigns
  set status = 'active'
  where id = p_campaign_id and status = 'draft';
end;
$$;

-- Convites valem enquanto a campanha estiver em construção ou ativa.
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
  if not exists (select 1 from public.campaigns where id = p_campaign_id and status in ('draft', 'active')) then
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

  if not exists (select 1 from public.campaigns where id = v_invitation.campaign_id and status in ('draft', 'active')) then
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

create or replace function public.list_my_campaign_invitations()
returns table (id uuid, created_at timestamptz, campaign_id uuid, campaign_name text, campaign_description text)
language sql
stable
security definer
set search_path = public
as $$
  select i.id, i.created_at, c.id, c.name, c.description
  from public.campaign_invitations i
  join public.profiles p on p.id = i.profile_id
  join public.campaigns c on c.id = i.campaign_id
  where p.user_id = auth.uid()
    and i.status = 'pending'
    and c.status in ('draft', 'active')
  order by i.created_at desc;
$$;

revoke all on function public.activate_campaign(uuid) from public, anon;
grant execute on function public.activate_campaign(uuid) to authenticated;
