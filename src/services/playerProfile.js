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

export async function createProfile({ userId, characterName, rpgClass, race }) {
  const stats = previewStats(rpgClass, race);
  return runSupabase((client) =>
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
}
