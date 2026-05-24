import { runSupabase } from './supabaseClient.js';
import { parseJSON } from '../ui/jsonEditor.js';

export function listClassSpells() {
  return runSupabase((client) =>
    client.from('class_spells').select('class_id, spell_id, unlock_level').order('class_id'),
  );
}

export function saveClassSpell(values) {
  return runSupabase((client) =>
    client.from('class_spells').upsert({
      class_id: values.class_id,
      spell_id: values.spell_id,
      unlock_level: Number(values.unlock_level || 1),
    }),
  );
}

export function deleteClassSpell(values) {
  return runSupabase((client) =>
    client.from('class_spells').delete().eq('class_id', values.class_id).eq('spell_id', values.spell_id),
  );
}

export function listEnemySpells() {
  return runSupabase((client) =>
    client.from('enemy_spells').select('enemy_id, spell_id, weight').order('enemy_id'),
  );
}

export function saveEnemySpell(values) {
  return runSupabase((client) =>
    client.from('enemy_spells').upsert({
      enemy_id: values.enemy_id,
      spell_id: values.spell_id,
      weight: Number(values.weight || 1),
    }),
  );
}

export function deleteEnemySpell(values) {
  return runSupabase((client) =>
    client.from('enemy_spells').delete().eq('enemy_id', values.enemy_id).eq('spell_id', values.spell_id),
  );
}

export function listQuestSteps() {
  return runSupabase((client) =>
    client.from('quest_steps').select('*').order('quest_id').order('step_order'),
  );
}

export function saveQuestStep(values, id) {
  const metadata = parseJSON(values.metadata, {});
  if (!metadata.ok) throw new Error(metadata.error);
  const payload = {
    id: values.id,
    quest_id: values.quest_id,
    step_order: Number(values.step_order || 1),
    objective_type: values.objective_type,
    target_ref: values.target_ref || null,
    target_count: Number(values.target_count || 1),
    metadata: metadata.value,
  };
  if (id) return runSupabase((client) => client.from('quest_steps').update(payload).eq('id', id));
  return runSupabase((client) => client.from('quest_steps').insert(payload));
}

export function deleteQuestStep(values) {
  return runSupabase((client) => client.from('quest_steps').delete().eq('id', values.id));
}
