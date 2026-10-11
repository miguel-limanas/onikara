import { previewElemental } from '../engine/combat/index.js';
import { loadSessionLog, watchCombat } from '../services/playerCombat.js';
import { escapeHtml, html } from '../ui/components.js';
import { logMarkup } from './combatLog.js';
import { showCombatEnd } from './endEffect.js';

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
  escaped: 'O grupo escapou',
  abandoned: 'Combate encerrado',
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

function combatantCard(state, participant, { selectable = false, selected = false, active = false, mine = false, avatar = '' } = {}) {
  const defeated = participant.stats.hp <= 0;
  return html`
    <li
      class="ok-combatant is-${participant.team} ${defeated ? 'is-defeated' : ''} ${active ? 'is-active' : ''} ${selected ? 'is-selected' : ''}"
      data-participant="${escapeHtml(participant.id)}"
    >
      <div class="ok-combatant__avatar">
        ${avatar}
        <div class="ok-combatant__head">
          <strong>${escapeHtml(participant.name)}</strong>
          ${elementChip(participant.elementId)}
          ${mine ? '<span class="ok-badge">Você</span>' : ''}
          ${active ? '<span class="ok-badge is-warning">Vez atual</span>' : ''}
          ${defeated ? '<span class="ok-badge is-error">Derrotado</span>' : ''}
        </div>
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
        <span class="ok-combat-action__label">${escapeHtml(action.label)}</span>
        ${element}
      </button>
      <div class="ok-combat-action__meta">${meta}${preview}${reason}</div>
    </li>
  `;
}

