import { runSupabase } from './supabaseClient.js';
import { parseJSON } from '../ui/jsonEditor.js';

export const catalogDefinitions = {
  rpg_classes: {
    label: 'Classes',
    columns: ['id', 'name', 'role', 'description', 'base_stats', 'scaling'],
    fields: [
      { name: 'id', label: 'ID', required: true },
      { name: 'name', label: 'Nome', required: true },
      { name: 'role', label: 'Papel', required: true },
      { name: 'description', label: 'Descricao' },
      { name: 'base_stats', label: 'Atributos base', type: 'json', required: true, fallback: {} },
      { name: 'scaling', label: 'Escalonamento', type: 'json', fallback: {} },
    ],
  },
  rpg_races: {
    label: 'Racas',
    columns: ['id', 'name', 'ancestry', 'description', 'modifiers'],
    fields: [
      { name: 'id', label: 'ID', required: true },
      { name: 'name', label: 'Nome', required: true },
      { name: 'ancestry', label: 'Ancestralidade', required: true },
      { name: 'description', label: 'Descricao' },
      { name: 'modifiers', label: 'Modificadores', type: 'json', fallback: {} },
    ],
  },
  elements: {
    label: 'Elementos',
    columns: ['id', 'name', 'status_effect', 'description'],
    fields: [
      { name: 'id', label: 'ID', required: true },
      { name: 'name', label: 'Nome', required: true },
      { name: 'status_effect', label: 'Efeito de status' },
      { name: 'description', label: 'Descricao' },
      { name: 'strong_against', label: 'Forte contra', type: 'array', fallback: [] },
      { name: 'weak_against', label: 'Fraco contra', type: 'array', fallback: [] },
    ],
  },
  status_effects: {
    label: 'Status',
    columns: ['id', 'name', 'effect_type', 'default_duration_turns', 'stackable', 'rules'],
    fields: [
      { name: 'id', label: 'ID', required: true },
      { name: 'name', label: 'Nome', required: true },
      { name: 'effect_type', label: 'Tipo', required: true, options: ['buff', 'debuff', 'damage_over_time', 'control', 'resource'] },
      { name: 'default_duration_turns', label: 'Duracao', type: 'number', min: 0 },
      { name: 'stackable', label: 'Acumula', type: 'boolean' },
      { name: 'rules', label: 'Regras', type: 'json', fallback: {} },
      { name: 'description', label: 'Descricao' },
    ],
  },
  spells: {
    label: 'Magias',
    columns: ['id', 'name', 'element_id', 'rarity', 'mana_cost', 'cooldown_turns', 'power', 'target_type'],
    fields: [
      { name: 'id', label: 'ID', required: true },
      { name: 'name', label: 'Nome', required: true },
      { name: 'element_id', label: 'Elemento', required: true },
      { name: 'status_effect_id', label: 'Status' },
      { name: 'rarity', label: 'Raridade', required: true, options: ['common', 'uncommon', 'rare', 'epic', 'legendary'] },
      { name: 'mana_cost', label: 'Custo de mana', type: 'number', min: 0 },
      { name: 'cooldown_turns', label: 'Cooldown', type: 'number', min: 0 },
      { name: 'power', label: 'Poder', type: 'number', min: 0 },
      { name: 'target_type', label: 'Alvo', options: ['self', 'ally', 'enemy', 'all_allies', 'all_enemies'] },
      { name: 'effects', label: 'Efeitos', type: 'json', fallback: {} },
    ],
  },
  items: {
    label: 'Itens',
    columns: ['id', 'name', 'item_type', 'rarity', 'stackable', 'max_stack', 'stats', 'effects'],
    fields: [
      { name: 'id', label: 'ID', required: true },
      { name: 'name', label: 'Nome', required: true },
      { name: 'item_type', label: 'Tipo', options: ['weapon', 'armor', 'accessory', 'consumable', 'material', 'quest'] },
      { name: 'rarity', label: 'Raridade', options: ['common', 'uncommon', 'rare', 'epic', 'legendary'] },
      { name: 'stackable', label: 'Empilhavel', type: 'boolean' },
      { name: 'max_stack', label: 'Max stack', type: 'number', min: 1 },
      { name: 'stats', label: 'Atributos', type: 'json', fallback: {} },
      { name: 'effects', label: 'Efeitos', type: 'json', fallback: {} },
      { name: 'description', label: 'Descricao' },
    ],
  },
  enemies: {
    label: 'Inimigos',
    columns: ['id', 'name', 'enemy_type', 'level', 'element_id', 'xp_reward', 'base_stats', 'behavior'],
    fields: [
      { name: 'id', label: 'ID', required: true },
      { name: 'name', label: 'Nome', required: true },
      { name: 'enemy_type', label: 'Tipo' },
      { name: 'level', label: 'Nivel', type: 'number', min: 1 },
      { name: 'element_id', label: 'Elemento' },
      { name: 'xp_reward', label: 'XP', type: 'number', min: 0 },
      { name: 'base_stats', label: 'Atributos', type: 'json', required: true, fallback: {} },
      { name: 'behavior', label: 'Comportamento', type: 'json', fallback: {} },
      { name: 'loot_table', label: 'Loot table', type: 'json', fallback: [] },
      { name: 'description', label: 'Descricao' },
    ],
  },
  quests: {
    label: 'Missoes',
    columns: ['id', 'title', 'min_level', 'repeatable', 'rewards'],
    fields: [
      { name: 'id', label: 'ID', required: true },
      { name: 'title', label: 'Titulo', required: true },
      { name: 'description', label: 'Descricao' },
      { name: 'min_level', label: 'Nivel minimo', type: 'number', min: 1 },
      { name: 'rewards', label: 'Recompensas', type: 'json', fallback: {} },
      { name: 'repeatable', label: 'Repetivel', type: 'boolean' },
    ],
  },
};

export function preparePayload(definition, values) {
  const payload = {};
  for (const field of definition.fields) {
    let value = values[field.name];
    if (field.type === 'json') {
      const parsed = parseJSON(value, field.fallback);
      if (!parsed.ok) throw new Error(parsed.error);
      value = parsed.value;
    }
    if (field.type === 'array') {
      value = String(value || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
    if (field.type === 'number' && value !== '') value = Number(value);
    if (field.type === 'boolean') value = Boolean(value);
    if (value !== undefined && value !== '') payload[field.name] = value;
  }
  return payload;
}

export function listCatalog(table) {
  return runSupabase((client) => client.from(table).select('*').order('updated_at', { ascending: false }));
}

export function saveCatalog(table, payload, id) {
  if (id) {
    return runSupabase((client) => client.from(table).update(payload).eq('id', id).select().single());
  }
  return runSupabase((client) => client.from(table).insert(payload).select().single());
}

export function deleteCatalog(table, id) {
  return runSupabase((client) => client.from(table).delete().eq('id', id));
}
