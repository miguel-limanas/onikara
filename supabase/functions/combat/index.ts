// Edge Function `combat`: autoridade do combate (D-01, D-09).
// Usa o mesmo motor do navegador. A chave de serviço existe somente aqui, no servidor.
import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  applyAction,
  buildCatalog,
  buildParticipants,
  buildRules,
  CombatError,
  createCombat,
  getActiveParticipant,
  runUntilPlayerTurn,
} from '../../../src/engine/combat/index.js';

// deno-lint-ignore-file no-explicit-any
const TEST_DOMAIN = '@onikara.local';
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ||
  'http://127.0.0.1:4173,http://localhost:4173').split(',');

function corsHeaders(request: Request) {
  const origin = request.headers.get('origin') || '';
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

function json(request: Request, status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request), 'Content-Type': 'application/json' },
  });
}

function fail(request: Request, status: number, code: string, message: string, extra: Record<string, unknown> = {}) {
  return json(request, status, { ok: false, error: { code, message }, ...extra });
}

async function must<T>(promise: PromiseLike<{ data: T; error: any }>): Promise<T> {
  const { data, error } = await promise;
  if (error) throw new Error(error.message || 'Falha ao consultar o banco.');
  return data;
}

async function loadCatalogRows(admin: any, profile: any) {
  const [combatRules, manaRules, elements, statusEffects, spells, items, enemies, enemySpells, classSpells, rpgClass, characterSpells, inventory, equipment] =
    await Promise.all([
      admin.from('active_combat_rules').select('*').maybeSingle(),
      admin.from('active_mana_rules').select('*').maybeSingle(),
      admin.from('elements').select('*'),
      admin.from('status_effects').select('*'),
      admin.from('spells').select('*'),
      admin.from('items').select('*'),
      admin.from('enemies').select('*'),
      admin.from('enemy_spells').select('*'),
      admin.from('class_spells').select('*').eq('class_id', profile.class_id),
      admin.from('rpg_classes').select('*').eq('id', profile.class_id).maybeSingle(),
      admin.from('character_spells').select('*').eq('profile_id', profile.id),
      admin.from('inventory').select('*').eq('profile_id', profile.id),
      admin.from('equipment').select('*').eq('profile_id', profile.id),
    ]);
  for (const result of [elements, statusEffects, spells, items, enemies, enemySpells, classSpells, rpgClass, characterSpells, inventory, equipment]) {
    if (result.error) throw new Error(result.error.message);
  }
  return {
    rows: {
      combatRules: combatRules.data,
      manaRules: manaRules.data,
      elements: elements.data,
      statusEffects: statusEffects.data,
      spells: spells.data,
      items: items.data,
      enemies: enemies.data,
      enemySpells: enemySpells.data,
    },
    classSpells: classSpells.data,
    rpgClass: rpgClass.data,
    characterSpells: characterSpells.data,
    inventory: inventory.data,
    equipment: equipment.data,
  };
}

// Estado do motor <-> tabelas: participantes guardam atributos e efeitos; o resto vai no snapshot.
function toStorage(state: any) {
  const meta: Record<string, unknown> = {};
  for (const participant of state.participants) {
    meta[participant.id] = {
      team: participant.team,
      name: participant.name,
      refType: participant.refType,
      refId: participant.refId,
      elementId: participant.elementId,
      shield: participant.shield,
      spells: participant.spells,
      spellWeights: participant.spellWeights,
      items: participant.items,
      behavior: participant.behavior,
      weaponDie: participant.weaponDie,
      flags: participant.flags,
    };
  }
  return {
    participants: state.participants.map((participant: any) => ({
      id: participant.id,
      current_stats: participant.stats,
      status_effects: participant.statuses,
    })),
    snapshot: {
      version: 1,
      engine: {
        seed: state.seed,
        rngCursor: state.rngCursor,
        round: state.round,
        order: state.order,
        activeIndex: state.activeIndex,
        status: state.status,
        rules: state.rules,
        catalog: state.catalog,
        cooldowns: state.cooldowns,
        participantIds: state.participants.map((participant: any) => participant.id),
      },
      meta,
    },
  };
}

