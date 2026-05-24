import { runSupabase } from './supabaseClient.js';
import { parseJSON } from '../ui/jsonEditor.js';

export const balanceDefinitions = {
  progression_rules: {
    label: 'Progressao',
    activeView: 'active_progression_rules',
    jsonFields: ['xp_curve', 'level_stat_scaling', 'unlock_rules'],
  },
  mana_rules: {
    label: 'Mana',
    activeView: 'active_mana_rules',
    jsonFields: ['regeneration', 'fatigue', 'cost_rules'],
  },
  combat_rules: {
    label: 'Combate',
    activeView: 'active_combat_rules',
    jsonFields: ['initiative', 'damage_formula', 'critical_rules', 'mitigation_rules'],
  },
  rarity_rules: {
    label: 'Raridade',
    activeView: 'active_rarity_rules',
    jsonFields: ['rarity_weights', 'upgrade_rules', 'display_rules'],
  },
  loot_rules: {
    label: 'Loot',
    activeView: 'active_loot_rules',
    jsonFields: ['drop_rates', 'pity_rules', 'reward_modifiers'],
  },
};

export function listBalanceRules(table) {
  return runSupabase((client) => client.from(table).select('*').order('version', { ascending: false }));
}

export async function activateRule(table, id) {
  await runSupabase((client) => client.from(table).update({ status: 'archived' }).eq('status', 'active'));
  const update = await runSupabase((client) =>
    client.from(table).update({ status: 'active' }).eq('id', id).select().single(),
  );
  if (!update.ok) return update;
  const activeView = balanceDefinitions[table].activeView;
  return runSupabase((client) => client.from(activeView).select('*').eq('id', id).single());
}

export function archiveRule(table, id) {
  return runSupabase((client) => client.from(table).update({ status: 'archived' }).eq('id', id));
}

export function duplicateRule(table, rule) {
  const copy = { ...rule };
  delete copy.id;
  copy.status = 'draft';
  copy.version = Number(rule.version || 1) + 1;
  copy.name = `${rule.name} Copy`;
  return runSupabase((client) => client.from(table).insert(copy).select().single());
}

export function saveRule(table, values, id) {
  const definition = balanceDefinitions[table];
  const payload = {
    name: values.name,
    version: Number(values.version || 1),
    status: values.status || 'draft',
    notes: values.notes || '',
  };

  for (const field of definition.jsonFields) {
    const parsed = parseJSON(values[field], {});
    if (!parsed.ok) throw new Error(parsed.error);
    payload[field] = parsed.value;
  }

  if (id) return runSupabase((client) => client.from(table).update(payload).eq('id', id).select().single());
  return runSupabase((client) => client.from(table).insert(payload).select().single());
}
