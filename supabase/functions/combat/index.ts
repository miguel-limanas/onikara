// Edge Function `combat`: autoridade do combate (D-01, D-09).
// Usa o mesmo motor do navegador. A chave de serviço existe somente aqui, no servidor.
//
// Operações (campo `op`):
//   start    – solo (contas de teste) ou, com `campaignId`, combate da campanha iniciado pelo mestre
//   state    – combate ativo do jogador, ou da campanha (`campaignId`) para o mestre
//   act      – ação (`move`) do jogador na própria vez; o mestre age pelos inimigos
//   suggest  – o mestre pede a sugestão da IA para o inimigo da vez
//   abandon  – encerra o combate (jogador solo ou mestre)
//   enemy_turn – mestre ausente: o mestre ou qualquer jogador da sessão executa o turno do inimigo pela IA
//   rewards_preview / rewards_award – o mestre revisa e concede XP e itens de uma vitória
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
  createRng,
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

// Sessão por id para quem participa (jogador/mestre), mesmo depois de encerrada.
// Inimigos passivos (ex.: Boneco de Treino) não tomam decisões: o servidor passa o turno deles sozinho.
// Isso evita travar a campanha quando só há alvos de treino; inimigos com IA continuam com o mestre.
function settlePassive(state: any) {
  let current = state;
  const events: any[] = [];
  for (let steps = 0; steps < 50 && current.status === 'active'; steps += 1) {
    const active = getActiveParticipant(current);
    if (active.team !== 'enemy' || active.behavior?.strategy !== 'passive') break;
    const step = applyAction(current, { type: 'pass', actorId: active.id });
    current = step.state;
    events.push(...step.events);
  }
  return { state: current, events };
}

// Encerrou? grava HP/mana no perfil (D-10) e, no treino solo, concede as recompensas na hora.
async function afterPersist(admin: any, session: any, state: any, userId: string) {
  if (state.status === 'active') return;
  const settled = await admin.rpc('settle_combat_vitals', { p_session_id: session.id });
  if (settled.error) console.error('settle_combat_vitals', settled.error.message);
  if (state.status === 'victory' && !session.campaign_id) {
    const suggestion = await suggestRewards(admin, session, state);
    const awarded = await admin.rpc('award_combat_rewards', {
      p_session_id: session.id,
      p_awarded_by: userId,
      p_awards: toAwards(suggestion),
    });
    if (awarded.error) console.error('award_combat_rewards', awarded.error.message);
  }
}

function toAwards(suggestion: any) {
  return suggestion.players.map((player: any) => ({
    profile_id: player.profileId,
    xp: player.xp,
    items: player.items,
  }));
}

// Sugestão de recompensa: XP dividido igualmente e loot sorteado com a semente do combate.
async function suggestRewards(admin: any, session: any, state: any) {
  const players = state.participants.filter((p: any) => p.team === 'player' && p.refType === 'profile');
  const defeated = state.participants.filter((p: any) => p.team === 'enemy' && p.stats.hp <= 0);
  const enemyIds = [...new Set(defeated.map((p: any) => p.refId))];
  const enemies: any[] = enemyIds.length ? await must(admin.from('enemies').select('*').in('id', enemyIds)) : [];
  const lootRule: any = await must(admin.from('active_loot_rules').select('*').maybeSingle());
  const multiplier = Number(lootRule?.reward_modifiers?.xp_multiplier ?? 1) || 1;

  let total = 0;
  const rng = createRng(`${session.seed}:loot`);
  const drops: { item_id: string; quantity: number }[] = [];
  for (const enemy of defeated) {
    const row = enemies.find((item) => item.id === enemy.refId);
    if (!row) continue;
    total += Math.floor(Number(row.xp_reward || 0) * multiplier);
    for (const entry of row.loot_table || []) {
      if (entry?.item_id && rng.chance(Number(entry.chance ?? 0))) {
        drops.push({ item_id: String(entry.item_id), quantity: Math.max(1, Number(entry.quantity ?? 1)) });
      }
    }
  }
  const perPlayer = players.length ? Math.floor(total / players.length) : 0;
  const ordered = [...players].sort((a: any, b: any) => String(a.refId).localeCompare(String(b.refId)));
  const result = ordered.map((player: any) => ({
    profileId: player.refId,
    name: player.name,
    xp: perPlayer,
    items: [] as { item_id: string; quantity: number }[],
  }));
  drops.forEach((drop, index) => {
    if (!result.length) return;
    const target = result[index % result.length];
    const existing = target.items.find((item) => item.item_id === drop.item_id);
    if (existing) existing.quantity += drop.quantity;
    else target.items.push({ ...drop });
  });
  return { totalXp: total, players: result };
}

