import {
  QUEST_STATE_LABELS,
  QUEST_STATE_ORDER,
  claimQuestReward,
  loadPlayerQuests,
  startQuest,
} from '../services/playerQuests.js';
import { emptyBlock, errorBlock, escapeHtml, html, loadingBlock } from '../ui/components.js';

const GROUP_TITLES = {
  active: 'Ativas',
  available: 'Disponíveis',
  completed: 'Concluídas',
  locked: 'Bloqueadas',
  failed: 'Falhas',
};

function rewardsMarkup(rewards) {
  const parts = [];
  if (rewards.xp) parts.push(`${rewards.xp} XP`);
  rewards.items.forEach((item) => parts.push(`${item.quantity}x ${item.name}`));
  if (!parts.length) return '';
  return `<p class="ok-helper">Recompensa (prévia): ${parts.map(escapeHtml).join(' · ')}</p>`;
}

function stepsMarkup(quest) {
  if (!quest.steps.length) return '';
  return html`
    <details class="ok-quest__steps">
      <summary>Etapas (${quest.stepsDone}/${quest.steps.length})</summary>
      <ol>
        ${quest.steps
          .map(
            (step) => html`
              <li class="${step.done ? 'is-done' : ''}">
                <span class="ok-quest__mark" aria-hidden="true">${step.done ? '✓' : '•'}</span>
                <span>${escapeHtml(step.label)}</span>
                ${step.target > 1 ? `<span class="ok-helper">${step.count}/${step.target}</span>` : ''}
              </li>
            `,
          )
          .join('')}
      </ol>
    </details>
  `;
}

function questMarkup(quest) {
  const stateNote =
    quest.state === 'locked'
      ? `<p class="ok-copy">Requer nível ${quest.minLevel}. Continue evoluindo para liberar esta missão.</p>`
      : quest.state === 'available' && quest.requiresCombat
        ? '<p class="ok-helper">Esta missão pede combate: o mestre da sua campanha conduz a luta.</p>'
        : '';
  const action =
    quest.state === 'available'
      ? `<button class="ok-button ok-button--primary" type="button" data-quest-action="start" data-quest="${escapeHtml(quest.id)}">Aceitar missão</button>`
      : quest.claimable
        ? `<button class="ok-button ok-button--primary" type="button" data-quest-action="claim" data-quest="${escapeHtml(quest.id)}">Receber recompensa</button>`
        : '';
  return html`
    <li class="ok-quest is-${quest.state}">
      <div class="ok-item__head">
        <strong class="ok-item__name">${escapeHtml(quest.title)}</strong>
        <span class="ok-badge ${quest.state === 'completed' ? 'is-success' : ''}">${QUEST_STATE_LABELS[quest.state]}</span>
      </div>
      <p class="ok-chip-row">
        <span class="ok-chip">Nível mínimo ${quest.minLevel}</span>
        ${quest.repeatable ? '<span class="ok-chip">Repetível</span>' : ''}
        ${quest.steps.length ? `<span class="ok-chip">${quest.stepsDone}/${quest.steps.length} etapas</span>` : ''}
      </p>
      ${quest.description ? `<p class="ok-copy">${escapeHtml(quest.description)}</p>` : ''}
      ${stateNote}
      ${stepsMarkup(quest)}
      ${rewardsMarkup(quest.rewards)}
      ${action ? `<div class="ok-item__action">${action}<p class="ok-helper ok-item__feedback" role="status" aria-live="polite"></p></div>` : ''}
    </li>
  `;
}

export async function renderQuestsView(container, { profile }) {
  container.innerHTML = loadingBlock('Consultando o quadro de missões...');
  const result = await loadPlayerQuests(profile);
  if (!result.ok) {
    container.innerHTML = errorBlock(result.error.message);
    return;
  }

  const quests = result.data;
  if (!quests.length) {
    container.innerHTML = `<section class="ok-panel">${emptyBlock('Nenhuma missão publicada ainda. Volte em breve.')}</section>`;
    return;
  }

  const hasActive = quests.some((quest) => quest.state === 'active');
  container.innerHTML = html`
    <div class="ok-quests">
      ${hasActive ? '' : '<p class="ok-copy">Você ainda não tem missões em andamento. Veja o que está disponível abaixo.</p>'}
      ${QUEST_STATE_ORDER.map((state) => {
        const group = quests.filter((quest) => quest.state === state);
        if (!group.length) return '';
        return html`
          <section class="ok-panel" aria-labelledby="quests-${state}">
            <h2 id="quests-${state}" class="ok-section-title">${GROUP_TITLES[state]} (${group.length})</h2>
            <ul class="ok-quest-list">${group.map(questMarkup).join('')}</ul>
          </section>
        `;
      }).join('')}
    </div>
  `;

  container.querySelectorAll('[data-quest-action]').forEach((button) => {
    button.addEventListener('click', async () => {
      const feedback = button.parentElement.querySelector('.ok-item__feedback');
      const claiming = button.dataset.questAction === 'claim';
      button.disabled = true;
      button.classList.add('is-loading');
      feedback.className = 'ok-helper ok-item__feedback';
      feedback.textContent = claiming ? 'Recebendo...' : 'Aceitando...';
      const outcome = claiming ? await claimQuestReward(button.dataset.quest) : await startQuest(button.dataset.quest);
      if (!outcome.ok) {
        button.disabled = false;
        button.classList.remove('is-loading');
        feedback.className = 'ok-helper ok-item__feedback is-error';
        feedback.textContent = outcome.error.message;
        return;
      }
      // Recompensa pode ter subido de nível: o perfil local acompanha para o resto do shell.
      if (claiming && outcome.data?.level_after) profile.level = outcome.data.level_after;
      await renderQuestsView(container, { profile });
    });
  });
}
