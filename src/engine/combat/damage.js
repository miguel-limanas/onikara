import { effectiveStat, incomingElementMultiplier } from './effects.js';
import { evaluateFormula, parseFormula } from './rules.js';

// Vantagem: o elemento do atacante é forte contra o do defensor; desvantagem: é fraco contra ele.
export function elementalRelation(state, attackerElement, defenderElement) {
  if (!attackerElement || !defenderElement) return null;
  const attacker = state.catalog.elements[attackerElement];
  if (!attacker) return null;
  if ((attacker.strong_against || []).includes(defenderElement)) return 'advantage';
  if ((attacker.weak_against || []).includes(defenderElement)) return 'disadvantage';
  return null;
}

export function elementalMultiplier(state, relation) {
  if (relation === 'advantage') return state.rules.mitigation.advantage;
  if (relation === 'disadvantage') return state.rules.mitigation.disadvantage;
  return 1;
}

export function criticalChance(state, attacker, defender) {
  const { baseChance, speedBonusStep, maxChance } = state.rules.critical;
  const gap = Math.max(0, effectiveStat(state, attacker, 'speed') - effectiveStat(state, defender, 'speed'));
  return Math.min(maxChance, baseChance + speedBonusStep * gap);
}

// Resistência mágica vale 0 até existir atributo próprio (decisão D-18).
export function baseDamage(state, { attacker, defender, power, physical }) {
  const kind = physical ? 'physical' : 'magical';
  const terms = parseFormula(state.rules.damage[kind]);
  const raw = evaluateFormula(terms, {
    strength: effectiveStat(state, attacker, 'strength'),
    intelligence: effectiveStat(state, attacker, 'intelligence'),
    power,
    defense: effectiveStat(state, defender, 'defense') * state.rules.mitigation.defenseMultiplier,
    resistance: 0,
  });
  return Math.max(0, raw);
}

// Sempre consome um sorteio de crítico para manter a sequência estável.
export function rollDamage(state, rng, { attacker, defender, power, elementId, physical }) {
  const base = baseDamage(state, { attacker, defender, power, physical });
  const relation = elementalRelation(state, elementId, defender.elementId);
  const crit = rng.chance(criticalChance(state, attacker, defender));
  const scaled =
    base *
    elementalMultiplier(state, relation) *
    incomingElementMultiplier(state, defender, elementId) *
    (crit ? state.rules.critical.multiplier : 1);
  const amount = Math.max(state.rules.damage.minimum, Math.floor(scaled));
  return { amount, crit, relation, base };
}

// Escudo absorve primeiro; devolve quanto foi para o HP e quanto foi absorvido.
export function applyDamage(target, amount) {
  const absorbed = Math.min(target.shield, amount);
  target.shield -= absorbed;
  const dealt = Math.min(target.stats.hp, amount - absorbed);
  target.stats.hp -= dealt;
  return { dealt, absorbed };
}
