import {
  abandonRemoteCombat,
  createRemoteDriver,
  fetchActiveCombat,
  loadSessionLog,
  startCampaignCombat,
} from '../services/playerCombat.js';
import {
  addMember,
  createCampaign,
  loadCampaignDetails,
  loadOwnCampaign,
  removeMember,
  setEnemyReleased,
  setSpellGranted,
} from '../services/masterCampaign.js';
import { emptyBlock, errorBlock, escapeHtml, html, loadingBlock } from '../ui/components.js';
import { mountFight } from './fightScreen.js';

function feedbackLine(node, message, tone = '') {
  if (!node) return;
  node.className = `ok-helper ${tone}`.trim();
  node.textContent = message;
}

function createForm(container, userId) {
  container.innerHTML = html`
    <section class="ok-panel" aria-labelledby="master-title">
      <h2 id="master-title" class="ok-section-title">Mestre</h2>
      <p class="ok-copy">Crie a sua campanha para convidar jogadores, liberar inimigos e conduzir combates.</p>
      <form class="ok-field" data-form="campaign">
        <label for="campaign-name">Nome da campanha</label>
        <input id="campaign-name" name="name" type="text" minlength="2" maxlength="80" required />
        <button class="ok-button ok-button--primary" type="submit">Criar campanha</button>
        <p class="ok-helper" role="status" aria-live="polite" data-feedback></p>
      </form>
    </section>
  `;
  container.querySelector('form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const feedback = container.querySelector('[data-feedback]');
    const name = new FormData(event.currentTarget).get('name');
    feedbackLine(feedback, 'Criando campanha...');
    const result = await createCampaign(userId, String(name));
    if (!result.ok) {
      feedbackLine(feedback, result.error.message, 'is-error');
      return;
    }
    renderMasterView(container, { session: { user: { id: userId } } });
  });
}

function membersMarkup(details) {
  if (!details.members.length) return emptyBlock('Nenhum jogador na campanha ainda.');
  const className = (id) => details.classes.find((item) => item.id === id)?.name || id;
  return `<ul class="ok-combat-enemies">${details.members
    .map((row) => {
      const profile = row.profile;
      const granted = details.granted.filter((item) => item.profile_id === profile.id);
      const available = details.spells.filter((spell) => !granted.some((item) => item.spell_id === spell.id));
      return html`
        <li class="ok-combatant" data-member="${escapeHtml(profile.id)}">
          <div class="ok-combatant__head">
            <strong>${escapeHtml(profile.character_name)}</strong>
            <span class="ok-badge">${escapeHtml(className(profile.class_id))} · Nível ${profile.level}</span>
          </div>
          <p class="ok-helper">Magias concedidas pelo mestre</p>
          ${
            granted.length
              ? `<p class="ok-chip-row">${granted
                  .map((item) => {
                    const spell = details.spells.find((candidate) => candidate.id === item.spell_id);
                    return `<span class="ok-chip">${escapeHtml(spell?.name || item.spell_id)}
                      <button class="ok-button" type="button" data-revoke="${escapeHtml(item.spell_id)}" aria-label="Retirar ${escapeHtml(spell?.name || item.spell_id)}">Retirar</button></span>`;
                  })
                  .join('')}</p>`
              : '<p class="ok-copy">Nenhuma magia concedida.</p>'
          }
          <div class="ok-toolbar">
            <label class="ok-helper" for="grant-${escapeHtml(profile.id)}">Conceder magia</label>
            <select id="grant-${escapeHtml(profile.id)}" data-grant-select>
              ${available.map((spell) => `<option value="${escapeHtml(spell.id)}">${escapeHtml(spell.name)}</option>`).join('')}
            </select>
            <button class="ok-button" type="button" data-grant ${available.length ? '' : 'disabled'}>Conceder</button>
            <button class="ok-button" type="button" data-remove-member>Remover da campanha</button>
          </div>
        </li>
      `;
    })
    .join('')}</ul>`;
}

