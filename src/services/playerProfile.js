import { runSupabase } from './supabaseClient.js';

export const STAT_KEYS = ['hp', 'mana', 'strength', 'defense', 'intelligence', 'speed'];

export const STAT_LABELS = {
  hp: 'HP',
  mana: 'Mana',
  strength: 'Força',
  defense: 'Defesa',
  intelligence: 'Inteligência',
  speed: 'Velocidade',
};

export async function loadCharacterCatalogs() {
  const [classes, races] = await Promise.all([
    runSupabase((client) => client.from('rpg_classes').select('*').order('name')),
    runSupabase((client) => client.from('rpg_races').select('*').order('name')),
  ]);
  if (!classes.ok) return { ok: false, data: null, error: classes.error };
  if (!races.ok) return { ok: false, data: null, error: races.error };
  return { ok: true, data: { classes: classes.data, races: races.data }, error: null };
}

export async function loadOwnProfile(userId) {
  return runSupabase((client) =>
    client.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
  );
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

// Atributos iniciais = base da classe + modificador da raça (nunca abaixo de 1).
export function previewStats(rpgClass, race) {
  const base = rpgClass?.base_stats || {};
  const modifiers = race?.modifiers || {};
  return Object.fromEntries(
    STAT_KEYS.map((key) => [key, Math.max(1, toNumber(base[key]) + toNumber(modifiers[key]))]),
  );
}

// Kit inicial entregue na criação: arma da classe, armadura e consumíveis básicos.
// Itens ausentes do catálogo são ignorados para não bloquear a criação.
const STARTER_WEAPON_BY_CLASS = { warrior: 'training-sword', mage: 'apprentice-staff' };
const STARTER_COMMON_ITEMS = [
  { item_id: 'patched-armor', quantity: 1 },
  { item_id: 'health-salve', quantity: 2 },
  { item_id: 'mana-tonic', quantity: 1 },
];

async function grantStarterKit(profileId, classId) {
  const weapon = STARTER_WEAPON_BY_CLASS[classId];
  const wanted = [...(weapon ? [{ item_id: weapon, quantity: 1 }] : []), ...STARTER_COMMON_ITEMS];
  const catalog = await runSupabase((client) =>
    client.from('items').select('id').in('id', wanted.map((entry) => entry.item_id)),
  );
  if (!catalog.ok) return;
  const known = new Set(catalog.data.map((row) => row.id));
  const rows = wanted
    .filter((entry) => known.has(entry.item_id))
    .map((entry) => ({ profile_id: profileId, ...entry }));
  if (rows.length) await runSupabase((client) => client.from('inventory').insert(rows));
}

export async function createProfile({ userId, characterName, rpgClass, race }) {
  const stats = previewStats(rpgClass, race);
  const created = await runSupabase((client) =>
    client
      .from('profiles')
      .insert({
        user_id: userId,
        character_name: characterName,
        class_id: rpgClass.id,
        race_id: race.id,
        base_stats: stats,
        current_state: {
          hp: stats.hp,
          max_hp: stats.hp,
          mana: stats.mana,
          max_mana: stats.mana,
        },
      })
      .select('*')
      .single(),
  );
  if (created.ok) await grantStarterKit(created.data.id, rpgClass.id);
  return created;
}
