-- Verificação das políticas das tabelas de combate (planos 05-04 e 05-08).
-- Pré-requisitos locais: usuários jogador.teste@onikara.local (com personagem)
-- e outro.teste@onikara.local (sem personagem).
-- Como rodar:
--   docker exec -i supabase_db_onikara psql -U postgres -d postgres < supabase/tests/combat_rls.sql
-- Cada verificação imprime PASS ou FAIL.

do $$
declare
  v_user uuid;
  v_other uuid;
  v_profile uuid;
  v_session uuid;
  v_count integer;
begin
  select id into v_user from auth.users where email = 'jogador.teste@onikara.local';
  select id into v_other from auth.users where email = 'outro.teste@onikara.local';
  select id into v_profile from public.profiles where user_id = v_user;

  if v_user is null or v_profile is null then
    raise notice 'FAIL: pré-requisito ausente (jogador.teste@onikara.local com personagem)';
    return;
  end if;

  insert into public.combat_sessions (profile_id, encounter_type, status, snapshot)
  values (v_profile, 'training', 'abandoned', '{}'::jsonb)
  returning id into v_session;

  -- Como o jogador dono
  perform set_config('request.jwt.claims', json_build_object('sub', v_user, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select count(*) into v_count from public.combat_sessions where id = v_session;
  raise notice '% leitura da própria sessão (%)', case when v_count = 1 then 'PASS' else 'FAIL' end, v_count;

  begin
    insert into public.combat_events (combat_session_id, turn_number, event_type, seq)
    values (v_session, 0, 'system', 9999);
    raise notice 'FAIL: jogador inseriu evento';
  exception when others then
    raise notice 'PASS: insert em combat_events bloqueado';
  end;

  begin
    insert into public.combat_sessions (profile_id, encounter_type, status, snapshot)
    values (v_profile, 'training', 'victory', '{}'::jsonb);
    raise notice 'FAIL: jogador criou sessão';
  exception when others then
    raise notice 'PASS: insert em combat_sessions bloqueado';
  end;

  begin
    update public.combat_sessions set status = 'victory' where id = v_session;
    get diagnostics v_count = row_count;
    raise notice '% update de sessão (% linhas)', case when v_count = 0 then 'PASS' else 'FAIL' end, v_count;
  exception when others then
    raise notice 'PASS: update em combat_sessions bloqueado';
  end;

  -- Verifica o privilégio em vez de chamar a função: chamar uma função sem permissão
  -- dentro de um bloco com SET ROLE derrubou o Postgres local (segfault) nesta versão.
  raise notice '% persist_combat_step não executável por authenticated', case
    when has_function_privilege('authenticated', 'public.persist_combat_step(uuid,integer,text,integer,jsonb,jsonb,jsonb)', 'execute') then 'FAIL'
    else 'PASS'
  end;

  -- Como outro usuário
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', v_other, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into v_count from public.combat_sessions where id = v_session;
  raise notice '% outro usuário não lê a sessão (%)', case when v_count = 0 then 'PASS' else 'FAIL' end, v_count;

  reset role;
  delete from public.combat_sessions where id = v_session;
end $$;
