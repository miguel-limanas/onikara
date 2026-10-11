-- E-mail dos jogadores (membros e convidados pendentes) na lista do mestre.
-- Só o mestre da campanha enxerga; o e-mail não é exposto por nenhuma outra via.

create or replace function public.campaign_player_emails(p_campaign_id uuid)
returns table (profile_id uuid, email text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, u.email::text
  from public.profiles p
  join auth.users u on u.id = p.user_id
  where public.is_campaign_master(p_campaign_id)
    and (
      exists (select 1 from public.campaign_members m where m.campaign_id = p_campaign_id and m.profile_id = p.id)
      or exists (
        select 1 from public.campaign_invitations i
        where i.campaign_id = p_campaign_id and i.profile_id = p.id and i.status = 'pending'
      )
    );
$$;

revoke all on function public.campaign_player_emails(uuid) from public, anon;
grant execute on function public.campaign_player_emails(uuid) to authenticated;
