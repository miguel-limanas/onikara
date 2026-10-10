// Montagem de participantes a partir de linhas do catálogo/perfil (funções puras).
export const STAT_KEYS = ['hp', 'mana', 'strength', 'defense', 'intelligence', 'speed'];

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function levelStats(baseStats = {}, scaling = {}, level = 1, bonus = {}) {
  const steps = Math.max(0, toNumber(level, 1) - 1);
  return Object.fromEntries(
    STAT_KEYS.map((key) => [
      key,
      Math.max(0, toNumber(baseStats[key]) + toNumber(scaling[key]) * steps + toNumber(bonus[key])),
    ]),
  );
}

export function playerParticipant({
  id,
  name,
  profileId,
  baseStats,
  scaling,
  level = 1,
  equipmentStats = {},
  elementId = null,
  spells = [],
  items = [],
  weaponDie = '1d4',
  currentHp = null,
  currentMana = null,
}) {
  const stats = levelStats(baseStats, scaling, level, equipmentStats);
  return {
    id,
    team: 'player',
    name,
    refType: 'profile',
    refId: profileId,
    elementId,
    stats: {
      ...stats,
      maxHp: stats.hp,
      maxMana: stats.mana,
      hp: currentHp === null ? stats.hp : Math.min(Math.max(1, currentHp), stats.hp),
      mana: currentMana === null ? stats.mana : Math.min(Math.max(0, currentMana), stats.mana),
    },
    spells,
    items,
    weaponDie,
    behavior: { strategy: 'player' },
  };
}

export function enemyParticipant({ id, enemy, spellRows = [] }) {
  const stats = levelStats(enemy.base_stats, {}, 1);
  return {
    id,
    team: 'enemy',
    name: enemy.name,
    refType: 'enemy',
    refId: enemy.id,
    elementId: enemy.element_id || null,
    stats: { ...stats, maxHp: stats.hp, maxMana: stats.mana },
    spells: spellRows.map((row) => row.spell_id),
    spellWeights: Object.fromEntries(spellRows.map((row) => [row.spell_id, row.weight ?? 1])),
    behavior: {
      strategy: enemy.behavior?.strategy || 'passive',
      preferredElement: enemy.behavior?.preferred_element || null,
    },
    weaponDie: enemy.behavior?.weapon_die || '1d4',
  };
}

// Dado do ataque básico: effects.damage_die do item; senão pela raridade (1d4 a 1d10). Sem arma: 1d4.
const DIE_BY_RARITY = { common: '1d4', uncommon: '1d6', rare: '1d8', epic: '1d10', legendary: '1d10' };

export function weaponDieFor(item) {
  if (!item) return '1d4';
  const custom = item.effects?.damage_die;
  if (typeof custom === 'string' && /^1d(4|6|8|10)$/.test(custom)) return custom;
  return DIE_BY_RARITY[item.rarity] || '1d4';
}
