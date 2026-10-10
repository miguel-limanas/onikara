// Montagem de participantes a partir de linhas do banco (perfil, equipamento, catálogo).
// Funções puras: usadas pelo navegador (treino local) e pela Edge Function (autoridade).
import { enemyParticipant, playerParticipant, weaponDieFor } from './factory.js';

export const MAX_COMBAT_SPELLS = 8;
const WEAPON_SLOTS = new Set(['main_hand']);

// Magias do combate: equipadas e desbloqueadas; sem nenhuma equipada, as desbloqueadas (até 8).
export function combatSpellIds({ classSpells, characterSpells }, level) {
  const unlocked = classSpells
    .filter((row) => row.unlock_level <= level)
    .sort((a, b) => a.unlock_level - b.unlock_level)
    .map((row) => row.spell_id);
  const equipped = characterSpells
    .filter((row) => row.equipped && unlocked.includes(row.spell_id))
    .sort((a, b) => (a.slot ?? 99) - (b.slot ?? 99))
    .map((row) => row.spell_id);
  return (equipped.length ? equipped : unlocked).slice(0, MAX_COMBAT_SPELLS);
}

// Bônus dos itens equipados e dado da arma na mão principal.
export function equipmentSummary({ items, inventory, equipment }) {
  const itemById = new Map(items.map((item) => [item.id, item]));
  const inventoryById = new Map(inventory.map((row) => [row.id, row]));
  const bonus = {};
  let weapon = null;
  for (const slot of equipment) {
    const item = itemById.get(inventoryById.get(slot.inventory_id)?.item_id);
    if (!item) continue;
    for (const [key, value] of Object.entries(item.stats || {})) {
      const number = Number(value);
      if (Number.isFinite(number)) bonus[key] = (bonus[key] || 0) + number;
    }
    if (WEAPON_SLOTS.has(slot.slot) && item.item_type === 'weapon') weapon = item;
  }
  return { bonus, weaponDie: weaponDieFor(weapon), weapon };
}

export function consumableStacks({ items, inventory }) {
  const itemById = new Map(items.map((item) => [item.id, item]));
  return inventory
    .filter((row) => itemById.get(row.item_id)?.item_type === 'consumable')
    .map((row) => ({ itemId: row.item_id, quantity: row.quantity }));
}

function finiteOrNull(value) {
  const number = Number(value);
  return value !== undefined && value !== null && Number.isFinite(number) ? number : null;
}

// `data`: { rows: {items, enemies, enemySpells}, classSpells, rpgClass, characterSpells, inventory, equipment }
export function buildPlayerParticipant(data, profile, { id, extraSpellIds = [] }) {
  const gear = equipmentSummary({ items: data.rows.items, inventory: data.inventory, equipment: data.equipment });
  const state = profile.current_state || {};
  const spells = combatSpellIds(data, profile.level);
  for (const spellId of extraSpellIds) {
    if (!spells.includes(spellId)) spells.push(spellId);
  }
  return playerParticipant({
    id,
    name: profile.character_name,
    profileId: profile.id,
    baseStats: profile.base_stats,
    scaling: data.rpgClass.scaling,
    level: profile.level,
    equipmentStats: gear.bonus,
    elementId: profile.element_id || null,
    spells,
    items: consumableStacks({ items: data.rows.items, inventory: data.inventory }),
    weaponDie: gear.weaponDie,
    currentHp: finiteOrNull(state.hp),
    currentMana: finiteOrNull(state.mana),
  });
}

export function buildEnemyParticipants(rows, { enemyIds, idFor }) {
  return enemyIds.map((enemyId, index) => {
    const enemy = rows.enemies.find((row) => row.id === enemyId);
    return enemyParticipant({
      id: idFor('enemy', index),
      enemy,
      spellRows: rows.enemySpells.filter((row) => row.enemy_id === enemyId),
    });
  });
}

export function buildParticipants(data, profile, { enemyIds, idFor = (kind, index) => (kind === 'player' ? 'player-1' : `enemy-${index + 1}`) }) {
  const player = buildPlayerParticipant(data, profile, { id: idFor('player', 0) });
  return [player, ...buildEnemyParticipants(data.rows, { enemyIds, idFor })];
}
