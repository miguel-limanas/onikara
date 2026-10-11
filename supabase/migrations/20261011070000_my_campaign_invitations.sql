-- O convidado ainda não lê a campanha (só mestre e membros leem), então os convites
-- recebidos saem por uma função que devolve apenas nome e história da campanha.

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
    and c.status = 'active'
  order by i.created_at desc;
$$;

revoke all on function public.list_my_campaign_invitations() from public, anon;
grant execute on function public.list_my_campaign_invitations() to authenticated;
