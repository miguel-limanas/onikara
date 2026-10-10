// Edge Function `combat`: autoridade do combate (D-01, D-09).
// Usa o mesmo motor do navegador. A chave de serviço existe somente aqui, no servidor.
//
// Operações (campo `op`):
//   start    – solo (contas de teste) ou, com `campaignId`, combate da campanha iniciado pelo mestre
//   state    – combate ativo do jogador, ou da campanha (`campaignId`) para o mestre
//   act      – ação (`move`) do jogador na própria vez; o mestre age pelos inimigos
//   suggest  – o mestre pede a sugestão da IA para o inimigo da vez
//   abandon  – encerra o combate (jogador solo ou mestre)
import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  applyAction,
  buildCatalog,
  buildEnemyParticipants,
  buildParticipants,
  buildPlayerParticipant,
  buildRules,
  chooseEnemyAction,
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
    version: 1,
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

function publicView(session: any, state: any, viewer: any, events: any[] = []) {
  return {
    sessionId: session.id,
    campaignId: session.campaign_id || null,
    version: session.version,
    status: state.status,
    round: state.round,
    viewer,
    state,
    events,
  };
}

function viewerFor(state: any, profile: any, isMaster: boolean) {
  if (isMaster) return { role: 'master', participantId: null };
  const mine = state.participants.find((p: any) => p.refType === 'profile' && p.refId === profile?.id);
  return { role: 'player', participantId: mine?.id || null };
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

async function hydrate(admin: any, session: any) {
  const participants = await must(admin.from('combat_participants').select('*').eq('combat_session_id', session.id));
  return { session, state: fromStorage(session, participants as any[]) };
}

// Combate ativo do jogador: solo ou da campanha em que ele é participante.
async function loadPlayerSession(admin: any, profile: any, sessionId?: string) {
  let solo = admin
    .from('combat_sessions')
    .select('*')
    .eq('profile_id', profile.id)
    .eq('status', 'active')
    .is('campaign_id', null);
  if (sessionId) solo = solo.eq('id', sessionId);
  const own = await must(solo.maybeSingle());
  if (own) return hydrate(admin, own);

  const rows: any[] = await must(admin.from('combat_participants').select('combat_session_id').eq('profile_id', profile.id));
  const ids = rows.map((row) => row.combat_session_id);
  if (!ids.length) return null;
  let query = admin.from('combat_sessions').select('*').in('id', ids).eq('status', 'active').not('campaign_id', 'is', null);
  if (sessionId) query = query.eq('id', sessionId);
  const shared = await must(query.maybeSingle());
  return shared ? hydrate(admin, shared) : null;
}

async function loadCampaignSession(admin: any, campaignId: string) {
  const session = await must(
    admin.from('combat_sessions').select('*').eq('campaign_id', campaignId).eq('status', 'active').maybeSingle(),
  );
  return session ? hydrate(admin, session) : null;
}

async function ownedCampaign(admin: any, userId: string, campaignId: string) {
  const campaign: any = await must(admin.from('campaigns').select('*').eq('id', campaignId).maybeSingle());
  if (!campaign || campaign.master_user_id !== userId) return null;
  return campaign;
}

async function insertParticipants(admin: any, sessionId: string, state: any) {
  await must(
    admin.from('combat_participants').insert(
      state.participants.map((participant: any, index: number) => ({
        id: participant.id,
        combat_session_id: sessionId,
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
}

async function startSolo(request: Request, admin: any, profile: any, body: any, isTest: boolean) {
  if (!isTest) {
    return fail(request, 403, 'not_allowed', 'Os combates são iniciados pelo mestre da sua campanha.');
  }
  const enemyIds: string[] = Array.isArray(body.enemyIds) ? body.enemyIds.slice(0, 3) : [];
  if (!enemyIds.length) return fail(request, 422, 'invalid_enemies', 'Escolha ao menos um inimigo.');

  const existing = await loadPlayerSession(admin, profile);
  if (existing) {
    const viewer = viewerFor(existing.state, profile, false);
    return json(request, 200, { ok: true, resumed: true, ...publicView(existing.session, existing.state, viewer) });
  }

  const data: any = await loadCatalogRows(admin, profile);
  if (!data.rpgClass) return fail(request, 422, 'missing_class', 'Classe do personagem não encontrada.');
  const known = new Set(data.rows.enemies.map((enemy: any) => enemy.id));
  if (enemyIds.some((id) => !known.has(id))) return fail(request, 422, 'invalid_enemies', 'Inimigo desconhecido.');

  const participants = buildParticipants(data, profile, { enemyIds, idFor: () => crypto.randomUUID() });
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
    await insertParticipants(admin, created.id, state);
    const version = await persist(admin, created.id, 0, state, events);
    return json(request, 200, {
      ok: true,
      resumed: false,
      ...publicView({ ...created, version }, state, viewerFor(state, profile, false), events),
    });
  } catch (error) {
    await admin.from('combat_sessions').delete().eq('id', created.id);
    throw error;
  }
}

// Combate da campanha: o mestre escolhe inimigos liberados; todos os membros entram.
async function startCampaign(request: Request, admin: any, user: any, body: any) {
  const campaign = await ownedCampaign(admin, user.id, String(body.campaignId));
  if (!campaign || user.app_metadata?.app_role !== 'master') {
    return fail(request, 403, 'not_master', 'Somente o mestre da campanha pode iniciar o combate.');
  }
  const existing = await loadCampaignSession(admin, campaign.id);
  if (existing) {
    return json(request, 200, {
      ok: true,
      resumed: true,
      ...publicView(existing.session, existing.state, viewerFor(existing.state, null, true)),
    });
  }

  const enemyIds: string[] = Array.isArray(body.enemyIds) ? body.enemyIds.slice(0, 4) : [];
  if (!enemyIds.length) return fail(request, 422, 'invalid_enemies', 'Escolha ao menos um inimigo.');
  const released: any[] = await must(admin.from('campaign_enemies').select('enemy_id').eq('campaign_id', campaign.id));
  const allowed = new Set(released.map((row) => row.enemy_id));
  if (enemyIds.some((id) => !allowed.has(id))) {
    return fail(request, 422, 'enemy_not_released', 'Libere o inimigo para a campanha antes de usá-lo.');
  }

  const members: any[] = await must(admin.from('campaign_members').select('profile_id').eq('campaign_id', campaign.id));
  if (!members.length) return fail(request, 422, 'no_members', 'A campanha ainda não tem jogadores.');
  const profiles: any[] = await must(admin.from('profiles').select('*').in('id', members.map((m) => m.profile_id)));
  const granted: any[] = await must(admin.from('campaign_member_spells').select('*').eq('campaign_id', campaign.id));

  let shared: any = null;
  const players: any[] = [];
  for (const profile of profiles) {
    const data: any = await loadCatalogRows(admin, profile);
    if (!data.rpgClass) continue;
    shared = shared || data;
    players.push(
      buildPlayerParticipant(data, profile, {
        id: crypto.randomUUID(),
        extraSpellIds: granted.filter((row) => row.profile_id === profile.id).map((row) => row.spell_id),
      }),
    );
  }
  if (!shared || !players.length) return fail(request, 422, 'no_members', 'Nenhum jogador com personagem válido.');

  const enemies = buildEnemyParticipants(shared.rows, { enemyIds, idFor: () => crypto.randomUUID() });
  const setup = createCombat({
    seed: crypto.randomUUID(),
    rules: buildRules(shared.rows),
    catalog: buildCatalog(shared.rows),
    participants: [...players, ...enemies],
  });
  const state = setup.state;

  const created: any = await must(
    admin
      .from('combat_sessions')
      .insert({
        profile_id: null,
        campaign_id: campaign.id,
        encounter_type: 'pve',
        status: 'active',
        turn_number: state.round,
        seed: state.seed,
        snapshot: {},
      })
      .select('*')
      .single(),
  );
  try {
    await insertParticipants(admin, created.id, state);
    const version = await persist(admin, created.id, 0, state, setup.events);
    return json(request, 200, {
      ok: true,
      resumed: false,
      ...publicView({ ...created, version }, state, viewerFor(state, null, true), setup.events),
    });
  } catch (error) {
    await admin.from('combat_sessions').delete().eq('id', created.id);
    throw error;
  }
}

function cleanMove(move: any, actorId: string) {
  const clean: any = { actorId };
  for (const key of ['type', 'spellId', 'targetId', 'itemId']) {
    if (typeof move?.[key] === 'string') clean[key] = move[key];
  }
  return clean;
}

async function resolveCaller(admin: any, user: any, profile: any, body: any) {
  // Mestre: informa a campanha; jogador: sessão própria.
  if (body.campaignId) {
    const campaign = await ownedCampaign(admin, user.id, String(body.campaignId));
    if (!campaign) return { error: 'not_master' as const };
    const loaded = await loadCampaignSession(admin, campaign.id);
    return { isMaster: true, loaded, campaign };
  }
  if (!profile) return { error: 'no_profile' as const };
  const loaded = await loadPlayerSession(admin, profile, body.sessionId);
  return { isMaster: false, loaded, campaign: null };
}

async function act(request: Request, admin: any, user: any, profile: any, body: any) {
  const caller: any = await resolveCaller(admin, user, profile, body);
  if (caller.error === 'not_master') return fail(request, 403, 'not_master', 'Você não é o mestre desta campanha.');
  if (caller.error === 'no_profile') return fail(request, 404, 'no_profile', 'Crie seu personagem antes de lutar.');
  if (!caller.loaded) return fail(request, 404, 'no_session', 'Combate não encontrado ou já encerrado.');
  const { session, state } = caller.loaded;
  const viewer = viewerFor(state, profile, caller.isMaster);

  if (Number(body.version) !== session.version) {
    return fail(request, 409, 'version_conflict', 'O combate mudou. Atualize e tente de novo.', {
      current: publicView(session, state, viewer),
    });
  }

  const active = getActiveParticipant(state);
  let actorId: string;
  if (caller.isMaster) {
    const isPass = body.move?.type === 'pass';
    if (active.team !== 'enemy' && !isPass) {
      return fail(request, 422, 'not_enemy_turn', 'É a vez de um jogador. Você pode pular o turno dele.');
    }
    actorId = active.id;
  } else {
    if (!viewer.participantId) return fail(request, 403, 'not_participant', 'Você não participa deste combate.');
    actorId = viewer.participantId;
  }

  const step = applyAction(state, cleanMove(body.move, actorId));
  // Em sessões de campanha o mestre conduz os inimigos (D-19); no treino solo a IA joga.
  const settled = session.campaign_id ? { state: step.state, events: [] } : runUntilPlayerTurn(step.state);
  const events = [...step.events, ...settled.events];
  const version = await persist(admin, session.id, session.version, settled.state, events);
  return json(request, 200, { ok: true, ...publicView({ ...session, version }, settled.state, viewer, events) });
}

async function suggest(request: Request, admin: any, user: any, body: any) {
  const campaign = await ownedCampaign(admin, user.id, String(body.campaignId));
  if (!campaign) return fail(request, 403, 'not_master', 'Você não é o mestre desta campanha.');
  const loaded = await loadCampaignSession(admin, campaign.id);
  if (!loaded) return fail(request, 404, 'no_session', 'Combate não encontrado ou já encerrado.');
  const active = getActiveParticipant(loaded.state);
  if (active.team !== 'enemy') return fail(request, 422, 'not_enemy_turn', 'Não é a vez de um inimigo.');
  const action = chooseEnemyAction(loaded.state, active.id);
  const { actorId: _actor, ...move } = action;
  return json(request, 200, { ok: true, move, version: loaded.session.version });
}

async function abandon(request: Request, admin: any, user: any, profile: any, body: any) {
  const caller: any = await resolveCaller(admin, user, profile, body);
  if (caller.error === 'not_master') return fail(request, 403, 'not_master', 'Você não é o mestre desta campanha.');
  if (caller.error === 'no_profile') return fail(request, 404, 'no_profile', 'Crie seu personagem antes de lutar.');
  if (!caller.loaded) return fail(request, 404, 'no_session', 'Combate não encontrado ou já encerrado.');
  const { session, state } = caller.loaded;
  // Em sessão de campanha, só o mestre encerra.
  if (session.campaign_id && !caller.isMaster) {
    return fail(request, 403, 'not_master', 'Somente o mestre pode encerrar o combate da campanha.');
  }
  const next = { ...state, status: 'abandoned' };
  const events = [{ type: 'system', round: state.round, actorId: null, targetId: null, payload: { kind: 'abandoned' } }];
  const version = await persist(admin, session.id, session.version, next, events);
  return json(request, 200, {
    ok: true,
    ...publicView({ ...session, version }, next, viewerFor(next, profile, caller.isMaster), events),
  });
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
    const user = userData.user;

    const admin = createClient(url, service, { auth: { persistSession: false } });
    const profile: any = await must(admin.from('profiles').select('*').eq('user_id', user.id).maybeSingle());

    const body = await request.json().catch(() => ({}));
    const isTest = String(user.email || '').toLowerCase().endsWith(TEST_DOMAIN);

    switch (body.op) {
      case 'start':
        if (body.campaignId) return await startCampaign(request, admin, user, body);
        if (!profile) return fail(request, 404, 'no_profile', 'Crie seu personagem antes de lutar.');
        return await startSolo(request, admin, profile, body, isTest);
      case 'state': {
        const caller: any = await resolveCaller(admin, user, profile, body);
        if (caller.error === 'not_master') return fail(request, 403, 'not_master', 'Você não é o mestre desta campanha.');
        if (caller.error === 'no_profile' || !caller.loaded) return json(request, 200, { ok: true, active: false });
        const viewer = viewerFor(caller.loaded.state, profile, caller.isMaster);
        return json(request, 200, { ok: true, active: true, ...publicView(caller.loaded.session, caller.loaded.state, viewer) });
      }
      case 'act':
        return await act(request, admin, user, profile, body);
      case 'suggest':
        return await suggest(request, admin, user, body);
      case 'abandon':
        return await abandon(request, admin, user, profile, body);
      default:
        return fail(request, 400, 'unknown_op', 'Operação desconhecida.');
    }
  } catch (error) {
    if (error instanceof CombatError) {
      return fail(request, 422, (error as any).code, error.message);
    }
    console.error('combat function error', error);
    return fail(request, 500, 'internal_error', 'Não foi possível processar o combate agora.');
  }
});
