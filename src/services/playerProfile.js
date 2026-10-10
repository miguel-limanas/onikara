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
  const [classes, races, elements] = await Promise.all([
    runSupabase((client) => client.from('rpg_classes').select('*').order('name')),
    runSupabase((client) => client.from('rpg_races').select('*').order('name')),
    runSupabase((client) => client.from('elements').select('id,name,description').order('name')),
  ]);
  if (!classes.ok) return { ok: false, data: null, error: classes.error };
  if (!races.ok) return { ok: false, data: null, error: races.error };
  return {
    ok: true,
    data: { classes: classes.data, races: races.data, elements: elements.ok ? elements.data : [] },
    error: null,
  };
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

// A criação acontece no servidor (RPC create_character): atributos, kit inicial e
// elemento são calculados no banco, nunca enviados pelo navegador.
export async function createProfile({ characterName, rpgClass, race, elementId = 'neutral' }) {
  return runSupabase((client) =>
    client.rpc('create_character', {
      p_name: characterName,
      p_class_id: rpgClass.id,
      p_race_id: race.id,
      p_element_id: elementId,
    }),
  );
}
