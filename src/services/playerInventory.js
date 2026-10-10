import { runSupabase } from './supabaseClient.js';

// Slots do MVP: cada tipo equipável ocupa um slot fixo.
export const EQUIP_SLOTS = [
  { id: 'main_hand', label: 'Mão principal', itemType: 'weapon' },
  { id: 'body', label: 'Corpo', itemType: 'armor' },
  { id: 'accessory_1', label: 'Acessório', itemType: 'accessory' },
];

const SLOT_BY_ITEM_TYPE = Object.fromEntries(EQUIP_SLOTS.map((slot) => [slot.itemType, slot.id]));

export const ITEM_TYPE_LABELS = {
  weapon: 'Arma',
  armor: 'Armadura',
  accessory: 'Acessório',
  consumable: 'Consumível',
  material: 'Material',
  quest: 'Missão',
};

export const RARITY_LABELS = {
  common: 'Comum',
  uncommon: 'Incomum',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Lendário',
};

export function slotForItem(item) {
  return SLOT_BY_ITEM_TYPE[item?.item_type] || null;
}

export async function loadInventory(profileId) {
  const [inventory, equipment] = await Promise.all([
    runSupabase((client) =>
      client.from('inventory').select('*, item:items(*)').eq('profile_id', profileId).order('created_at'),
    ),
    runSupabase((client) => client.from('equipment').select('*').eq('profile_id', profileId)),
  ]);
  if (!inventory.ok) return { ok: false, data: null, error: inventory.error };
  if (!equipment.ok) return { ok: false, data: null, error: equipment.error };

  const equippedByInventory = new Map(equipment.data.map((row) => [row.inventory_id, row.slot]));
  const items = inventory.data
    .filter((row) => row.item)
    .map((row) => ({
      inventoryId: row.id,
      quantity: row.quantity,
      item: row.item,
      slot: slotForItem(row.item),
      equippedSlot: equippedByInventory.get(row.id) || null,
    }));
  const slots = EQUIP_SLOTS.map((slot) => ({
    ...slot,
    entry: items.find((entry) => entry.equippedSlot === slot.id) || null,
  }));

  return { ok: true, data: { items, slots }, error: null };
}

export async function equipItem(profileId, entry) {
  if (!entry.slot) {
    return {
      ok: false,
      error: { code: 'not_equippable', message: 'Este item não pode ser equipado.' },
    };
  }
  return runSupabase((client) =>
    client
      .from('equipment')
      .upsert(
        { profile_id: profileId, slot: entry.slot, inventory_id: entry.inventoryId, equipped_at: new Date().toISOString() },
        { onConflict: 'profile_id,slot' },
      )
      .select('*')
      .single(),
  );
}

export async function unequipItem(profileId, slot) {
  return runSupabase((client) => client.from('equipment').delete().eq('profile_id', profileId).eq('slot', slot));
}
