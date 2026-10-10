import { previewElemental } from '../engine/combat/index.js';
import {
  abandonRemoteCombat,
  createLocalDriver,
  createRemoteDriver,
  fetchActiveCombat,
  isTestAccount,
  loadCombatContext,
  loadSessionLog,
  startRemoteCombat,
} from '../services/playerCombat.js';
import { emptyBlock, errorBlock, escapeHtml, html, loadingBlock } from '../ui/components.js';
import { logMarkup } from './combatLog.js';

const ELEMENT_LABELS = {
  fire: 'Fogo',
  water: 'Água',
  storm: 'Tempestade',
  earth: 'Terra',
  nature: 'Natureza',
  neutral: 'Neutro',
};

const END_TITLES = {
  victory: 'Vitória',
  defeat: 'Derrota',
  escaped: 'Você escapou',
};

function elementChip(elementId) {
  const id = elementId || 'neutral';
  return `<span class="ok-chip ok-chip--element ok-combat-element" data-element="${escapeHtml(id)}">${escapeHtml(ELEMENT_LABELS[id] || id)}</span>`;
}

function meter({ label, current, max, modifier = '' }) {
  const percent = max > 0 ? Math.round((current / max) * 100) : 0;
  return html`
    <div class="ok-stat-bar ${modifier}">
      <div class="ok-stat-bar__label">
        <span>${escapeHtml(label)}</span>
        <span>${current} / ${max}</span>
      </div>
      <div class="ok-stat-bar__track" role="progressbar" aria-label="${escapeHtml(label)}" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${current}">
        <span class="ok-stat-bar__fill" style="--value: ${percent}%"></span>
      </div>
    </div>
  `;
}

function statusList(state, participant) {
  const parts = participant.statuses.map((status) => {
    const name = state.catalog.statusEffects[status.id]?.name || (status.id === 'defense_bonus' ? 'Defesa reforçada' : status.id);
    const stacks = status.stacks > 1 ? ` x${status.stacks}` : '';
    return `<span class="ok-badge">${escapeHtml(name)}${stacks} · ${status.remainingTurns}</span>`;
  });
  if (participant.shield > 0) parts.push(`<span class="ok-badge is-success">Escudo ${participant.shield}</span>`);
  return parts.length ? `<p class="ok-chip-row">${parts.join('')}</p>` : '';
}

function combatantCard(state, participant, { selectable = false, selected = false, active = false } = {}) {
  const defeated = participant.stats.hp <= 0;
  return html`
    <li
      class="ok-combatant is-${participant.team} ${defeated ? 'is-defeated' : ''} ${active ? 'is-active' : ''} ${selected ? 'is-selected' : ''}"
      data-participant="${escapeHtml(participant.id)}"
    >
      <div class="ok-combatant__head">
        <strong>${escapeHtml(participant.name)}</strong>
        ${elementChip(participant.elementId)}
        ${active ? '<span class="ok-badge is-warning">Vez atual</span>' : ''}
        ${defeated ? '<span class="ok-badge is-error">Derrotado</span>' : ''}
      </div>
      ${meter({ label: 'HP', current: participant.stats.hp, max: participant.stats.maxHp })}
      ${participant.stats.maxMana > 0 ? meter({ label: 'Mana', current: participant.stats.mana, max: participant.stats.maxMana, modifier: 'ok-stat-bar--mana' }) : ''}
      ${statusList(state, participant)}
      ${
        selectable && !defeated
          ? `<button class="ok-button ${selected ? 'ok-button--primary' : ''}" type="button" data-target="${escapeHtml(participant.id)}" aria-pressed="${selected}">${selected ? 'Alvo selecionado' : 'Escolher alvo'}</button>`
          : ''
      }
    </li>
  `;
}

function orderStrip(state) {
  return state.order
    .map((id, index) => {
      const participant = state.participants.find((item) => item.id === id);
      if (!participant || participant.stats.hp <= 0) return '';
      return `<li class="ok-combat-order__item ${index === state.activeIndex ? 'is-active' : ''}">${escapeHtml(participant.name)}</li>`;
    })
    .join('');
}