function fromStorage(session: any, participantRows: any[]) {
  const { engine, meta } = session.snapshot;
  const byId = new Map(participantRows.map((row) => [row.id, row]));
  return {
    version: engine ? 1 : 0,
    seed: engine.seed,
    rngCursor: engine.rngCursor,
    round: engine.round,
    order: engine.order,
    activeIndex: engine.activeIndex,
    status: engine.status,
    rules: engine.rules,
    catalog: engine.catalog,
    cooldowns: engine.cooldowns,
    participants: engine.participantIds.map((id: string) => {
      const row: any = byId.get(id);
      const info: any = meta[id];
      return {
        id,
        ...info,
        stats: row.current_stats,
        statuses: row.status_effects,
      };
    }),
  };
}

function toEventRows(events: any[]) {
  return events.map((event, index) => ({
    idx: index + 1,
    turn_number: event.round,
    actor_participant_id: event.actorId,
    target_participant_id: event.targetId,
    event_type: event.type,
    payload: event.payload,
  }));
}

function publicView(session: any, state: any, events: any[] = []) {
  return {
    sessionId: session.id,
    version: session.version,
    status: state.status,
    round: state.round,
    state,
    events,
  };
}

async function persist(admin: any, sessionId: string, expectedVersion: number, state: any, events: any[]) {
  const storage = toStorage(state);
  const { data, error } = await admin.rpc('persist_combat_step', {
    p_session_id: sessionId,
    p_expected_version: expectedVersion,
    p_status: state.status,
    p_turn_number: state.round,
    p_snapshot: storage.snapshot,
    p_participants: storage.participants,
    p_events: toEventRows(events),
  });
  if (error) {
    if (String(error.message).includes('combat_version_conflict')) {
      throw new CombatError('version_conflict', 'O combate mudou. Atualize e tente de novo.');
    }
    throw new Error(error.message);
  }
  return data as number;
}

async function loadActiveSession(admin: any, profileId: string, sessionId?: string) {
  let query = admin.from('combat_sessions').select('*').eq('profile_id', profileId).eq('status', 'active');
  if (sessionId) query = query.eq('id', sessionId);
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const participants = await must(admin.from('combat_participants').select('*').eq('combat_session_id', data.id));
  return { session: data, state: fromStorage(data, participants as any[]) };
}

async function startCombat(request: Request, admin: any, profile: any, body: any, isTest: boolean) {
  if (!isTest) {
    return fail(request, 403, 'not_allowed', 'Os combates são iniciados pelo mestre da sua campanha.');
  }
  const enemyIds: string[] = Array.isArray(body.enemyIds) ? body.enemyIds.slice(0, 3) : [];
  if (!enemyIds.length) return fail(request, 422, 'invalid_enemies', 'Escolha ao menos um inimigo.');

  const existing = await loadActiveSession(admin, profile.id);
  if (existing) {
    return json(request, 200, { ok: true, resumed: true, ...publicView(existing.session, existing.state) });
  }

  const data: any = await loadCatalogRows(admin, profile);
  if (!data.rpgClass) return fail(request, 422, 'missing_class', 'Classe do personagem não encontrada.');
  const known = new Set(data.rows.enemies.map((enemy: any) => enemy.id));
  if (enemyIds.some((id) => !known.has(id))) return fail(request, 422, 'invalid_enemies', 'Inimigo desconhecido.');

  const participants = buildParticipants(data, profile, {
    enemyIds,
    idFor: () => crypto.randomUUID(),
  });
  const setup = createCombat({
    seed: crypto.randomUUID(),
    rules: buildRules(data.rows),
    catalog: buildCatalog(data.rows),
    participants,
  });
  const settled = runUntilPlayerTurn(setup.state);
  const events = [...setup.events, ...settled.events];
  const state = settled.state;

  const created: any = await must(
    admin
      .from('combat_sessions')
      .insert({
        profile_id: profile.id,
        encounter_type: 'training',
        status: 'active',
        turn_number: state.round,
        seed: state.seed,
        snapshot: {},
      })
      .select('*')
      .single(),
  );

  try {
    await must(
      admin.from('combat_participants').insert(
        state.participants.map((participant: any, index: number) => ({
          id: participant.id,
          combat_session_id: created.id,
          participant_type: participant.refType === 'profile' ? 'profile' : 'enemy',
          profile_id: participant.refType === 'profile' ? participant.refId : null,
          enemy_id: participant.refType === 'enemy' ? participant.refId : null,
          display_name: participant.name,
          team: participant.team,
          turn_order: index,
          current_stats: participant.stats,
          status_effects: participant.statuses,
        })),
      ),
    );
    const version = await persist(admin, created.id, 0, state, events);
    return json(request, 200, {
      ok: true,
      resumed: false,
      ...publicView({ ...created, version }, state, events),
    });
  } catch (error) {
    await admin.from('combat_sessions').delete().eq('id', created.id);
    throw error;
  }
}

