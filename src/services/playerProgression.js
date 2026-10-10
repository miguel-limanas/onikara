import { runSupabase } from './supabaseClient.js';
import { STAT_KEYS } from './playerProfile.js';

// Regra de XP (fallback quando não há regra ativa no banco):
// XP necessário para sair do nível N = round(base_xp * level_multiplier ^ (N - 1)).
// `profiles.xp` guarda o XP acumulado dentro do nível atual.
const FALLBACK_XP_CURVE = { base_xp: 100, level_multiplier: 1.35, max_level: 20 };

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export async function loadProgressionContext() {
  const [rule, effects] = await Promise.all([
    runSupabase((client) => client.from('active_progression_rules').select('*').maybeSingle()),
    runSupabase((client) => client.from('status_effects').select('id,name,effect_type')),
  ]);
  return {
    xpCurve: rule.ok && rule.data?.xp_curve ? rule.data.xp_curve : FALLBACK_XP_CURVE,
    statusEffects: effects.ok ? effects.data : [],
  };
}

export function xpForNextLevel(level, xpCurve = FALLBACK_XP_CURVE) {
  const base = toNumber(xpCurve.base_xp, FALLBACK_XP_CURVE.base_xp);
  const multiplier = toNumber(xpCurve.level_multiplier, FALLBACK_XP_CURVE.level_multiplier);
  return Math.max(1, Math.round(base * multiplier ** (Math.max(1, level) - 1)));
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// Atributos finais = base do personagem + crescimento da classe por nível acima do 1.
export function computeStats(profile, rpgClass) {
  const level = Math.max(1, toNumber(profile.level, 1));
  const base = profile.base_stats || {};
  const scaling = rpgClass?.scaling || {};
  return Object.fromEntries(
    STAT_KEYS.map((key) => [key, Math.max(0, toNumber(base[key]) + toNumber(scaling[key]) * (level - 1))]),
  );
}

function resource(current, max) {
  const safeMax = Math.max(1, Math.round(max));
  const safeCurrent = clamp(Math.round(toNumber(current, safeMax)), 0, safeMax);
  return { current: safeCurrent, max: safeMax, percent: Math.round((safeCurrent / safeMax) * 100) };
}

// Objeto estável para a UI, mesmo com `current_state` parcial ou ausente.
export function normalizeCharacter(profile, { rpgClass, race, xpCurve = FALLBACK_XP_CURVE, effects = [] } = {}) {
  const level = Math.max(1, toNumber(profile.level, 1));
  const stats = computeStats(profile, rpgClass);
  const state = profile.current_state || {};
  const maxLevel = toNumber(xpCurve.max_level, FALLBACK_XP_CURVE.max_level);
  const xpNeeded = xpForNextLevel(level, xpCurve);
  const xpCurrent = Math.max(0, toNumber(profile.xp));
  const atMaxLevel = level >= maxLevel;

  return {
    id: profile.id,
    name: profile.character_name,
    level,
    rpgClass,
    race,
    stats,
    hp: resource(state.hp, state.max_hp ?? stats.hp),
    mana: resource(state.mana, state.max_mana ?? stats.mana),
    xp: {
      current: xpCurrent,
      needed: xpNeeded,
      remaining: Math.max(0, xpNeeded - xpCurrent),
      percent: atMaxLevel ? 100 : clamp(Math.round((xpCurrent / xpNeeded) * 100), 0, 100),
      atMaxLevel,
    },
    effects,
  };
}

export async function loadActiveEffects(profileId, statusEffects = []) {
  const result = await runSupabase((client) =>
    client
      .from('character_status_effects')
      .select('status_effect_id,stacks,remaining_turns')
      .eq('profile_id', profileId),
  );
  if (!result.ok) return [];
  return result.data.map((row) => ({
    id: row.status_effect_id,
    name: statusEffects.find((item) => item.id === row.status_effect_id)?.name || row.status_effect_id,
    stacks: row.stacks,
    remainingTurns: row.remaining_turns,
  }));
}
