import { describeQuestStep } from './playerQuests.js';
import { runSupabase } from './supabaseClient.js';

// Missões conduzidas pelo mestre: atribui, confirma objetivos e entrega a recompensa.

export async function loadMasterQuests(profileIds) {
  const [quests, steps, owned, enemies, items] = await Promise.all([
    runSupabase((client) => client.from('quests').select('*').order('min_level').order('title')),
    runSupabase((client) => client.from('quest_steps').select('*').order('step_order')),
    profileIds.length
      ? runSupabase((client) => client.from('character_quests').select('*').in('profile_id', profileIds))
      : Promise.resolve({ ok: true, data: [] }),
    runSupabase((client) => client.from('enemies').select('id,name')),
    runSupabase((client) => client.from('items').select('id,name')),
  ]);
  for (const result of [quests, steps, owned]) {
    if (!result.ok) return { ok: false, data: null, error: result.error };
  }
  const names = {
    enemies: new Map((enemies.ok ? enemies.data : []).map((row) => [row.id, row.name])),
    items: new Map((items.ok ? items.data : []).map((row) => [row.id, row.name])),
  };
  return {
    ok: true,
    error: null,
    data: {
      items: items.ok ? items.data : [],
      quests: quests.data.map((quest) => ({
        id: quest.id,
        campaignId: quest.campaign_id,
        title: quest.title,
        description: quest.description,
        minLevel: quest.min_level,
        repeatable: quest.repeatable,
        rewards: {
          xp: Number(quest.rewards?.xp) || 0,
          items: (quest.rewards?.items || []).map((entry) => `${Number(entry.quantity) || 1}x ${names.items.get(entry.item_id) || entry.item_id}`),
        },
        steps: steps.data
          .filter((step) => step.quest_id === quest.id)
          .map((step) => ({ id: step.id, label: describeQuestStep(step, names), target: step.target_count })),
      })),
      progress: new Map(owned.data.map((row) => [`${row.profile_id}|${row.quest_id}`, row])),
    },
  };
}

export function createCampaignQuest(campaignId, quest) {
  return runSupabase((client) =>
    client.rpc('master_create_quest', {
      p_campaign_id: campaignId,
      p_title: quest.title,
      p_description: quest.description,
      p_min_level: quest.minLevel,
      p_repeatable: quest.repeatable,
      p_xp: quest.xp,
      p_items: quest.items,
      p_steps: quest.steps,
    }),
  );
}

export const deleteCampaignQuest = (questId) =>
  runSupabase((client) => client.rpc('master_delete_quest', { p_quest_id: questId }));

export const assignQuest = (profileId, questId) =>
  runSupabase((client) => client.rpc('master_assign_quest', { p_profile_id: profileId, p_quest_id: questId }));

export const setQuestStep = (profileId, questId, stepId, count) =>
  runSupabase((client) =>
    client.rpc('master_set_quest_step', { p_profile_id: profileId, p_quest_id: questId, p_step_id: stepId, p_count: count }),
  );

export const completeQuest = (profileId, questId) =>
  runSupabase((client) => client.rpc('master_complete_quest', { p_profile_id: profileId, p_quest_id: questId }));

export const failQuest = (profileId, questId) =>
  runSupabase((client) => client.rpc('master_fail_quest', { p_profile_id: profileId, p_quest_id: questId }));