async function act(request: Request, admin: any, profile: any, body: any) {
  const loaded = await loadActiveSession(admin, profile.id, body.sessionId);
  if (!loaded) return fail(request, 404, 'no_session', 'Combate não encontrado ou já encerrado.');
  const { session, state } = loaded;
  if (Number(body.version) !== session.version) {
    return fail(request, 409, 'version_conflict', 'O combate mudou. Atualize e tente de novo.', {
      current: publicView(session, state),
    });
  }

  const mine = state.participants.find((participant: any) => participant.refType === 'profile' && participant.refId === profile.id);
  if (!mine) return fail(request, 403, 'not_participant', 'Você não participa deste combate.');
  const action = body.move || {};
  const allowedKeys = ['type', 'spellId', 'targetId', 'itemId'];
  const clean: any = { actorId: mine.id };
  for (const key of allowedKeys) if (typeof action[key] === 'string') clean[key] = action[key];

  const step = applyAction(state, clean);
  const settled = runUntilPlayerTurn(step.state);
  const events = [...step.events, ...settled.events];
  const version = await persist(admin, session.id, session.version, settled.state, events);
  return json(request, 200, { ok: true, ...publicView({ ...session, version }, settled.state, events) });
}

async function abandon(request: Request, admin: any, profile: any, body: any) {
  const loaded = await loadActiveSession(admin, profile.id, body.sessionId);
  if (!loaded) return fail(request, 404, 'no_session', 'Combate não encontrado ou já encerrado.');
  const { session, state } = loaded;
  const next = { ...state, status: 'abandoned' };
  const events = [{ type: 'system', round: state.round, actorId: null, targetId: null, payload: { kind: 'abandoned' } }];
  const version = await persist(admin, session.id, session.version, next, events);
  return json(request, 200, { ok: true, ...publicView({ ...session, version }, next, events) });
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(request) });
  if (request.method !== 'POST') return fail(request, 405, 'method_not_allowed', 'Método não permitido.');

  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authorization = request.headers.get('Authorization') || '';

    const userClient = createClient(url, anon, { global: { headers: { Authorization: authorization } } });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return fail(request, 401, 'unauthenticated', 'Sessão expirada. Entre novamente.');

    const admin = createClient(url, service, { auth: { persistSession: false } });
    const profile: any = await must(admin.from('profiles').select('*').eq('user_id', userData.user.id).maybeSingle());
    if (!profile) return fail(request, 404, 'no_profile', 'Crie seu personagem antes de lutar.');

    const body = await request.json().catch(() => ({}));
    const isTest = String(userData.user.email || '').toLowerCase().endsWith(TEST_DOMAIN);

    switch (body.op) {
      case 'start':
        return await startCombat(request, admin, profile, body, isTest);
      case 'state': {
        const loaded = await loadActiveSession(admin, profile.id);
        if (!loaded) return json(request, 200, { ok: true, active: false });
        return json(request, 200, { ok: true, active: true, ...publicView(loaded.session, loaded.state) });
      }
      case 'act':
        return await act(request, admin, profile, body);
      case 'abandon':
        return await abandon(request, admin, profile, body);
      default:
        return fail(request, 400, 'unknown_action', 'Ação desconhecida.');
    }
  } catch (error) {
    if (error instanceof CombatError) {
      return fail(request, 422, (error as any).code, error.message);
    }
    console.error('combat function error', error);
    return fail(request, 500, 'internal_error', 'Não foi possível processar o combate agora.');
  }
});
