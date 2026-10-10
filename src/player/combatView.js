import {
  abandonRemoteCombat,
  createLocalDriver,
  createRemoteDriver,
  fetchActiveCombat,
  isTestAccount,
  loadCombatContext,
  loadCombatRewards,
  loadSessionLog,
  startRemoteCombat,
} from '../services/playerCombat.js';
import { emptyBlock, errorBlock, escapeHtml, html, loadingBlock } from '../ui/components.js';
import { attachLive, mountFight } from './fightScreen.js';

const ELEMENT_LABELS = {
  fire: 'Fogo',
  water: 'Água',
  storm: 'Tempestade',
  earth: 'Terra',
  nature: 'Natureza',
  neutral: 'Neutro',
};

function elementChip(elementId) {
  const id = elementId || 'neutral';
  return `<span class="ok-chip ok-chip--element ok-combat-element" data-element="${escapeHtml(id)}">${escapeHtml(ELEMENT_LABELS[id] || id)}</span>`;
}

export async function renderCombatView(container, { profile, session }) {
  container.innerHTML = loadingBlock('Preparando o campo de batalha...');
  const context = await loadCombatContext(profile);
  if (!context.ok) {
    container.innerHTML = errorBlock(context.error.message);
    return;
  }
  const canTrain = isTestAccount(session);

  function openFight(driver, { remote, inCampaign = false }) {
    const fight = mountFight(container, {
      driver,
      perspective: 'player',
      title: remote ? 'Combate' : 'Treino local',
      endNote: remote
        ? 'Combate registrado no servidor.'
        : 'Treino local: nada foi gravado e não há recompensas.',
      initialEvents: driver.getLog(),
      onExit: () => renderSelect(),
      onLeave: remote && !inCampaign ? () => leave(driver) : null,
      renderEndExtra: remote ? (node, { state }) => showRewards(node, driver, state) : null,
    });
    if (remote) attachLive({ driver, fight, container });
  }

  async function showRewards(node, driver, state) {
    if (state.status !== 'victory') return;
    node.innerHTML = '<p class="ok-helper" role="status">Conferindo as recompensas...</p>';
    const row = await loadCombatRewards(driver.sessionId);
    if (!row) {
      node.innerHTML = '<p class="ok-copy" role="status">Aguardando o mestre conceder as recompensas.</p>';
      return;
    }
    const mine = (row.summary.awards || []).find((award) => award.profile_id === profile.id);
    if (!mine) {
      node.innerHTML = '<p class="ok-copy" role="status">As recompensas foram concedidas.</p>';
      return;
    }
    const names = state.catalog.items;
    const items = (mine.items || []).map((item) => `${escapeHtml(names[item.item_id]?.name || item.item_id)} x${item.quantity}`);
    node.innerHTML = html`
      <div class="ok-combat-rewards" role="status">
        <h4 class="ok-combat__heading">Recompensas</h4>
        <p class="ok-copy"><strong>${mine.xp} XP</strong>${items.length ? ' · ' + items.join(', ') : ''}</p>
        ${mine.level_after > mine.level_before ? `<p class="ok-badge is-success">Subiu para o nível ${mine.level_after}!</p>` : ''}
      </div>
    `;
  }

  async function leave(driver) {
    const result = await abandonRemoteCombat(driver.sessionId);
    renderSelect(result.ok ? 'Combate abandonado.' : result.error.message);
  }

  async function renderSelect(notice = '') {
    const active = await fetchActiveCombat();
    if (active.ok && active.data.active) {
      const inCampaign = Boolean(active.data.campaignId);
      container.innerHTML = html`
        <section class="ok-panel ok-combat-select" aria-labelledby="combat-title">
          <h2 id="combat-title" class="ok-section-title">Combate em andamento</h2>
          <p class="ok-copy">
            ${inCampaign ? 'O mestre iniciou um combate na sua campanha.' : 'Você tem um combate registrado no servidor.'}
            Continue de onde parou${inCampaign ? '.' : ' ou abandone-o.'}
          </p>
          <div class="ok-toolbar">
            <button class="ok-button ok-button--primary" type="button" data-resume>Entrar no combate</button>
            ${inCampaign ? '' : '<button class="ok-button" type="button" data-abandon>Abandonar</button>'}
          </div>
          <p class="ok-helper" role="status" aria-live="polite" data-feedback></p>
        </section>
      `;
      container.querySelector('[data-resume]').addEventListener('click', async () => {
        const log = await loadSessionLog(active.data.sessionId);
        const driver = createRemoteDriver(active.data, { log });
        openFight(driver, { remote: true, inCampaign });
      });
      const abandon = container.querySelector('[data-abandon]');
      if (abandon) {
        abandon.addEventListener('click', async () => {
          const result = await abandonRemoteCombat(active.data.sessionId);
          if (!result.ok) {
            container.querySelector('[data-feedback]').textContent = result.error.message;
            return;
          }
          renderSelect('Combate abandonado.');
        });
      }
      return;
    }
    renderChoice(notice, active.ok ? '' : active.error?.message || '');
  }

  function renderChoice(notice = '', serverProblem = '') {
    const enemies = context.data.rows.enemies;
    container.innerHTML = html`
      <section class="ok-panel ok-combat-select" aria-labelledby="combat-title">
        <h2 id="combat-title" class="ok-section-title">Combate</h2>
        ${notice ? `<p class="ok-helper is-success" role="status">${escapeHtml(notice)}</p>` : ''}
        ${
          canTrain
            ? html`
                <p class="ok-copy">
                  Treino para contas de teste. O combate do servidor fica registrado; o treino local não grava nada.
                  Combates reais são conduzidos pelo mestre da sua campanha.
                </p>
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
                ${serverProblem ? `<p class="ok-helper is-error" role="alert">${escapeHtml(serverProblem)}</p>` : ''}
                ${emptyBlock('Nenhum combate em andamento.')}
                <div class="ok-toolbar"><button class="ok-button" type="button" data-refresh>Verificar de novo</button></div>
              `
        }
      </section>
    `;
    const refresh = container.querySelector('[data-refresh]');
    if (refresh) refresh.addEventListener('click', () => renderSelect());

    container.querySelectorAll('[data-start]').forEach((button) => {
      button.addEventListener('click', async () => {
        const { start: enemyId, mode } = button.dataset;
        if (mode === 'local') {
          const driver = createLocalDriver(context.data, profile, { enemyIds: [enemyId] });
          openFight(driver, { remote: false });
          return;
        }
        button.disabled = true;
        button.classList.add('is-loading');
        const result = await startRemoteCombat([enemyId]);
        if (!result.ok) {
          renderChoice('', result.error.message);
          return;
        }
        openFight(createRemoteDriver(result.data), { remote: true });
      });
    });
  }

  await renderSelect();
}
