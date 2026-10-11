import {
  assignQuest,
  completeQuest,
  createCampaignQuest,
  deleteCampaignQuest,
  failQuest,
  loadMasterQuests,
  setQuestStep,
} from '../services/masterQuests.js';
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
          <h3 class="ok-combat__heading">${escapeHtml(quest.title)} ${quest.campaignId ? '<span class="ok-badge">Da campanha</span>' : '<span class="ok-badge">Catálogo</span>'}</h3>
          ${quest.description ? `<p class="ok-copy">${escapeHtml(quest.description)}</p>` : ''}
          <p class="ok-helper">Nível mínimo ${quest.minLevel}${quest.repeatable ? ' · repetível' : ''}${reward ? ` · Recompensa: ${escapeHtml(reward)}` : ''}</p>
          ${quest.campaignId ? '<div class="ok-toolbar"><button class="ok-button" type="button" data-delete-quest="' + escapeHtml(quest.id) + '">Remover missão</button></div>' : ''}
          <ul class="ok-combat-enemies">
            ${members.map((member) => memberRow(quest, member, data.progress.get(`${member.profile.id}|${quest.id}`))).join('')}
          </ul>
        </article>
      `;
    })
    .join('');
}

// Painel de missões do mestre: atribui, confirma objetivos e entrega a recompensa.
function formMarkup(items) {
  return html`
    <details class="ok-quest-form">
      <summary class="ok-button">Nova missão</summary>
      <form class="ok-field" data-form="quest">
        <label for="quest-title">Título</label>
        <input id="quest-title" name="title" type="text" minlength="3" maxlength="80" required />
        <label for="quest-description">Descrição</label>
        <textarea id="quest-description" name="description" maxlength="1000" rows="4" placeholder="O que o grupo precisa fazer e por quê."></textarea>
        <div class="ok-form-row">
          <div class="ok-field">
            <label for="quest-level">Nível mínimo</label>
            <input id="quest-level" name="minLevel" type="number" min="1" max="99" value="1" />
          </div>
          <div class="ok-field">
            <label for="quest-xp">XP da recompensa</label>
            <input id="quest-xp" name="xp" type="number" min="0" max="100000" value="50" />
          </div>
        </div>
        <label class="ok-helper"><input type="checkbox" name="repeatable" /> Missão repetível</label>

        <h4 class="ok-combat__heading">Itens de recompensa</h4>
        <div class="ok-toolbar">
          <select data-reward-item aria-label="Item">${items.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join('')}</select>
          <input data-reward-qty type="number" min="1" max="99" value="1" aria-label="Quantidade" />
          <button class="ok-button" type="button" data-add-reward>Adicionar item</button>
        </div>
        <ul class="ok-chip-row" data-rewards></ul>

        <h4 class="ok-combat__heading">Objetivos</h4>
        <div class="ok-toolbar">
          <input data-step-label type="text" maxlength="120" placeholder="Ex.: Derrotar o Imp de Cinzas" aria-label="Objetivo" />
          <input data-step-count type="number" min="1" max="99" value="1" aria-label="Quantidade" />
          <button class="ok-button" type="button" data-add-step>Adicionar objetivo</button>
        </div>
        <ol data-steps class="ok-quest-steps"></ol>

        <button class="ok-button ok-button--primary" type="submit">Cadastrar missão</button>
        <p class="ok-helper" role="status" aria-live="polite" data-quest-feedback></p>
      </form>
    </details>
  `;
}

export function mountMasterQuests(host, { campaignId, getMembers, feedback }) {
  host.innerHTML = '<div data-quest-form></div><div data-quest-list></div>';
  const formHost = host.querySelector('[data-quest-form]');
  const listHost = host.querySelector('[data-quest-list]');
  let formReady = false;
  const draft = { items: [], steps: [] };

  function bindForm(items) {
    formHost.innerHTML = formMarkup(items);
    const form = formHost.querySelector('form');
    const note = form.querySelector('[data-quest-feedback]');
    const nameOf = (id) => items.find((item) => item.id === id)?.name || id;
    const rewardsNode = form.querySelector('[data-rewards]');
    const stepsNode = form.querySelector('[data-steps]');

    function paintDraft() {
      rewardsNode.innerHTML = draft.items.length
        ? draft.items
            .map(
              (entry, index) =>
                `<li class="ok-chip">${escapeHtml(nameOf(entry.item_id))} x${entry.quantity}
                  <button class="ok-button" type="button" data-remove-reward="${index}" aria-label="Remover item">×</button></li>`,
            )
            .join('')
        : '<li class="ok-helper">Sem itens: só XP.</li>';
      stepsNode.innerHTML = draft.steps.length
        ? draft.steps
            .map(
              (step, index) =>
                `<li><span>${escapeHtml(step.label)}${step.count > 1 ? ` (${step.count}x)` : ''}</span>
                  <button class="ok-button" type="button" data-remove-step="${index}" aria-label="Remover objetivo">×</button></li>`,
            )
            .join('')
        : '<li class="ok-helper">Nenhum objetivo ainda.</li>';
      rewardsNode.querySelectorAll('[data-remove-reward]').forEach((button) => {
        button.addEventListener('click', () => {
          draft.items.splice(Number(button.dataset.removeReward), 1);
          paintDraft();
        });
      });
      stepsNode.querySelectorAll('[data-remove-step]').forEach((button) => {
        button.addEventListener('click', () => {
          draft.steps.splice(Number(button.dataset.removeStep), 1);
          paintDraft();
        });
      });
    }
    paintDraft();

    form.querySelector('[data-add-reward]').addEventListener('click', () => {
      const itemId = form.querySelector('[data-reward-item]').value;
      const quantity = Math.max(1, Math.min(99, Number(form.querySelector('[data-reward-qty]').value) || 1));
      if (!itemId) return;
      const existing = draft.items.find((entry) => entry.item_id === itemId);
      if (existing) existing.quantity = Math.min(99, existing.quantity + quantity);
      else draft.items.push({ item_id: itemId, quantity });
      paintDraft();
    });

    form.querySelector('[data-add-step]').addEventListener('click', () => {
      const labelInput = form.querySelector('[data-step-label]');
      const label = labelInput.value.trim();
      if (!label) {
        note.className = 'ok-helper is-error';
        note.textContent = 'Escreva o objetivo antes de adicionar.';
        return;
      }
      const count = Math.max(1, Math.min(99, Number(form.querySelector('[data-step-count]').value) || 1));
      draft.steps.push({ label, count });
      labelInput.value = '';
      note.textContent = '';
      paintDraft();
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const steps = draft.steps.length ? draft.steps : [{ label: 'Cumprir a missão', count: 1 }];
      note.className = 'ok-helper';
      note.textContent = 'Cadastrando...';
      const result = await createCampaignQuest(campaignId, {
        title: String(data.get('title') || ''),
        description: String(data.get('description') || ''),
        minLevel: Number(data.get('minLevel')) || 1,
        repeatable: data.get('repeatable') === 'on',
        xp: Number(data.get('xp')) || 0,
        items: draft.items,
        steps,
      });
      if (!result.ok) {
        const duplicate = /unique|duplicate|quests_title_scope_key/i.test(result.error.message || '');
        note.className = 'ok-helper is-error';
        note.textContent = duplicate ? 'Já existe uma missão com esse título nesta campanha.' : result.error.message;
        return;
      }
      draft.items = [];
      draft.steps = [];
      form.reset();
      paintDraft();
      note.className = 'ok-helper is-success';
      note.textContent = 'Missão cadastrada. Atribua-a aos jogadores abaixo; eles também a veem e podem aderir.';
      load();
    });
  }

  async function load() {
    const members = getMembers();
    const result = await loadMasterQuests(members.map((member) => member.profile.id));
    if (!host.isConnected) return;
    if (!result.ok) {
      listHost.innerHTML = errorBlock(result.error.message);
      return;
    }
    if (!formReady) {
      formReady = true;
      bindForm(result.data.items);
    }
    listHost.innerHTML = panelMarkup(result.data, members);
    bind();
  }

  function say(message, tone = '') {
    if (!feedback) return;
    feedback.className = `ok-helper ${tone}`.trim();
    feedback.textContent = message;
  }

  function bind() {
    listHost.querySelectorAll('[data-delete-quest]').forEach((button) => {
      button.addEventListener('click', async () => {
        const result = await deleteCampaignQuest(button.dataset.deleteQuest);
        if (!result.ok) return say(result.error.message, 'is-error');
        say('Missão removida.', 'is-success');
        load();
      });
    });
    listHost.querySelectorAll('[data-profile]').forEach((row) => {
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

  listHost.innerHTML = loadingBlock('Carregando as missões...');
  load();
  watchChanges('master-quests', [{ table: 'character_quests' }], () => load(), { alive: () => host.isConnected });
  return { refresh: load };
}
