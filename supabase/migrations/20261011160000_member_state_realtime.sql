-- Realtime do estado dos jogadores para o mestre: equipamento, efeitos e perfil (HP/mana).
-- A RLS decide quem recebe: cada jogador o próprio e o mestre os da sua campanha.

do $$
declare
  v_table text;
begin
  foreach v_table in array array['equipment', 'character_status_effects', 'profiles']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = v_table
    ) then
      execute format('alter publication supabase_realtime add table public.%I', v_table);
    end if;
  end loop;
end $$;