function enemiesMarkup(details) {
  if (!details.enemies.length) return emptyBlock('Nenhum inimigo publicado.');
  return `<ul class="ok-combat-enemies">${details.enemies
    .map(
      (enemy) => html`
        <li class="ok-combatant">
          <label class="ok-combatant__head" for="release-${escapeHtml(enemy.id)}">
            <input id="release-${escapeHtml(enemy.id)}" type="checkbox" data-release="${escapeHtml(enemy.id)}" ${details.releasedEnemyIds.has(enemy.id) ? 'checked' : ''} />
            <strong>${escapeHtml(enemy.name)}</strong>
            <span class="ok-badge">Nível ${enemy.level}</span>
          </label>
        </li>
      `,
    )
    .join('')}</ul>`;
}

export async function renderMasterView(container, { session }) {
  container.innerHTML = loadingBlock('Abrindo a sua campanha...');
  const userId = session.user.id;
  const campaignResult = await loadOwnCampaign(userId);
  if (!campaignResult.ok) {
    container.innerHTML = errorBlock(campaignResult.error.message);
    return;
  }
  if (!campaignResult.data) {
    createForm(container, userId);
    return;
  }
  const campaign = campaignResult.data;
  const detailsResult = await loadCampaignDetails(campaign.id);
  if (!detailsResult.ok) {
    container.innerHTML = errorBlock(detailsResult.error.message);
    return;
  }
  const details = detailsResult.data;

  container.innerHTML = html`
    <div class="ok-quests">
      <section class="ok-panel" aria-labelledby="master-title">
        <h2 id="master-title" class="ok-section-title">Campanha · ${escapeHtml(campaign.name)}</h2>
        <div id="master-combat"></div>
      </section>
      <section class="ok-panel" aria-labelledby="members-title">
        <h2 id="members-title" class="ok-section-title">Jogadores</h2>
        <form class="ok-field" data-form="member">
          <label for="member-name">Convidar pelo nome do personagem</label>
          <input id="member-name" name="name" type="text" required />
          <button class="ok-button ok-button--primary" type="submit">Convidar</button>
        </form>
        <p class="ok-helper" role="status" aria-live="polite" data-feedback="members"></p>
        ${membersMarkup(details)}
      </section>
      <section class="ok-panel" aria-labelledby="enemies-title">
        <h2 id="enemies-title" class="ok-section-title">Inimigos liberados</h2>
        <p class="ok-copy">Só os inimigos liberados podem entrar em um combate da campanha.</p>
        ${enemiesMarkup(details)}
        <p class="ok-helper" role="status" aria-live="polite" data-feedback="enemies"></p>
      </section>
    </div>
  `;

  const reload = () => renderMasterView(container, { session });
  const membersFeedback = container.querySelector('[data-feedback="members"]');
  const enemiesFeedback = container.querySelector('[data-feedback="enemies"]');

  container.querySelector('[data-form="member"]').addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = String(new FormData(event.currentTarget).get('name') || '').trim();
    if (!name) return;
    feedbackLine(membersFeedback, 'Convidando...');
    const result = await addMember(campaign.id, name);
    if (!result.ok) {
      feedbackLine(membersFeedback, result.error.message, 'is-error');
      return;
    }
    reload();
  });

  container.querySelectorAll('[data-member]').forEach((card) => {
    const profileId = card.dataset.member;
    card.querySelector('[data-grant]')?.addEventListener('click', async () => {
      const spellId = card.querySelector('[data-grant-select]').value;
      const result = await setSpellGranted(campaign.id, profileId, spellId, true);
      if (!result.ok) return feedbackLine(membersFeedback, result.error.message, 'is-error');
      reload();
    });
    card.querySelectorAll('[data-revoke]').forEach((button) => {
      button.addEventListener('click', async () => {
        const result = await setSpellGranted(campaign.id, profileId, button.dataset.revoke, false);
        if (!result.ok) return feedbackLine(membersFeedback, result.error.message, 'is-error');
        reload();
      });
    });
    card.querySelector('[data-remove-member]')?.addEventListener('click', async () => {
      const result = await removeMember(campaign.id, profileId);
      if (!result.ok) return feedbackLine(membersFeedback, result.error.message, 'is-error');
      reload();
    });
  });

  container.querySelectorAll('[data-release]').forEach((input) => {
    input.addEventListener('change', async () => {
      const result = await setEnemyReleased(campaign.id, input.dataset.release, input.checked);
      if (!result.ok) {
        input.checked = !input.checked;
        feedbackLine(enemiesFeedback, result.error.message, 'is-error');
        return;
      }
      feedbackLine(enemiesFeedback, input.checked ? 'Inimigo liberado.' : 'Inimigo retirado.', 'is-success');
      if (input.checked) details.releasedEnemyIds.add(input.dataset.release);
      else details.releasedEnemyIds.delete(input.dataset.release);
      renderCombatArea();
    });
  });

  const combatHost = container.querySelector('#master-combat');

  async function renderCombatArea() {
    const active = await fetchActiveCombat({ campaignId: campaign.id });
    if (active.ok && active.data.active) {
      const log = await loadSessionLog(active.data.sessionId);
      const driver = createRemoteDriver(active.data, { log, campaignId: campaign.id });
      mountFight(combatHost, {
        driver,
        perspective: 'master',
        title: 'Combate da campanha',
        endNote: 'Combate registrado no servidor.',
        initialEvents: driver.getLog(),
        leaveLabel: 'Encerrar combate',
        onLeave: async () => {
          await abandonRemoteCombat(driver.sessionId, { campaignId: campaign.id });
          renderCombatArea();
        },
        onExit: () => renderCombatArea(),
      });
      return;
    }

    const released = details.enemies.filter((enemy) => details.releasedEnemyIds.has(enemy.id));
    combatHost.innerHTML = html`
      <h3 class="ok-combat__heading">Iniciar combate</h3>
      ${
        !details.members.length
          ? '<p class="ok-copy">Convide ao menos um jogador para iniciar um combate.</p>'
          : !released.length
            ? '<p class="ok-copy">Libere ao menos um inimigo abaixo para iniciar um combate.</p>'
            : html`
                <p class="ok-copy">Escolha os inimigos da luta (até 4). Todos os jogadores da campanha entram.</p>
                <ul class="ok-combat-enemies" data-pick>
                  ${released
                    .map(
                      (enemy) => html`
                        <li class="ok-combatant">
                          <label class="ok-combatant__head" for="pick-${escapeHtml(enemy.id)}">
                            <input id="pick-${escapeHtml(enemy.id)}" type="checkbox" value="${escapeHtml(enemy.id)}" />
                            <strong>${escapeHtml(enemy.name)}</strong>
                            <span class="ok-badge">Nível ${enemy.level}</span>
                          </label>
                        </li>
                      `,
                    )
                    .join('')}
                </ul>
                <div class="ok-toolbar">
                  <button class="ok-button ok-button--primary" type="button" data-start-campaign>Iniciar combate</button>
                </div>
              `
      }
      <p class="ok-helper ${active.ok ? '' : 'is-error'}" role="status" aria-live="polite" data-feedback="combat">${active.ok ? '' : escapeHtml(active.error.message)}</p>
    `;
    const start = combatHost.querySelector('[data-start-campaign]');
    if (start) {
      start.addEventListener('click', async () => {
        const picked = [...combatHost.querySelectorAll('[data-pick] input:checked')].map((input) => input.value);
        const feedback = combatHost.querySelector('[data-feedback="combat"]');
        if (!picked.length) return feedbackLine(feedback, 'Escolha ao menos um inimigo.', 'is-error');
        start.disabled = true;
        const result = await startCampaignCombat(campaign.id, picked);
        if (!result.ok) {
          start.disabled = false;
          return feedbackLine(feedback, result.error.message, 'is-error');
        }
        renderCombatArea();
      });
    }
  }

  await renderCombatArea();
}