// Tela de luta compartilhada por jogador e mestre.
// driver: { kind, getState, getViewer, actionsFor, act, [suggest], [sessionId] }
// perspective: 'player' (age pelo próprio personagem) | 'master' (age pelo inimigo da vez)
export function mountFight(container, { driver, perspective = 'player', title, endNote, onExit, onLeave, leaveLabel = 'Abandonar combate', initialEvents = [], showLog = true, renderEndExtra = null, avatarFor = null }) {
  const ui = { targetId: null, busy: false, message: '', connection: '' };
  let logHtml = '';
  let announced = false;

  // Jogador: efeito de fim de combate + modal, uma vez por combate.
  function announceEnd(state) {
    if (announced || perspective !== 'player') return;
    announced = true;
    const key = driver.sessionId ? `onikara:end-seen:${driver.sessionId}` : null;
    try {
      if (key && sessionStorage.getItem(key)) return;
      if (key) sessionStorage.setItem(key, '1');
    } catch {
      // sessionStorage indisponível: mostra mesmo assim.
    }
    showCombatEnd({
      status: state.status,
      onClose: () => {
        if (window.location.hash === '#personagem') window.dispatchEvent(new HashChangeEvent('hashchange'));
        else window.location.hash = '#personagem';
      },
    });
  }

  function actingParticipant(state) {
    if (perspective === 'master') {
      const active = state.participants.find((item) => item.id === state.order[state.activeIndex]);
      return active && active.team === 'enemy' ? active : null;
    }
    const viewerId = driver.getViewer().participantId;
    return (
      state.participants.find((item) => item.id === viewerId) ||
      state.participants.find((item) => item.team === 'player') ||
      null
    );
  }

  function ensureTarget(state, targetTeam) {
    const candidates = state.participants.filter((item) => item.team === targetTeam && item.stats.hp > 0);
    if (!candidates.some((item) => item.id === ui.targetId)) ui.targetId = candidates[0]?.id || null;
  }

  function render(newEvents = []) {
    const state = driver.getState();
    const finished = state.status !== 'active';
    const activeId = state.order[state.activeIndex];
    const active = state.participants.find((item) => item.id === activeId);
    const acting = actingParticipant(state);
    const targetTeam = perspective === 'master' ? 'player' : 'enemy';
    const canAct = !finished && Boolean(acting) && (perspective === 'master' ? true : activeId === acting.id);
    const enemies = state.participants.filter((item) => item.team === 'enemy');
    const players = state.participants.filter((item) => item.team === 'player');
    const viewerId = driver.getViewer().participantId;
    ensureTarget(state, targetTeam);

    const targetsAlive = state.participants.filter((item) => item.team === targetTeam && item.stats.hp > 0).length;
    const actions = canAct ? driver.actionsFor(acting.id) : [];
    const masterWaiting = perspective === 'master' && !finished && !canAct;

    container.innerHTML = html`
      <section class="ok-panel ok-combat" aria-labelledby="combat-title">
        <div class="ok-combat__top">
          <h2 id="combat-title" class="ok-section-title">${escapeHtml(title)} · Rodada ${state.round}</h2>
          ${ui.connection ? `<span class="ok-badge ${ui.connection === 'live' ? 'is-success' : ''}">${ui.connection === 'live' ? 'Ao vivo' : 'Atualizando a cada poucos segundos'}</span>` : ''}
          ${finished ? '' : `<ol class="ok-combat-order" aria-label="Ordem de turno">${orderStrip(state)}</ol>`}
        </div>
        <div class="ok-combat__field">
          <div>
            <h3 class="ok-combat__heading">Inimigos</h3>
            <ul class="ok-combatant-list">
              ${enemies
                .map((enemy) =>
                  combatantCard(state, enemy, {
                    selectable: canAct && targetTeam === 'enemy' && targetsAlive > 1,
                    selected: enemy.id === ui.targetId && targetTeam === 'enemy',
                    active: enemy.id === activeId && !finished,
                    avatar: avatarFor ? avatarFor(enemy) : '',
                  }),
                )
                .join('')}
            </ul>
          </div>
          <div>
            <h3 class="ok-combat__heading">${players.length > 1 || perspective === 'master' ? 'Aventureiros' : 'Você'}</h3>
            <ul class="ok-combatant-list">
              ${players
                .map((player) =>
                  combatantCard(state, player, {
                    selectable: canAct && targetTeam === 'player' && targetsAlive > 1,
                    selected: player.id === ui.targetId && targetTeam === 'player',
                    active: player.id === activeId && !finished,
                    mine: perspective === 'player' && player.id === viewerId,
                    avatar: avatarFor ? avatarFor(player) : '',
                  }),
                )
                .join('')}
            </ul>
          </div>
        </div>
        ${
          finished
            ? html`
                <div class="ok-combat-end is-${state.status}" role="status">
                  <h3 class="ok-route-title">${escapeHtml(END_TITLES[state.status] || 'Combate encerrado')}</h3>
                  <p class="ok-copy">${escapeHtml(endNote || '')}</p>
                  <div data-end-extra></div>
                  ${onExit ? '<div class="ok-toolbar"><button class="ok-button ok-button--primary" type="button" data-exit>Voltar</button></div>' : ''}
                </div>
              `
            : html`
                <div class="ok-combat-actions" aria-labelledby="actions-title">
                  <h3 id="actions-title" class="ok-combat__heading">
                    ${
                      perspective === 'master'
                        ? canAct
                          ? `Turno de ${escapeHtml(acting.name)}`
                          : `Aguardando ${escapeHtml(active?.name || 'jogador')}`
                        : canAct
                          ? 'Sua vez'
                          : `Aguardando ${escapeHtml(active?.name || 'o mestre')}...`
                    }
                  </h3>
                  ${
                    canAct
                      ? `<ul class="ok-combat-action-list">${actions.map((action) => actionButton(action, state, ui.targetId)).join('')}</ul>`
                      : '<p class="ok-copy">A tela mostra o próximo turno assim que ele chegar.</p>'
                  }
                  <div class="ok-toolbar">
                    ${canAct && perspective === 'master' && driver.suggest ? '<button class="ok-button" type="button" data-suggest>Usar sugestão da IA</button>' : ''}
                    ${masterWaiting ? '<button class="ok-button" type="button" data-skip>Pular turno do jogador</button>' : ''}
                    ${onLeave ? `<button class="ok-button" type="button" data-leave>${escapeHtml(leaveLabel)}</button>` : ''}
                  </div>
                </div>
              `
        }
        <p class="ok-helper ${ui.message ? 'is-error' : ''}" role="status" aria-live="polite" data-message>${escapeHtml(ui.message)}</p>
        ${
          showLog
            ? html`<div class="ok-combat-logbox">
                <h3 class="ok-combat__heading">Registro</h3>
                <ol class="ok-combat-log" role="log" aria-live="polite" aria-label="Registro do combate">${logHtml}</ol>
              </div>`
            : ''
        }
      </section>
    `;

    if (showLog) {
      const log = container.querySelector('.ok-combat-log');
      log.insertAdjacentHTML('beforeend', logMarkup(state, newEvents));
      logHtml = log.innerHTML;
      log.scrollTop = log.scrollHeight;
    }
    bind(acting, state);
    if (finished) announceEnd(state);
    const extra = container.querySelector('[data-end-extra]');
    if (extra && renderEndExtra) renderEndExtra(extra, { state });
  }

  async function run(action) {
    if (ui.busy) return;
    ui.busy = true;
    container.querySelectorAll('button').forEach((button) => {
      button.disabled = true;
    });
    try {
      ui.message = '';
      const result = await driver.act(action);
      ui.busy = false;
      render(result.events);
    } catch (error) {
      ui.busy = false;
      ui.message = error.message || 'Ação inválida.';
      render();
    }
  }

  function bind(acting, state) {
    container.querySelectorAll('[data-target]').forEach((button) => {
      button.addEventListener('click', () => {
        ui.targetId = button.dataset.target;
        render();
      });
    });
    const exit = container.querySelector('[data-exit]');
    if (exit) exit.addEventListener('click', () => onExit());
    const leave = container.querySelector('[data-leave]');
    if (leave) leave.addEventListener('click', () => onLeave());

    const suggest = container.querySelector('[data-suggest]');
    if (suggest) {
      suggest.addEventListener('click', async () => {
        suggest.disabled = true;
        try {
          const move = await driver.suggest();
          await run(move);
        } catch (error) {
          ui.message = error.message || 'Sem sugestão disponível.';
          render();
        }
      });
    }
    const skip = container.querySelector('[data-skip]');
    if (skip) skip.addEventListener('click', () => run({ type: 'pass' }));

    container.querySelectorAll('[data-action-type]').forEach((button) => {
      button.addEventListener('click', () => {
        const type = button.dataset.actionType;
        const action = { type, actorId: acting.id };
        if (type === 'spell') {
          action.spellId = button.dataset.spell;
          const spell = state.catalog.spells[action.spellId];
          action.targetId = spell?.target_type === 'self' ? acting.id : ui.targetId;
        }
        if (type === 'basic_attack') action.targetId = ui.targetId;
        if (type === 'item') action.itemId = button.dataset.item;
        run(action);
      });
    });

    const first = container.querySelector('[data-action-type]:not([disabled])');
    if (first && !ui.busy) first.focus({ preventScroll: true });
  }

  render(initialEvents);

  return {
    refresh(events = []) {
      render(events);
    },
    // Reconstrói o registro a partir do histórico do servidor.
    replaceLog(events) {
      logHtml = '';
      render(events);
    },
    isBusy: () => ui.busy,
    setConnection(status) {
      if (ui.connection === status) return;
      ui.connection = status;
      if (!ui.busy) render();
    },
  };
}

// Mantém a tela sincronizada com o servidor (Realtime, com consulta periódica de reserva).
export function attachLive({ driver, fight, container }) {
  let pending = false;
  let stop = () => {};

  async function sync(info) {
    if (pending || fight.isBusy()) return;
    if (!container.isConnected) {
      stop();
      return;
    }
    pending = true;
    try {
      const result = await driver.sync();
      if (result.changed) {
        const log = await loadSessionLog(driver.sessionId);
        fight.replaceLog(log);
      }
      // Recompensas concedidas depois do fim do combate: só redesenha o bloco final.
      if (info?.rewards && !result.changed) fight.refresh();
    } finally {
      pending = false;
    }
  }

  stop = watchCombat(driver.sessionId, {
    onChange: sync,
    onStatus: (status) => fight.setConnection(status),
  });
  return stop;
}
