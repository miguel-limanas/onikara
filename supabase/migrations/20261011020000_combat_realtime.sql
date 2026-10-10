-- Fase 5 / plano 05-06: Realtime do combate.
-- O estado de combate é lido por mestre e jogadores da sessão; Realtime respeita a RLS
-- de leitura (can_view_combat). A escrita continua só pela Edge Function.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'combat_sessions'
  ) then
    alter publication supabase_realtime add table public.combat_sessions;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'combat_events'
  ) then
    alter publication supabase_realtime add table public.combat_events;
  end if;
end $$;
