import {
  applyAction,
  buildCatalog,
  buildRules,
  createCombat,
  buildParticipants,
  listActions,
  runUntilPlayerTurn,
} from '../engine/combat/index.js';
import { runSupabase, supabase } from './supabaseClient.js';

// Treino local: o motor roda no navegador, sem gravar nada e sem recompensas.
// A autoridade real (servidor) entra no plano 05-04; esta interface de "driver" é a mesma.

export const TEST_ACCOUNT_DOMAIN = '@onikara.local';


export function isTestAccount(session) {
  return String(session?.user?.email || '').toLowerCase().endsWith(TEST_ACCOUNT_DOMAIN);
}

function failure(result) {
  return { ok: false, data: null, error: result.error };
}

// Carrega regras e catálogos usados pelo combate (todos de leitura pública ou do próprio jogador).
export async function loadCombatContext(profile) {
  const [combatRules, manaRules, elements, statusEffects, spells, items, enemies, enemySpells, classSpells, rpgClass, owned, inventory, equipment] =
    await Promise.all([
      runSupabase((client) => client.from('active_combat_rules').select('*').maybeSingle()),
      runSupabase((client) => client.from('active_mana_rules').select('*').maybeSingle()),
      runSupabase((client) => client.from('elements').select('*')),
      runSupabase((client) => client.from('status_effects').select('*')),
      runSupabase((client) => client.from('spells').select('*')),
      runSupabase((client) => client.from('items').select('*')),
      runSupabase((client) => client.from('enemies').select('*').order('level').order('name')),
      runSupabase((client) => client.from('enemy_spells').select('*')),
      runSupabase((client) => client.from('class_spells').select('*').eq('class_id', profile.class_id)),
      runSupabase((client) => client.from('rpg_classes').select('*').eq('id', profile.class_id).maybeSingle()),
      runSupabase((client) => client.from('character_spells').select('*').eq('profile_id', profile.id)),
      runSupabase((client) => client.from('inventory').select('*').eq('profile_id', profile.id)),
      runSupabase((client) => client.from('equipment').select('*').eq('profile_id', profile.id)),
    ]);

  for (const result of [elements, statusEffects, spells, items, enemies, enemySpells, classSpells, rpgClass, owned, inventory, equipment]) {
    if (!result.ok) return failure(result);
  }
  if (!rpgClass.data) {
    return { ok: false, data: null, error: { code: 'missing_class', message: 'Classe do personagem não encontrada.' } };
  }

  return {
    ok: true,
    error: null,
    data: {
      rows: {
        combatRules: combatRules.ok ? combatRules.data : null,
        manaRules: manaRules.ok ? manaRules.data : null,
        elements: elements.data,
        statusEffects: statusEffects.data,
        spells: spells.data,
        items: items.data,
        enemies: enemies.data,
        enemySpells: enemySpells.data,
      },
      classSpells: classSpells.data,
      rpgClass: rpgClass.data,
      characterSpells: owned.data,
      inventory: inventory.data,
      equipment: equipment.data,
    },
  };
}

function newSeed() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `local-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

// Driver local: mesma forma que o driver remoto terá no 05-04.
export function createLocalDriver(context, profile, { enemyIds, seed = newSeed() }) {
  const setup = createCombat({
    seed,
    rules: buildRules(context.rows),
    catalog: buildCatalog(context.rows),
    participants: buildParticipants(context, profile, { enemyIds }),
  });
  let state = setup.state;
  let log = [...setup.events];

  function settle() {
    const result = runUntilPlayerTurn(state);
    state = result.state;
    log = log.concat(result.events);
    return result.events;
  }

  const initial = settle();

  return {
    kind: 'local',
    seed,
    getState: () => state,
    getLog: () => log,
    actionsFor: (actorId) => listActions(state, actorId),
    initialEvents: [...setup.events, ...initial],
    async act(action) {
      const step = applyAction(state, action);
      state = step.state;
      log = log.concat(step.events);
      const enemyEvents = settle();
      return { state, events: step.events.concat(enemyEvents) };
    },
  };
}

// ---- Combate autoritativo (Edge Function `combat`, plano 05-04) ------------------------

async function callCombat(body) {
  try {
    const { data, error } = await supabase.functions.invoke('combat', { body });
    if (error) {
      let detail = null;
      try {
        detail = await error.context?.json?.();
      } catch {
        detail = null;
      }
      if (detail?.error) return { ok: false, data: detail, error: detail.error };
      return {
        ok: false,
        data: null,
        error: { code: 'unavailable', message: 'O servidor de combate não respondeu. Tente de novo em instantes.' },
      };
    }
    if (data?.ok === false) return { ok: false, data, error: data.error };
    return { ok: true, data, error: null };
  } catch {
    return {
      ok: false,
      data: null,
      error: { code: 'unavailable', message: 'O servidor de combate não respondeu. Tente de novo em instantes.' },
    };
  }
}

export function fetchActiveCombat() {
  return callCombat({ op: 'state' });
}

export function startRemoteCombat(enemyIds) {
  return callCombat({ op: 'start', enemyIds });
}

export function abandonRemoteCombat(sessionId) {
  return callCombat({ op: 'abandon', sessionId });
}

export async function loadSessionLog(sessionId) {
  const result = await runSupabase((client) =>
    client
      .from('combat_events')
      .select('event_type, actor_participant_id, target_participant_id, turn_number, payload, seq')
      .eq('combat_session_id', sessionId)
      .order('seq'),
  );
  if (!result.ok) return [];
  return result.data.map((row) => ({
    type: row.event_type,
    round: row.turn_number,
    actorId: row.actor_participant_id,
    targetId: row.target_participant_id,
    payload: row.payload || {},
  }));
}

// Mesma forma do driver local; as decisões vêm do servidor e o estado é só espelhado aqui.
export function createRemoteDriver(view, { log = [] } = {}) {
  let current = view;
  let events = [...log, ...(view.events || [])];

  return {
    kind: 'remote',
    sessionId: view.sessionId,
    getState: () => current.state,
    getLog: () => events,
    getVersion: () => current.version,
    actionsFor: (actorId) => listActions(current.state, actorId),
    initialEvents: events,
    async act(action) {
      const { actorId, ...move } = action;
      const result = await callCombat({
        op: 'act',
        sessionId: current.sessionId,
        version: current.version,
        move,
      });
      if (!result.ok) {
        if (result.error?.code === 'version_conflict' && result.data?.current) current = result.data.current;
        const error = new Error(result.error?.message || 'Ação recusada pelo servidor.');
        error.code = result.error?.code;
        throw error;
      }
      current = result.data;
      events = events.concat(result.data.events || []);
      return { state: current.state, events: result.data.events || [] };
    },
  };
}
