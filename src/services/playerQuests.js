import { runSupabase } from './supabaseClient.js';

// Leitura do quadro de missões. Aceitar e resgatar passam por RPCs do banco (Fase 5);
// o progresso dos objetivos de combate é gravado pelo servidor ao conceder as recompensas.

export const QUEST_STATE_ORDER = ['active', 'available', 'completed', 'locked', 'failed'];

export const QUEST_STATE_LABELS = {
  active: 'Ativa',
  available: 'Disponível',
  completed: 'Concluída',
  locked: 'Bloqueada',
  failed: 'Falhou',
};

export const OBJECTIVE_LABELS = {
  dialogue: 'Conversar',
  defeat_enemy: 'Derrotar',
  collect_item: 'Coletar',
  reach_level: 'Alcançar nível',
  custom: 'Objetivo',
};

function stepCount(progress, step) {
  const raw = progress?.steps?.[step.id] ?? progress?.[step.id];
  const number = Number(raw);
  return Number.isFinite(number) ? Math.min(Math.max(number, 0), step.target_count) : 0;
}

function resolveState(quest, progressRow, level) {
  if (progressRow?.status === 'completed') return 'completed';
  if (progressRow?.status === 'failed') return 'failed';
  if (progressRow?.status === 'active') return 'active';
  return level < quest.min_level ? 'locked' : 'available';
}

// Rótulo legível de um objetivo (também usado na tela do mestre).
export function describeQuestStep(step, names) {
  return stepTarget(step, names);
}

function stepTarget(step, names) {
  if (step.metadata?.label) return step.metadata.label;
  const base = OBJECTIVE_LABELS[step.objective_type] || 'Objetivo';
  if (step.objective_type === 'reach_level') return `${base} ${step.target_ref || ''}`.trim();
  const target =
    (step.objective_type === 'defeat_enemy' && names.enemies.get(step.target_ref)) ||
    (step.objective_type === 'collect_item' && names.items.get(step.target_ref)) ||
    step.target_ref ||
    '';
  const times = step.target_count > 1 ? ` (${step.target_count}x)` : '';
  return `${base} ${target}${times}`.trim();
}

export async function loadPlayerQuests(profile) {
  const [quests, steps, owned, enemies, items] = await Promise.all([
    runSupabase((client) => client.from('quests').select('*').order('min_level').order('title')),
    runSupabase((client) => client.from('quest_steps').select('*').order('step_order')),
    runSupabase((client) => client.from('character_quests').select('*').eq('profile_id', profile.id)),
    runSupabase((client) => client.from('enemies').select('id,name')),
    runSupabase((client) => client.from('items').select('id,name,item_type,rarity,image_url')),
  ]);
  for (const result of [quests, steps, owned]) {
    if (!result.ok) return { ok: false, data: null, error: result.error };
  }

  const names = {
    enemies: new Map((enemies.ok ? enemies.data : []).map((row) => [row.id, row.name])),
    items: new Map((items.ok ? items.data : []).map((row) => [row.id, row.name])),
  };
  const itemRows = new Map((items.ok ? items.data : []).map((row) => [row.id, row]));
  const progressByQuest = new Map(owned.data.map((row) => [row.quest_id, row]));

  const data = quests.data.map((quest) => {
    const progressRow = progressByQuest.get(quest.id) || null;
    const state = resolveState(quest, progressRow, profile.level);
    const questSteps = steps.data
      .filter((step) => step.quest_id === quest.id)
      .map((step) => {
        const count = state === 'completed' ? step.target_count : stepCount(progressRow?.progress, step);
        return {
          id: step.id,
          order: step.step_order,
          objectiveType: step.objective_type,
          label: stepTarget(step, names),
          count,
          target: step.target_count,
          done: count >= step.target_count,
        };
      });
    const rewards = quest.rewards || {};
    return {
      id: quest.id,
      title: quest.title,
      description: quest.description,
      minLevel: quest.min_level,
      repeatable: quest.repeatable,
      state,
      steps: questSteps,
      stepsDone: questSteps.filter((step) => step.done).length,
      requiresCombat: questSteps.some((step) => step.objectiveType === 'defeat_enemy'),
      // A recompensa é entregue pelo mestre; o jogador só acompanha.
      claimable: false,
      allStepsDone: state === 'active' && questSteps.length > 0 && questSteps.every((step) => step.done),
      rewards: {
        xp: Number(rewards.xp) || 0,
        items: (Array.isArray(rewards.items) ? rewards.items : []).map((entry) => ({
          name: names.items.get(entry.item_id) || entry.item_id,
          item: itemRows.get(entry.item_id) || null,
          quantity: Number(entry.quantity) || 1,
        })),
      },
    };
  });

  return { ok: true, data, error: null };
}

export async function startQuest(questId) {
  return runSupabase((client) => client.rpc('start_quest', { p_quest_id: questId }));
}

export async function claimQuestReward(questId) {
  return runSupabase((client) => client.rpc('claim_quest_reward', { p_quest_id: questId }));
}
