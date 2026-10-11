-- O mestre ainda não enxerga o perfil de quem foi convidado (só dos membros), então a
-- lista de convites pendentes sai por uma função que devolve apenas os dados públicos.

create or replace function public.list_campaign_invitations(p_campaign_id uuid)
returns table (id uuid, created_at timestamptz, profile_id uuid, character_name text, level integer, class_id text)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_campaign_master(p_campaign_id) then
    raise exception 'Somente o mestre da campanha pode ver os convites.' using errcode = '42501';
  end if;
  return query
  select i.id, i.created_at, p.id, p.character_name, p.level, p.class_id
  from public.campaign_invitations i
  join public.profiles p on p.id = i.profile_id
  where i.campaign_id = p_campaign_id and i.status = 'pending'
  order by i.created_at;
end;
$$;

revoke all on function public.list_campaign_invitations(uuid) from public, anon;
grant execute on function public.list_campaign_invitations(uuid) to authenticated;