function actionButton(action, state, targetId) {
  const disabled = Boolean(action.disabled);
  const label = escapeHtml(action.label);
  let meta = '';
  let preview = '';
  if (action.type === 'basic_attack') {
    meta = `<span class="ok-helper">Dado ${escapeHtml(action.die)}</span>`;
  } else if (action.type === 'spell') {
    const cooldown = action.cooldownRemaining > 0 ? ` · recarga ${action.cooldownRemaining}` : action.cooldownTurns ? ` · recarga ${action.cooldownTurns}` : '';
    meta = `<span class="ok-helper">${action.manaCost} mana${cooldown}</span>`;
    if (action.power > 0 && !action.selfTarget && targetId) {
      const view = previewElemental(state, action.elementId, targetId);
      if (view.relation === 'advantage') preview = `<span class="ok-badge is-success">Fraqueza x${view.multiplier}</span>`;
      if (view.relation === 'disadvantage') preview = `<span class="ok-badge is-warning">Resistido x${view.multiplier}</span>`;
    }
  } else if (action.type === 'item') {
    meta = `<span class="ok-helper">Quantidade ${action.quantity}</span>`;
  } else if (action.type === 'flee') {
    meta = `<span class="ok-helper">Chance ${Math.round(action.chance * 100)}%</span>`;
  }
  const reason = disabled ? `<span class="ok-helper is-error">${escapeHtml(action.disabled.message)}</span>` : '';
  const element = action.elementId ? elementChip(action.elementId) : '';
  return html`
    <li class="ok-combat-action ${disabled ? 'is-disabled' : ''}">
      <button
        class="ok-button ok-combat-action__button"
        type="button"
        data-action-type="${escapeHtml(action.type)}"
        data-spell="${escapeHtml(action.spellId || '')}"
        data-item="${escapeHtml(action.itemId || '')}"
        ${disabled ? 'disabled aria-disabled="true"' : ''}
      >
        <span class="ok-combat-action__label">${label}</span>
        ${element}
      </button>
      <div class="ok-combat-action__meta">${meta}${preview}${reason}</div>
    </li>
  `;
}

