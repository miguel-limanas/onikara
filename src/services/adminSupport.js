import { runSupabase } from './supabaseClient.js';

export function listProfiles() {
  return runSupabase((client) =>
    client.from('profiles').select('id, user_id, character_name, level, xp, class_id, race_id, current_state, created_at, updated_at').order('updated_at', { ascending: false }),
  );
}

export async function loadProfileSupport(profileId) {
  const [inventory, equipment, quests, sessions] = await Promise.all([
    runSupabase((client) => client.from('inventory').select('*').eq('profile_id', profileId)),
    runSupabase((client) => client.from('equipment').select('*').eq('profile_id', profileId)),
    runSupabase((client) => client.from('character_quests').select('*').eq('profile_id', profileId)),
    runSupabase((client) => client.from('combat_sessions').select('*').eq('profile_id', profileId).order('started_at', { ascending: false })),
  ]);

  let combatEvents = { ok: true, data: [] };
  if (sessions.ok && sessions.data[0]) {
    combatEvents = await runSupabase((client) =>
      client.from('combat_events').select('*').eq('combat_session_id', sessions.data[0].id).order('seq'),
    );
  }

  return { inventory, equipment, quests, combat_sessions: sessions, combat_events: combatEvents };
}

export async function unsupportedSupportAction() {
  return {
    ok: false,
    error: {
      code: 'deferred',
      message: 'Acao mutavel de suporte adiada ate existir RPC auditada especifica.',
    },
  };
}
