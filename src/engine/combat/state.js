import { CombatError } from './errors.js';
import { createRng } from './rng.js';
import { normalizeRules } from './rules.js';
import { beginTurn, computeOrder } from './turns.js';

export function cloneState(state) {
  return structuredClone(state);
}

export function findParticipant(state, id) {
  return state.participants.find((participant) => participant.id === id) || null;
}

export function isAlive(participant) {
  return participant.stats.hp > 0;
}

export function aliveOf(state, team) {
  return state.participants.filter((participant) => participant.team === team && isAlive(participant));
}

export function getActiveParticipant(state) {
  return findParticipant(state, state.order[state.activeIndex]);
}

export function rngOf(state) {
  return createRng(state.seed, state.rngCursor);
}

export function commitRng(state, rng) {
  state.rngCursor = rng.cursor;
}

export function makeEvent(state, type, fields = {}) {
  return {
    type,
    round: state.round,
    actorId: fields.actorId ?? null,
    targetId: fields.targetId ?? null,
    payload: fields.payload ?? {},
  };
}

function normalizeParticipant(input) {
  const stats = { ...input.stats };
  stats.maxHp = stats.maxHp ?? stats.hp;
  stats.maxMana = stats.maxMana ?? stats.mana;
  return {
    id: input.id,
    team: input.team,
    name: input.name,
    refType: input.refType,
    refId: input.refId,
    elementId: input.elementId || null,
    stats,
    statuses: structuredClone(input.statuses || []),
    shield: input.shield || 0,
    spells: [...(input.spells || [])],
    items: structuredClone(input.items || []),
    behavior: { strategy: 'passive', ...(input.behavior || {}) },
    spellWeights: { ...(input.spellWeights || {}) },
    weaponDie: input.weaponDie || '1d4',
    flags: { fatiguedTurns: 0, ...(input.flags || {}) },
  };
}

// Devolve { state, events }: o primeiro turno já começa dentro do motor.
export function createCombat({ seed, rules, catalog, participants }) {
  if (!seed) throw new CombatError('invalid_setup', 'Semente do combate ausente.');
  if (!participants?.some((p) => p.team === 'player') || !participants.some((p) => p.team === 'enemy')) {
    throw new CombatError('invalid_setup', 'O combate precisa de ao menos um jogador e um inimigo.');
  }
  const state = {
    version: 1,
    seed: String(seed),
    rngCursor: 0,
    round: 1,
    order: [],
    activeIndex: 0,
    status: 'active',
    rules: rules.warnings ? rules : normalizeRules(rules),
    catalog: {
      elements: catalog.elements || {},
      statusEffects: catalog.statusEffects || {},
      spells: catalog.spells || {},
      items: catalog.items || {},
    },
    participants: participants.map(normalizeParticipant),
    cooldowns: {},
  };
  state.order = computeOrder(state);
  state.activeIndex = 0;
  const events = [];
  beginTurn(state, events);
  return { state, events };
}

export function isFinished(state) {
  return state.status !== 'active';
}

// Atualiza `status` conforme o time vivo; devolve true quando o combate acabou.
export function resolveOutcome(state) {
  if (!aliveOf(state, 'enemy').length) {
    state.status = 'victory';
  } else if (!aliveOf(state, 'player').length) {
    state.status = 'defeat';
  }
  return state.status !== 'active';
}
