// Monta catálogo e participantes a partir de linhas no formato das tabelas do Supabase.
import { enemyParticipant, playerParticipant } from './factory.js';
import { normalizeRules } from './rules.js';

function indexById(rows = []) {
  return Object.fromEntries(rows.map((row) => [row.id, row]));
}

export function buildCatalog({ elements, statusEffects, spells, items }) {
  return {
    elements: indexById(elements),
    statusEffects: indexById(statusEffects),
    spells: indexById(spells),
    items: indexById(items),
  };
}

export function buildRules({ combatRules, manaRules }) {
  return normalizeRules({ combat: combatRules, mana: manaRules });
}

export function unlockedSpellIds(classSpells, classId, level) {
  return classSpells
    .filter((row) => row.class_id === classId && row.unlock_level <= level)
    .sort((a, b) => a.unlock_level - b.unlock_level)
    .map((row) => row.spell_id);
}

export function buildScenario(rows, { classId, level = 1, enemyIds, seed, spellIds, weaponDie = '1d4', elementId = null, items = [] }) {
  const rpgClass = rows.classes.find((row) => row.id === classId);
  const player = playerParticipant({
    id: 'player-1',
    name: rpgClass.name,
    profileId: 'profile-1',
    baseStats: rpgClass.base_stats,
    scaling: rpgClass.scaling,
    level,
    elementId,
    weaponDie,
    items,
    spells: spellIds || unlockedSpellIds(rows.classSpells, classId, level).slice(0, 8),
  });
  const enemies = enemyIds.map((enemyId, index) => {
    const enemy = rows.enemies.find((row) => row.id === enemyId);
    return enemyParticipant({
      id: `enemy-${index + 1}`,
      enemy,
      spellRows: rows.enemySpells.filter((row) => row.enemy_id === enemyId),
    });
  });
  return {
    seed,
    rules: buildRules(rows),
    catalog: buildCatalog(rows),
    participants: [player, ...enemies],
  };
}