export async function renderCombatView(container, { profile, session }) {
  container.innerHTML = loadingBlock('Preparando o campo de batalha...');
  const context = await loadCombatContext(profile);
  if (!context.ok) {
    container.innerHTML = errorBlock(context.error.message);
    return;
  }
  const canTrain = isTestAccount(session);
  const ui = { driver: null, targetId: null, busy: false };

  async function renderSelect(notice = '') {
    const active = await fetchActiveCombat();
    if (active.ok && active.data.active) {
      container.innerHTML = html`
        <section class="ok-panel ok-combat-select" aria-labelledby="combat-title">
          <h2 id="combat-title" class="ok-section-title">Combate em andamento</h2>
          <p class="ok-copy">Você tem um combate registrado no servidor. Continue de onde parou ou abandone-o.</p>
          <div class="ok-toolbar">
            <button class="ok-button ok-button--primary" type="button" data-resume>Continuar combate</button>
            <button class="ok-button" type="button" data-abandon>Abandonar</button>
          </div>
          <p class="ok-helper" role="status" aria-live="polite" data-feedback></p>
        </section>
      `;
      container.querySelector('[data-resume]').addEventListener('click', async () => {
        const log = await loadSessionLog(active.data.sessionId);
        ui.driver = createRemoteDriver(active.data, { log });
        pickTarget();
        renderFight(ui.driver.initialEvents);
      });
      container.querySelector('[data-abandon]').addEventListener('click', async () => {
        const result = await abandonRemoteCombat(active.data.sessionId);
        if (!result.ok) {
          container.querySelector('[data-feedback]').textContent = result.error.message;
          return;
        }
        renderSelect('Combate abandonado.');
      });
      return;
    }
    renderChoice(notice, active.ok ? '' : active.error?.message || '');
  }

  function renderChoice(notice = '', serverProblem = '') {
    const enemies = context.data.rows.enemies;
    container.innerHTML = html`
      <section class="ok-panel ok-combat-select" aria-labelledby="combat-title">
        <h2 id="combat-title" class="ok-section-title">Combate</h2>
        ${
          canTrain
            ? html`
                <p class="ok-copy">
                  Treino para contas de teste. O combate do servidor fica registrado; o treino local não grava nada.
                  Combates reais são conduzidos pelo mestre da sua campanha.
                </p>
                ${notice ? `<p class="ok-helper is-success" role="status">${escapeHtml(notice)}</p>` : ''}
                ${serverProblem ? `<p class="ok-helper is-error" role="alert">${escapeHtml(serverProblem)} O treino local continua disponível.</p>` : ''}
                ${
                  enemies.length
                    ? `<ul class="ok-combat-enemies">${enemies
                        .map(
                          (enemy) => html`
                            <li class="ok-combatant">
                              <div class="ok-combatant__head">
                                <strong>${escapeHtml(enemy.name)}</strong>
                                ${elementChip(enemy.element_id)}
                                <span class="ok-badge">Nível ${enemy.level}</span>
                              </div>
                              <p class="ok-copy">${escapeHtml(enemy.description || '')}</p>
                              <div class="ok-toolbar">
                                <button class="ok-button ok-button--primary" type="button" data-start="${escapeHtml(enemy.id)}" data-mode="remote">
                                  Iniciar combate
                                </button>
                                <button class="ok-button" type="button" data-start="${escapeHtml(enemy.id)}" data-mode="local">
                                  Treino local
                                </button>
                              </div>
                            </li>
                          `,
                        )
                        .join('')}</ul>`
                    : emptyBlock('Nenhum inimigo publicado ainda.')
                }
              `
            : html`
                <p class="ok-copy">
                  Os combates de Onikara são conduzidos pelo mestre da sua campanha. Quando ele iniciar uma luta, ela
                  aparece aqui para você agir na sua vez.
                </p>
                ${emptyBlock('Nenhum combate em andamento.')}
              `
        }
      </section>
    `;
    container.querySelectorAll('[data-start]').forEach((button) => {
      button.addEventListener('click', async () => {
        const { start: enemyId, mode } = button.dataset;
        if (mode === 'local') {
          ui.driver = createLocalDriver(context.data, profile, { enemyIds: [enemyId] });
          pickTarget();
          renderFight(ui.driver.initialEvents);
          return;
        }
        button.disabled = true;
        button.classList.add('is-loading');
        const result = await startRemoteCombat([enemyId]);
        if (!result.ok) {
          renderChoice('', result.error.message);
          return;
        }
        ui.driver = createRemoteDriver(result.data);
        pickTarget();
        renderFight(ui.driver.initialEvents);
      });
    });
  }

  function pickTarget() {
    const state = ui.driver.getState();
    ui.targetId = state.participants.find((item) => item.team === 'enemy' && item.stats.hp > 0)?.id || null;
  }

  function renderFight(newEvents = []) {
    const state = ui.driver.getState();
    const player = state.participants.find((item) => item.team === 'player');
    const enemies = state.participants.filter((item) => item.team === 'enemy');
    const finished = state.status !== 'active';
    const activeId = state.order[state.activeIndex];
    const myTurn = !finished && activeId === player.id;

    if (!enemies.some((enemy) => enemy.id === ui.targetId && enemy.stats.hp > 0)) {
      ui.targetId = enemies.find((enemy) => enemy.stats.hp > 0)?.id || null;
    }

    const existingLog = container.querySelector('.ok-combat-log');
    const previousLog = existingLog ? existingLog.innerHTML : '';
    const actions = myTurn ? ui.driver.actionsFor(player.id) : [];

    container.innerHTML = html`
      <section class="ok-panel ok-combat" aria-labelledby="combat-title">
        <div class="ok-combat__top">
          <h2 id="combat-title" class="ok-section-title">${ui.driver.kind === 'remote' ? 'Combate' : 'Treino local'} · Rodada ${state.round}</h2>
          ${finished ? "" : `<ol class="ok-combat-order" aria-label="Ordem de turno">${orderStrip(state)}</ol>`}
        </div>
        <div class="ok-combat__field">
          <div>
            <h3 class="ok-combat__heading">Inimigos</h3>
            <ul class="ok-combatant-list">
              ${enemies
                .map((enemy) =>
                  combatantCard(state, enemy, {
                    selectable: myTurn && enemies.filter((item) => item.stats.hp > 0).length > 1,
                    selected: enemy.id === ui.targetId,
                    active: enemy.id === activeId && !finished,
                  }),
                )
                .join('')}
            </ul>
          </div>
          <div>
            <h3 class="ok-combat__heading">Você</h3>
            <ul class="ok-combatant-list">${combatantCard(state, player, { active: myTurn })}</ul>
          </div>
        </div>
        ${
          finished
            ? html`
                <div class="ok-combat-end is-${state.status}" role="status">
                  <h3 class="ok-route-title">${END_TITLES[state.status]}</h3>
                  <p class="ok-copy">${
                    ui.driver.kind === 'remote'
                      ? 'Combate registrado no servidor. As recompensas chegam com a próxima etapa.'
                      : 'Treino local: nada foi gravado e não há recompensas.'
                  }</p>
                  <div class="ok-toolbar">
                    <button class="ok-button ok-button--primary" type="button" data-again>Novo combate</button>
                  </div>
                </div>
              `
            : html`
                <div class="ok-combat-actions" aria-labelledby="actions-title">
                  <h3 id="actions-title" class="ok-combat__heading">${myTurn ? 'Sua vez' : 'Aguardando...'}</h3>
                  ${
                    myTurn
                      ? `<ul class="ok-combat-action-list">${actions.map((action) => actionButton(action, state, ui.targetId)).join('')}</ul>`
                      : '<p class="ok-copy">Os inimigos estão agindo.</p>'
                  }
                  ${ui.driver.kind === 'remote' ? '<div class="ok-toolbar"><button class="ok-button" type="button" data-leave>Abandonar combate</button></div>' : ''}
                </div>
              `
        }
        <div class="ok-combat-logbox">
          <h3 class="ok-combat__heading">Registro</h3>
          <ol class="ok-combat-log" role="log" aria-live="polite" aria-label="Registro do combate">${previousLog}</ol>
        </div>
      </section>
    `;

    const log = container.querySelector('.ok-combat-log');
    log.insertAdjacentHTML('beforeend', logMarkup(state, newEvents));
    log.scrollTop = log.scrollHeight;
    bindFight(player);
  }

  function bindFight(player) {
    container.querySelectorAll('[data-target]').forEach((button) => {
      button.addEventListener('click', () => {
        ui.targetId = button.dataset.target;
        renderFight();
      });
    });
    const again = container.querySelector('[data-again]');
    if (again) again.addEventListener('click', () => renderSelect());
    const leave = container.querySelector('[data-leave]');
    if (leave) {
      leave.addEventListener('click', async () => {
        leave.disabled = true;
        const result = await abandonRemoteCombat(ui.driver.sessionId);
        if (!result.ok) {
          leave.disabled = false;
          return;
        }
        renderSelect('Combate abandonado.');
      });
    }

    container.querySelectorAll('[data-action-type]').forEach((button) => {
      button.addEventListener('click', async () => {
        if (ui.busy) return;
        ui.busy = true;
        container.querySelectorAll('[data-action-type]').forEach((item) => {
          item.disabled = true;
        });
        const type = button.dataset.actionType;
        const action = { type, actorId: player.id };
        if (type === 'spell') {
          action.spellId = button.dataset.spell;
          action.targetId = ui.targetId;
          const spell = ui.driver.getState().catalog.spells[action.spellId];
          if (spell?.target_type === 'self') action.targetId = player.id;
        }
        if (type === 'basic_attack') action.targetId = ui.targetId;
        if (type === 'item') action.itemId = button.dataset.item;
        try {
          const result = await ui.driver.act(action);
          ui.busy = false;
          renderFight(result.events);
        } catch (error) {
          ui.busy = false;
          pickTarget();
          renderFight();
          const log = container.querySelector('.ok-combat-log');
          log.insertAdjacentHTML('beforeend', `<li class="ok-combat-log__entry is-error">${escapeHtml(error.message || 'Ação inválida.')}</li>`);
        }
      });
    });

    const first = container.querySelector('[data-action-type]:not([disabled])');
    if (first && !ui.busy) first.focus({ preventScroll: true });
  }

  await renderSelect();
}