async function loadSessionForViewer(admin: any, user: any, profile: any, sessionId: string) {
  const session = await must(admin.from('combat_sessions').select('*').eq('id', sessionId).maybeSingle());
  if (!session) return null;
  let isMaster = false;
  let allowed = Boolean(profile && session.profile_id === profile.id);
  if (!allowed && session.campaign_id) {
    const campaign: any = await must(admin.from('campaigns').select('master_user_id').eq('id', session.campaign_id).maybeSingle());
    if (campaign?.master_user_id === user.id) {
      allowed = true;
      isMaster = true;
    }
  }
  if (!allowed && profile) {
    const rows: any[] = await must(
      admin.from('combat_participants').select('id').eq('combat_session_id', sessionId).eq('profile_id', profile.id),
    );
    allowed = rows.length > 0;
  }
  if (!allowed) return null;
  const loaded = await hydrate(admin, session);
  return { ...loaded, isMaster };
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

  await admin.rpc('recover_profile', { p_profile: profile.id });
  const fresh: any = await must(admin.from('profiles').select('*').eq('id', profile.id).single());
  const data: any = await loadCatalogRows(admin, fresh);
  if (!data.rpgClass) return fail(request, 422, 'missing_class', 'Classe do personagem não encontrada.');
  const known = new Set(data.rows.enemies.map((enemy: any) => enemy.id));
  if (enemyIds.some((id) => !known.has(id))) return fail(request, 422, 'invalid_enemies', 'Inimigo desconhecido.');

  const participants = buildParticipants(data, fresh, { enemyIds, idFor: () => crypto.randomUUID() });
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
  for (const member of members) await admin.rpc('recover_profile', { p_profile: member.profile_id });
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
  const settledStart = settlePassive(setup.state);
  const state = settledStart.state;
  const startEvents = [...setup.events, ...settledStart.events];

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
    const version = await persist(admin, created.id, 0, state, startEvents);
    return json(request, 200, {
      ok: true,
      resumed: false,
      ...publicView({ ...created, version }, state, viewerFor(state, null, true), startEvents),
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
  const settled = session.campaign_id ? settlePassive(step.state) : runUntilPlayerTurn(step.state);
  const events = [...step.events, ...settled.events];
  const version = await persist(admin, session.id, session.version, settled.state, events);
  await afterPersist(admin, session, settled.state, user.id);
  return json(request, 200, { ok: true, ...publicView({ ...session, version }, settled.state, viewer, events) });
}

// Mestre ausente: o mestre ou qualquer participante executa o turno do inimigo com a IA do motor.
async function enemyTurn(request: Request, admin: any, user: any, profile: any, body: any) {
  let sessionId = body.sessionId ? String(body.sessionId) : '';
  if (!sessionId && body.campaignId) {
    const active = await loadCampaignSession(admin, String(body.campaignId));
    sessionId = active?.session.id || '';
  }
  if (!sessionId) return fail(request, 404, 'no_session', 'Combate não encontrado ou já encerrado.');

  const found: any = await loadSessionForViewer(admin, user, profile, sessionId);
  if (!found) return fail(request, 403, 'not_participant', 'Você não participa deste combate.');
  const { session, state } = found;
  if (session.status !== 'active') return fail(request, 404, 'no_session', 'O combate já terminou.');

  const active = getActiveParticipant(state);
  if (active.team !== 'enemy') {
    return fail(request, 422, 'not_enemy_turn', 'Não é a vez de um inimigo.');
  }

  const step = applyAction(state, chooseEnemyAction(state, active.id));
  const settled = settlePassive(step.state);
  const events = [...step.events, ...settled.events];
  const version = await persist(admin, session.id, session.version, settled.state, events);
  await afterPersist(admin, session, settled.state, user.id);
  const viewer = viewerFor(settled.state, profile, found.isMaster);
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

async function masterSession(admin: any, user: any, body: any) {
  const campaign = await ownedCampaign(admin, user.id, String(body.campaignId));
  if (!campaign) return { error: 'not_master' as const };
  const session: any = await must(
    admin.from('combat_sessions').select('*').eq('id', String(body.sessionId)).eq('campaign_id', campaign.id).maybeSingle(),
  );
  if (!session) return { error: 'no_session' as const };
  return { session, ...(await hydrate(admin, session)) };
}

async function rewardsPreview(request: Request, admin: any, user: any, body: any) {
  const found: any = await masterSession(admin, user, body);
  if (found.error === 'not_master') return fail(request, 403, 'not_master', 'Você não é o mestre desta campanha.');
  if (found.error) return fail(request, 404, 'no_session', 'Combate não encontrado.');
  const existing: any = await must(
    admin.from('combat_rewards').select('summary').eq('combat_session_id', found.session.id).maybeSingle(),
  );
  if (existing) return json(request, 200, { ok: true, awarded: true, summary: existing.summary });
  if (found.session.status !== 'victory') {
    return fail(request, 422, 'not_victory', 'Só há recompensa quando o grupo vence o combate.');
  }
  const suggestion = await suggestRewards(admin, found.session, found.state);
  return json(request, 200, { ok: true, awarded: false, suggestion });
}

async function rewardsAward(request: Request, admin: any, user: any, body: any) {
  const found: any = await masterSession(admin, user, body);
  if (found.error === 'not_master') return fail(request, 403, 'not_master', 'Você não é o mestre desta campanha.');
  if (found.error) return fail(request, 404, 'no_session', 'Combate não encontrado.');
  if (found.session.status !== 'victory') {
    return fail(request, 422, 'not_victory', 'Só há recompensa quando o grupo vence o combate.');
  }

  const suggestion = await suggestRewards(admin, found.session, found.state);
  let awards = toAwards(suggestion);
  if (Array.isArray(body.adjustments)) {
    const allowed = new Set(suggestion.players.map((player: any) => player.profileId));
    const items: any[] = await must(admin.from('items').select('id'));
    const knownItems = new Set(items.map((item) => item.id));
    awards = body.adjustments
      .filter((entry: any) => allowed.has(entry.profileId))
      .map((entry: any) => ({
        profile_id: entry.profileId,
        xp: Math.min(10000, Math.max(0, Math.floor(Number(entry.xp) || 0))),
        items: (Array.isArray(entry.items) ? entry.items : [])
          .filter((item: any) => knownItems.has(item.item_id))
          .map((item: any) => ({
            item_id: item.item_id,
            quantity: Math.min(99, Math.max(1, Math.floor(Number(item.quantity) || 1))),
          })),
      }));
  }
  const { data, error } = await admin.rpc('award_combat_rewards', {
    p_session_id: found.session.id,
    p_awarded_by: user.id,
    p_awards: awards,
  });
  if (error) return fail(request, 422, 'award_failed', error.message);
  return json(request, 200, { ok: true, awarded: true, summary: data });
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
  await afterPersist(admin, session, next, user.id);
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
        if (body.sessionId) {
          const found: any = await loadSessionForViewer(admin, user, profile, String(body.sessionId));
          if (!found) return json(request, 200, { ok: true, active: false });
          const viewer = viewerFor(found.state, profile, found.isMaster);
          return json(request, 200, {
            ok: true,
            active: found.session.status === 'active',
            ...publicView(found.session, found.state, viewer),
            status: found.session.status,
          });
        }
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
      case 'enemy_turn':
        return await enemyTurn(request, admin, user, profile, body);
      case 'abandon':
        return await abandon(request, admin, user, profile, body);
      case 'rewards_preview':
        return await rewardsPreview(request, admin, user, body);
      case 'rewards_award':
        return await rewardsAward(request, admin, user, body);
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
