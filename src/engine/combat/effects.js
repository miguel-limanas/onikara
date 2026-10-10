import { makeEvent } from './state.js';

export const MAX_STATUS_STACKS = 3;
export const KNOWN_SPELL_EFFECTS = new Set([
  'status_chance',
  'scales_with',
  'area',
  'shield',
  'cleanse',
  'mana_drain',
  'defense_bonus',
  'duration_turns',
  'slow',
]);

function statusRules(state, status) {
  return state.catalog.statusEffects[status.id]?.rules || {};
}

// Atributo efetivo: base + bônus de magias/fadiga, depois multiplicadores de status.
export function effectiveStat(state, participant, key) {
  let value = participant.stats[key] ?? 0;
  for (const status of participant.statuses) {
    const rules = statusRules(state, status);
    if (status.bonus?.[key]) value += status.bonus[key];
    if (key === 'speed' && rules.speed_delta) value += rules.speed_delta;
  }
  if (key === 'speed' && participant.flags.fatiguedTurns > 0) value += state.rules.mana.fatigueSpeedDelta;
  if (key === 'defense') {
    for (const status of participant.statuses) {
      const multiplier = statusRules(state, status).defense_multiplier;
      if (multiplier) value *= multiplier;
    }
  }
  return Math.max(0, value);
}

// Multiplicador de dano recebido por elemento (ex.: Encharcado aumenta dano de tempestade).
export function incomingElementMultiplier(state, defender, elementId) {
  let multiplier = 1;
  for (const status of defender.statuses) {
    const value = statusRules(state, status)[`${elementId}_damage_multiplier`];
    if (value) multiplier *= value;
  }
  return multiplier;
}

export function applyStatus(state, events, { actor, target, statusId, duration, selfApplied = false }) {
  const definition = state.catalog.statusEffects[statusId];
  if (!definition) {
    events.push(makeEvent(state, 'system', { actorId: actor.id, payload: { kind: 'warning', message: `Status desconhecido: ${statusId}` } }));
    return null;
  }
  const turns = (duration ?? definition.default_duration_turns ?? 1) + (selfApplied ? 1 : 0);
  let status = target.statuses.find((item) => item.id === statusId);
  if (status) {
    status.remainingTurns = Math.max(status.remainingTurns, turns);
    if (definition.stackable) status.stacks = Math.min(MAX_STATUS_STACKS, status.stacks + 1);
  } else {
    status = { id: statusId, stacks: 1, remainingTurns: turns, sourceId: actor.id };
    target.statuses.push(status);
  }
  events.push(
    makeEvent(state, 'status_applied', {
      actorId: actor.id,
      targetId: target.id,
      payload: { statusId, stacks: status.stacks, remainingTurns: status.remainingTurns },
    }),
  );
  return status;
}

export function applyBonus(state, events, { actor, target, id, bonus, duration }) {
  target.statuses = target.statuses.filter((item) => item.id !== id);
  target.statuses.push({ id, stacks: 1, remainingTurns: duration + (actor.id === target.id ? 1 : 0), sourceId: actor.id, bonus });
  events.push(
    makeEvent(state, 'status_applied', {
      actorId: actor.id,
      targetId: target.id,
      payload: { statusId: id, stacks: 1, remainingTurns: duration, bonus },
    }),
  );
}

export function removeStatuses(state, events, { actor, target, ids }) {
  const before = target.statuses.length;
  target.statuses = target.statuses.filter((status) => !ids.includes(status.id));
  if (target.statuses.length !== before) {
    events.push(makeEvent(state, 'system', { actorId: actor.id, targetId: target.id, payload: { kind: 'cleanse', statusIds: ids } }));
  }
}

// Fim do turno do dono: reduz a duração e remove o que expirou.
export function expireStatuses(state, events, participant) {
  const expired = [];
  participant.statuses = participant.statuses.filter((status) => {
    status.remainingTurns -= 1;
    if (status.remainingTurns > 0) return true;
    expired.push(status.id);
    return false;
  });
  for (const statusId of expired) {
    events.push(makeEvent(state, 'system', { actorId: participant.id, payload: { kind: 'status_expired', statusId } }));
  }
}

export function warnUnknownEffects(state, events, actor, spell) {
  const unknown = Object.keys(spell.effects || {}).filter((key) => !KNOWN_SPELL_EFFECTS.has(key));
  if (unknown.length) {
    events.push(makeEvent(state, 'system', { actorId: actor.id, payload: { kind: 'warning', message: `Efeitos ignorados: ${unknown.join(', ')}`, spellId: spell.id } }));
  }
}
