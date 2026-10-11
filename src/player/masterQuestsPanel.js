import { assignQuest, completeQuest, failQuest, loadMasterQuests, setQuestStep } from '../services/masterQuests.js';
import { watchChanges } from '../services/live.js';
import { emptyBlock, errorBlock, escapeHtml, html, loadingBlock } from '../ui/components.js';

const STATE_BADGES = {
  active: { label: 'Em andamento', badge: 'is-warning' },
  completed: { label: 'Concluída', badge: 'is-success' },
  failed: { label: 'Falhou', badge: 'is-error' },
  none: { label: 'Não atribuída', badge: '' },
};

function stepCount(row, step) {
  const raw = Number(row?.progress?.steps?.[step.id]);
  return Number.isFinite(raw) ? Math.min(Math.max(raw, 0), step.target) : 0;
}

function stepMarkup(step, count) {
  const done = count >= step.target;
  const controls =
    step.target > 1
      ? `<button class="ok-button" type="button" data-step-dec aria-label="Diminuir">−</button>
         <span class="ok-badge">${count}/${step.target}</span>
         <button class="ok-button" type="button" data-step-inc aria-label="Aumentar">+</button>`
      : `<button class="ok-button ${done ? '' : 'ok-button--primary'}" type="button" data-step-toggle>${done ? 'Desfazer' : 'Confirmar objetivo'}</button>`;
  return html`
    <li class="${done ? 'is-done' : ''}" data-step="${escapeHtml(step.id)}" data-target="${step.target}" data-count="${count}">
      <span>${done ? '✓' : '•'} ${escapeHtml(step.label)}</span>
      <span class="ok-toolbar">${controls}</span>
    </li>
  `;
}

function memberRow(quest, member, row) {
  const status = row?.status || 'none';
  const state = STATE_BADGES[status] || STATE_BADGES.none;
  const profile = member.profile;
  const canAssign = status !== 'active' && !(status === 'completed' && !quest.repeatable);
  const steps = status === 'active' ? quest.steps : [];
  const allDone = steps.length > 0 && steps.every((step) => stepCount(row, step) >= step.target);
  const stepsHtml = steps.length
    ? html`
        <ul class="ok-quest-steps">${steps.map((step) => stepMarkup(step, stepCount(row, step))).join('')}</ul>
        <div class="ok-toolbar">
          <button class="ok-button ok-button--primary" type="button" data-complete ${allDone ? '' : 'disabled'}>Concluir e entregar recompensa</button>
          <button class="ok-button" type="button" data-fail>Marcar como falhou</button>
        </div>
      `
    : '';
  return html`
    <li class="ok-combatant" data-profile="${escapeHtml(profile.id)}" data-quest="${escapeHtml(quest.id)}">
      <div class="ok-combatant__head">
        <strong>${escapeHtml(profile.character_name)}</strong>
        <span class="ok-badge">Nível ${profile.level}</span>
        <span class="ok-badge ${state.badge}">${state.label}</span>
        ${canAssign ? `<button class="ok-button" type="button" data-assign>${status === 'none' ? 'Atribuir' : 'Atribuir de novo'}</button>` : ''}
      </div>
      ${stepsHtml}
    </li>
  `;
}

function panelMarkup(data, members) {
  if (!members.length) return emptyBlock('Convide jogadores para poder atribuir missões.');
  if (!data.quests.length) return emptyBlock('Nenhuma missão publicada ainda.');
  return data.quests
    .map((quest) => {
      const reward = [quest.rewards.xp ? `${quest.rewards.xp} XP` : '', ...quest.rewards.items].filter(Boolean).join(' · ');
      return html`
        <article class="ok-quest-block">
          <h3 class="ok-combat__heading">${escapeHtml(quest.title)}</h3>
          ${quest.description ? `<p class="ok-copy">${escapeHtml(quest.description)}</p>` : ''}
          <p class="ok-helper">Nível mínimo ${quest.minLevel}${quest.repeatable ? ' · repetível' : ''}${reward ? ` · Recompensa: ${escapeHtml(reward)}` : ''}</p>
          <ul class="ok-combat-enemies">
            ${members.map((member) => memberRow(quest, member, data.progress.get(`${member.profile.id}|${quest.id}`))).join('')}
          </ul>
        </article>
      `;
    })
    .join('');
}

// Painel de missões do mestre: atribui, confirma objetivos e entrega a recompensa.
export function mountMasterQuests(host, { getMembers, feedback }) {
  async function load() {
    const members = getMembers();
    const result = await loadMasterQuests(members.map((member) => member.profile.id));
    if (!host.isConnected) return;
    if (!result.ok) {
      host.innerHTML = errorBlock(result.error.message);
      return;
    }
    host.innerHTML = panelMarkup(result.data, members);
    bind();
  }

  function say(message, tone = '') {
    if (!feedback) return;
    feedback.className = `ok-helper ${tone}`.trim();
    feedback.textContent = message;
  }

  function bind() {
    host.querySelectorAll('[data-profile]').forEach((row) => {
      const profileId = row.dataset.profile;
      const questId = row.dataset.quest;
      const run = async (task, okMessage) => {
        const result = await task();
        if (!result.ok) return say(result.error.message, 'is-error');
        if (okMessage) say(okMessage, 'is-success');
        load();
      };
      row.querySelector('[data-assign]')?.addEventListener('click', () => run(() => assignQuest(profileId, questId), 'Missão atribuída.'));
      row.querySelector('[data-complete]')?.addEventListener('click', () =>
        run(() => completeQuest(profileId, questId), 'Missão concluída e recompensa entregue.'),
      );
      row.querySelector('[data-fail]')?.addEventListener('click', () => run(() => failQuest(profileId, questId), 'Missão marcada como falha.'));
      row.querySelectorAll('[data-step]').forEach((step) => {
        const id = step.dataset.step;
        const target = Number(step.dataset.target);
        const count = Number(step.dataset.count);
        const set = (value) => run(() => setQuestStep(profileId, questId, id, value));
        step.querySelector('[data-step-toggle]')?.addEventListener('click', () => set(count >= target ? 0 : target));
        step.querySelector('[data-step-inc]')?.addEventListener('click', () => set(Math.min(target, count + 1)));
        step.querySelector('[data-step-dec]')?.addEventListener('click', () => set(Math.max(0, count - 1)));
      });
    });
  }

  host.innerHTML = loadingBlock('Carregando as missões...');
  load();
  watchChanges('master-quests', [{ table: 'character_quests' }], () => load(), { alive: () => host.isConnected });
  return { refresh: load };
}
