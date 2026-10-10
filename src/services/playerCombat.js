import {
  applyAction,
  buildCatalog,
  buildRules,
  createCombat,
  enemyParticipant,
  listActions,
  playerParticipant,
  runUntilPlayerTurn,
  weaponDieFor,
} from '../engine/combat/index.js';
import { runSupabase } from './supabaseClient.js';

// Treino local: o motor roda no navegador, sem gravar nada e sem recompensas.
// A autoridade real (servidor) entra no plano 05-04; esta interface de "driver" é a mesma.

export const TEST_ACCOUNT_DOMAIN = '@onikara.local';
export const MAX_COMBAT_SPELLS = 8;

const WEAPON_SLOTS = new Set(['main_hand']);

export function isTestAccount(session) {
  return String(session?.user?.email || '').toLowerCase().endsWith(TEST_ACCOUNT_DOMAIN);
}

function failure(result) {
  return { ok: false, data: null, error: result.error };
}

// Carrega regras e catálogos usados pelo combate (todos de leitura pública ou do próprio jogador).
export async function loadCombatContext(profile) {
  const [combatRules, manaRules, elements, statusEffects, spells, items, enemies, enemySpells, classSpells, rpgClass, owned, inventory, equipment] =
    await Promise.all([
      runSupabase((client) => client.from('active_combat_rules').select('*').maybeSingle()),
      runSupabase((client) => client.from('active_mana_rules').select('*').maybeSingle()),
      runSupabase((client) => client.from('elements').select('*')),
      runSupabase((client) => client.from('status_effects').select('*')),
      runSupabase((client) => client.from('spells').select('*')),
      runSupabase((client) => client.from('items').select('*')),
      runSupabase((client) => client.from('enemies').select('*').order('level').order('name')),
      runSupabase((client) => client.from('enemy_spells').select('*')),
      runSupabase((client) => client.from('class_spells').select('*').eq('class_id', profile.class_id)),
      runSupabase((client) => client.from('rpg_classes').select('*').eq('id', profile.class_id).maybeSingle()),
      runSupabase((client) => client.from('character_spells').select('*').eq('profile_id', profile.id)),
      runSupabase((client) => client.from('inventory').select('*').eq('profile_id', profile.id)),
      runSupabase((client) => client.from('equipment').select('*').eq('profile_id', profile.id)),
    ]);

  for (const result of [elements, statusEffects, spells, items, enemies, enemySpells, classSpells, rpgClass, owned, inventory, equipment]) {
    if (!result.ok) return failure(result);
  }
  if (!rpgClass.data) {
    return { ok: false, data: null, error: { code: 'missing_class', message: 'Classe do personagem não encontrada.' } };
  }

  return {
    ok: true,
    error: null,
    data: {
      rows: {
        combatRules: combatRules.ok ? combatRules.data : null,
        manaRules: manaRules.ok ? manaRules.data : null,
        elements: elements.data,
        statusEffects: statusEffects.data,
        spells: spells.data,
        items: items.data,
        enemies: enemies.data,
        enemySpells: enemySpells.data,
      },
      classSpells: classSpells.data,
      rpgClass: rpgClass.data,
      characterSpells: owned.data,
      inventory: inventory.data,
      equipment: equipment.data,
    },
  };
}

// Magias do combate: equipadas e desbloqueadas; sem nenhuma equipada, as desbloqueadas (até 8).
export function combatSpellIds(context, profile) {
  const unlocked = context.classSpells
    .filter((row) => row.unlock_level <= profile.level)
    .sort((a, b) => a.unlock_level - b.unlock_level)
    .map((row) => row.spell_id);
  const equipped = context.characterSpells
    .filter((row) => row.equipped && unlocked.includes(row.spell_id))
    .sort((a, b) => (a.slot ?? 99) - (b.slot ?? 99))
    .map((row) => row.spell_id);
  return (equipped.length ? equipped : unlocked).slice(0, MAX_COMBAT_SPELLS);
}

// Bônus dos itens equipados (arma na mão principal; demais conforme o slot) e dado da arma.
export function equipmentSummary(context) {
  const itemById = new Map(context.rows.items.map((item) => [item.id, item]));
  const inventoryById = new Map(context.inventory.map((row) => [row.id, row]));
  const bonus = {};
  let weapon = null;
  for (const slot of context.equipment) {
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

export function consumableStacks(context) {
  const itemById = new Map(context.rows.items.map((item) => [item.id, item]));
  return context.inventory
    .filter((row) => itemById.get(row.item_id)?.item_type === 'consumable')
    .map((row) => ({ itemId: row.item_id, quantity: row.quantity }));
}

export function buildLocalParticipants(context, profile, { enemyIds }) {
  const gear = equipmentSummary(context);
  const state = profile.current_state || {};
  const player = playerParticipant({
    id: 'player-1',
    name: profile.character_name,
    profileId: profile.id,
    baseStats: profile.base_stats,
    scaling: context.rpgClass.scaling,
    level: profile.level,
    equipmentStats: gear.bonus,
    elementId: profile.element_id || null,
    spells: combatSpellIds(context, profile),
    items: consumableStacks(context),
    weaponDie: gear.weaponDie,
    currentHp: Number.isFinite(Number(state.hp)) ? Number(state.hp) : null,
    currentMana: Number.isFinite(Number(state.mana)) ? Number(state.mana) : null,
  });
  const enemies = enemyIds.map((enemyId, index) => {
    const enemy = context.rows.enemies.find((row) => row.id === enemyId);
    return enemyParticipant({
      id: `enemy-${index + 1}`,
      enemy,
      spellRows: context.rows.enemySpells.filter((row) => row.enemy_id === enemyId),
    });
  });
  return [player, ...enemies];
}

function newSeed() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `local-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

// Driver local: mesma forma que o driver remoto terá no 05-04.
export function createLocalDriver(context, profile, { enemyIds, seed = newSeed() }) {
  const setup = createCombat({
    seed,
    rules: buildRules(context.rows),
    catalog: buildCatalog(context.rows),
    participants: buildLocalParticipants(context, profile, { enemyIds }),
  });
  let state = setup.state;
  let log = [...setup.events];

  function settle() {
    const result = runUntilPlayerTurn(state);
    state = result.state;
    log = log.concat(result.events);
    return result.events;
  }

  const initial = settle();

  return {
    kind: 'local',
    seed,
    getState: () => state,
    getLog: () => log,
    actionsFor: (actorId) => listActions(state, actorId),
    initialEvents: [...setup.events, ...initial],
    async act(action) {
      const step = applyAction(state, action);
      state = step.state;
      log = log.concat(step.events);
      const enemyEvents = settle();
      return { state, events: step.events.concat(enemyEvents) };
    },
  };
}
