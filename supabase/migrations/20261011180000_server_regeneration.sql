-- Regeneração calculada no servidor para todos os jogadores, sempre.
-- Até aqui a recuperação só acontecia quando o jogador abria a tela ou entrava em combate.
-- Agora um job do banco aplica a regra de recuperação ativa a cada minuto e o estado
-- salvo no perfil é sempre o estado atual; telas só leem e se atualizam ao vivo.

create or replace function public.recover_all_profiles()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile record;
  v_count integer := 0;
begin
  for v_profile in
    select p.id
    from public.profiles p
    where (
        coalesce((p.current_state ->> 'hp')::numeric, 0) < coalesce((p.current_state ->> 'max_hp')::numeric, 0)
        or coalesce((p.current_state ->> 'mana')::numeric, 0) < coalesce((p.current_state ->> 'max_mana')::numeric, 0)
      )
      -- Quem está em combate ativo tem o estado conduzido pelo combate.
      and not exists (
        select 1
        from public.combat_participants cp
        join public.combat_sessions cs on cs.id = cp.combat_session_id
        where cp.profile_id = p.id and cs.status = 'active'
      )
      and not exists (
        select 1 from public.combat_sessions cs where cs.profile_id = p.id and cs.status = 'active'
      )
  loop
    perform public.recover_profile(v_profile.id);
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

revoke all on function public.recover_all_profiles() from public, anon, authenticated;

-- O mestre força o cálculo do servidor para os jogadores da campanha ao abrir a tela.
create or replace function public.refresh_campaign_state(p_campaign_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member record;
  v_count integer := 0;
begin
  if not public.is_campaign_master(p_campaign_id) then
    raise exception 'Somente o mestre da campanha pode atualizar o estado dos jogadores.' using errcode = '42501';
  end if;
  for v_member in
    select m.profile_id
    from public.campaign_members m
    where m.campaign_id = p_campaign_id
      and not exists (
        select 1
        from public.combat_participants cp
        join public.combat_sessions cs on cs.id = cp.combat_session_id
        where cp.profile_id = m.profile_id and cs.status = 'active'
      )
  loop
    perform public.recover_profile(v_member.profile_id);
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

revoke all on function public.refresh_campaign_state(uuid) from public, anon;
grant execute on function public.refresh_campaign_state(uuid) to authenticated;

-- Job de regeneração a cada minuto (pg_cron). Em ambientes sem pg_cron a migration
-- segue; as telas continuam chamando as funções acima ao abrir.
do $$
begin
  create extension if not exists pg_cron;
  perform cron.unschedule(jobid) from cron.job where jobname = 'onikara-recover-profiles';
  perform cron.schedule('onikara-recover-profiles', '* * * * *', 'select public.recover_all_profiles()');
exception when others then
  raise notice 'pg_cron indisponível (%); regeneração só sob demanda.', sqlerrm;
end $$;
