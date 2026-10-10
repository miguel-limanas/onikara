// Normalização das regras ativas do banco para o formato que o motor consome.
// Fórmulas em texto são interpretadas por um parser de lista fechada (sem eval).

export const DEFAULT_RULES = {
  initiative: { orderBy: 'speed', tieBreaker: 'player_first' },
  damage: {
    physical: 'strength + power - defense',
    magical: 'intelligence + power - resistance',
    minimum: 1,
  },
  critical: { baseChance: 0.05, speedBonusStep: 0.01, multiplier: 1.5, maxChance: 0.5 },
  mitigation: { defenseMultiplier: 1, advantage: 1.5, disadvantage: 0.75 },
  mana: {
    combatPerTurn: 5,
    legendaryCostThreshold: 70,
    fatigueTurns: 1,
    fatigueSpeedDelta: -2,
    minimumRemaining: 0,
  },
};

const FORMULA_TOKENS = new Set(['strength', 'intelligence', 'power', 'defense', 'resistance', 'speed']);

function number(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

// Aceita somente `nome (+|-) nome ...` com nomes da lista fechada; devolve null se inválida.
export function parseFormula(text) {
  if (typeof text !== 'string') return null;
  const parts = text.trim().split(/\s*([+-])\s*/);
  if (!parts.length || parts.length % 2 === 0) return null;
  const terms = [];
  for (let index = 0; index < parts.length; index += 2) {
    const name = parts[index].trim().toLowerCase();
    if (!FORMULA_TOKENS.has(name)) return null;
    const sign = index === 0 ? 1 : parts[index - 1] === '-' ? -1 : 1;
    terms.push({ sign, name });
  }
  return terms;
}

export function evaluateFormula(terms, vars) {
  return terms.reduce((sum, term) => sum + term.sign * number(vars[term.name], 0), 0);
}

export function normalizeRules({ combat = {}, mana = {} } = {}) {
  const warnings = [];
  const damage = {};
  for (const kind of ['physical', 'magical']) {
    const text = combat.damage_formula?.[kind];
    const parsed = text === undefined ? null : parseFormula(text);
    if (text !== undefined && !parsed) warnings.push(`Fórmula de dano ${kind} inválida; usando o padrão do motor.`);
    damage[kind] = parsed ? text : DEFAULT_RULES.damage[kind];
  }

  const rules = {
    initiative: {
      orderBy: combat.initiative?.order_by || DEFAULT_RULES.initiative.orderBy,
      tieBreaker: combat.initiative?.tie_breaker || DEFAULT_RULES.initiative.tieBreaker,
    },
    damage: {
      ...damage,
      minimum: number(combat.damage_formula?.minimum_damage, DEFAULT_RULES.damage.minimum),
    },
    critical: {
      baseChance: number(combat.critical_rules?.base_chance, DEFAULT_RULES.critical.baseChance),
      speedBonusStep: number(combat.critical_rules?.speed_bonus_step, DEFAULT_RULES.critical.speedBonusStep),
      multiplier: number(combat.critical_rules?.damage_multiplier, DEFAULT_RULES.critical.multiplier),
      maxChance: DEFAULT_RULES.critical.maxChance,
    },
    mitigation: {
      defenseMultiplier: number(combat.mitigation_rules?.defense_multiplier, DEFAULT_RULES.mitigation.defenseMultiplier),
      advantage: number(combat.mitigation_rules?.elemental_advantage_multiplier, DEFAULT_RULES.mitigation.advantage),
      disadvantage: number(combat.mitigation_rules?.elemental_disadvantage_multiplier, DEFAULT_RULES.mitigation.disadvantage),
    },
    mana: {
      combatPerTurn: number(mana.regeneration?.combat_per_turn, DEFAULT_RULES.mana.combatPerTurn),
      legendaryCostThreshold: number(mana.fatigue?.legendary_cost_threshold, DEFAULT_RULES.mana.legendaryCostThreshold),
      fatigueTurns: number(mana.fatigue?.physical_penalty_turns, DEFAULT_RULES.mana.fatigueTurns),
      fatigueSpeedDelta: number(mana.fatigue?.speed_delta, DEFAULT_RULES.mana.fatigueSpeedDelta),
      minimumRemaining: number(mana.cost_rules?.minimum_remaining_mana, DEFAULT_RULES.mana.minimumRemaining),
    },
    warnings,
  };
  return rules;
}
