-- Campanha ao vivo: Realtime para membros e convites, e avatares dos jogadores
-- (membros e convidados) na lista do mestre.

do $$
declare
  v_table text;
begin
  foreach v_table in array array['campaign_members', 'campaign_invitations', 'campaigns']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = v_table
    ) then
      execute format('alter publication supabase_realtime add table public.%I', v_table);
    end if;
  end loop;
end $$;

-- Avatares dos membros (e, para o mestre, dos convidados pendentes) de uma campanha.
create or replace function public.campaign_avatars(p_campaign_id uuid)
returns table (profile_id uuid, avatar text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, a.avatar
  from public.profiles p
  join public.user_avatars a on a.user_id = p.user_id
  where (public.is_campaign_master(p_campaign_id) or public.is_campaign_member(p_campaign_id))
    and (
      exists (select 1 from public.campaign_members m where m.campaign_id = p_campaign_id and m.profile_id = p.id)
      or (
        public.is_campaign_master(p_campaign_id)
        and exists (
          select 1 from public.campaign_invitations i
          where i.campaign_id = p_campaign_id and i.profile_id = p.id and i.status = 'pending'
        )
      )
    );
$$;

revoke all on function public.campaign_avatars(uuid) from public, anon;
grant execute on function public.campaign_avatars(uuid) to authenticated;
