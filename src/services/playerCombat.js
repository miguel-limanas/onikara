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
    getViewer: () => ({ role: 'player', participantId: 'player-1' }),
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

// ---- Combate autoritativo (Edge Function `combat`, planos 05-04 e 05-05) ------------------

const UNAVAILABLE = {
  code: 'unavailable',
  message: 'O servidor de combate não respondeu. Tente de novo em instantes.',
};

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
      return { ok: false, data: null, error: UNAVAILABLE };
    }
    if (data?.ok === false) return { ok: false, data, error: data.error };
    return { ok: true, data, error: null };
  } catch {
    return { ok: false, data: null, error: UNAVAILABLE };
  }
}

// Jogador: combate ativo (solo ou da campanha). Mestre: informe campaignId.
export function fetchActiveCombat({ campaignId, sessionId } = {}) {
  return callCombat({ op: 'state', campaignId, sessionId });
}

export function startRemoteCombat(enemyIds) {
  return callCombat({ op: 'start', enemyIds });
}

export function startCampaignCombat(campaignId, enemyIds) {
  return callCombat({ op: 'start', campaignId, enemyIds });
}

export function abandonRemoteCombat(sessionId, { campaignId } = {}) {
  return callCombat({ op: 'abandon', sessionId, campaignId });
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
  return result.data.map((row) => toEngineEvent(row));
}

export function toEngineEvent(row) {
  return {
    type: row.event_type,
    round: row.turn_number,
    actorId: row.actor_participant_id,
    targetId: row.target_participant_id,
    payload: row.payload || {},
    seq: row.seq ?? null,
  };
}

// Mesma forma do driver local; as decisões vêm do servidor e o estado é só espelhado aqui.
// Com `campaignId` o driver age como mestre (pelo inimigo da vez).
export function createRemoteDriver(view, { log = [], campaignId = null } = {}) {
  let current = view;
  let events = [...log, ...(view.events || [])];
  const known = new Set(events.map((event) => event.seq).filter((seq) => seq !== null));

  return {
    kind: 'remote',
    get sessionId() {
      return current.sessionId;
    },
    getState: () => current.state,
    getViewer: () => current.viewer || { role: 'player', participantId: null },
    getLog: () => events,
    getVersion: () => current.version,
    actionsFor: (actorId) => listActions(current.state, actorId),
    async act(action) {
      const { actorId, ...move } = action;
      const result = await callCombat({
        op: 'act',
        campaignId,
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
      const fresh = result.data.events || [];
      events = events.concat(fresh);
      return { state: current.state, events: fresh };
    },
    async suggest() {
      const result = await callCombat({ op: 'suggest', campaignId });
      if (!result.ok) throw new Error(result.error?.message || 'Sem sugestão disponível.');
      return result.data.move;
    },
    // Reconsulta o servidor (usado por Realtime e polling). Devolve true se algo mudou.
    async sync() {
      const result = await fetchActiveCombat({ campaignId, sessionId: current.sessionId });
      if (!result.ok || !result.data.state) return { changed: false, ended: false };
      if (result.data.version === current.version) return { changed: false, ended: current.status !== 'active' };
      current = result.data;
      return { changed: true, ended: result.data.status !== 'active' };
    },
    knownSeqs: known,
  };
}

// ---- Realtime (plano 05-06) ----------------------------------------------------------
// Escuta eventos e a sessão; a RLS de leitura garante que só participantes e o mestre recebem.
// Em caso de falha do canal, cai para consulta periódica (sem erro visível).

let activeWatch = null;

export function watchCombat(sessionId, { onChange, onStatus = () => {}, pollMs = 4000 }) {
  if (activeWatch) activeWatch();
  let closed = false;
  let timer = null;
  let live = false;

  function startPolling() {
    if (timer || closed) return;
    timer = setInterval(() => onChange(), pollMs);
  }

  function stopPolling() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  const channel = supabase
    .channel(`combat:${sessionId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'combat_events', filter: `combat_session_id=eq.${sessionId}` },
      () => onChange(),
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'combat_sessions', filter: `id=eq.${sessionId}` },
      () => onChange(),
    )
    .subscribe((status) => {
      if (closed) return;
      if (status === 'SUBSCRIBED') {
        live = true;
        stopPolling();
        onStatus('live');
        onChange();
      } else if (['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(status)) {
        live = false;
        onStatus('polling');
        startPolling();
      }
    });

  // Se o canal não confirmar em alguns segundos, usa a consulta periódica.
  const fallback = setTimeout(() => {
    if (!live && !closed) {
      onStatus('polling');
      startPolling();
    }
  }, 6000);

  const stop = () => {
    closed = true;
    clearTimeout(fallback);
    stopPolling();
    supabase.removeChannel(channel);
    if (activeWatch === stop) activeWatch = null;
  };
  activeWatch = stop;
  return stop;
}
