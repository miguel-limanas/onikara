import {
  abandonRemoteCombat,
  createRemoteDriver,
  fetchActiveCombat,
  awardRewards,
  loadSessionLog,
  previewRewards,
  startCampaignCombat,
} from '../services/playerCombat.js';
import { loadCombatRewards } from '../services/playerCombat.js';
import {
  cancelInvitation,
  createCampaign,
  endCampaign,
  inviteMember,
  loadCampaignDetails,
  loadLastCombatSession,
  loadCampaignById,
  loadMemberCounts,
  loadOwnCampaigns,
  activateCampaign,
  removeMember,
  searchCandidates,
  setEnemyReleased,
  setMedicineDt,
  setSpellGranted,
  updateCampaign,
} from '../services/masterCampaign.js';
import { emptyBlock, errorBlock, escapeHtml, formatDate, html, loadingBlock } from '../ui/components.js';
import { renderCampaignHistory } from './campaignHistory.js';
import { avatarMarkup, itemAvatarMarkup } from '../ui/avatar.js';
import { watchChanges } from '../services/live.js';
import { createAvatarResolver } from './combatAvatars.js';
import { mountMasterQuests } from './masterQuestsPanel.js';
import { attachLive, mountFight } from './fightScreen.js';

// Combates vencidos já fechados pelo mestre; sobrevive às atualizações parciais da tela.
const dismissedSessions = new Set();

const MASTER_TABS = [
  ['visao', 'Visão geral'],
  ['jogadores', 'Jogadores'],
  ['missoes', 'Missões'],
  ['inimigos', 'Inimigos'],
  ['historico', 'Histórico'],
  ['config', 'Configurações'],
];
const TAB_KEY = 'onikara:master-tab';

function feedbackLine(node, message, tone = '') {
  if (!node) return;
  node.className = `ok-helper ${tone}`.trim();
  node.textContent = message;
}

const STORY_TEMPLATES = [
  (name) =>
    `Nas montanhas onde o último sol se apaga, ${name} nasce de um pacto quebrado entre clãs Oni. Os chifres antigos voltaram a sangrar mana e as fraquezas elementais deixaram de obedecer à razão: o fogo teme a água, a tempestade devora a terra, e ninguém sabe quem está reescrevendo as regras. O grupo chega ao refúgio sem aliados e com pouca mana. Cada combate revela um pedaço da verdade, e cada vitória cobra um preço que só o mestre conhece.`,
  (name) =>
    `Em ${name}, uma aldeia de ferro e cinzas vive à sombra de um portão que ninguém ousa abrir. Dizem que, a cada lua, uma criatura cruza o portão cercada de brasas e não volta igual. Os aventureiros são os únicos que ainda sabem ler as fraquezas elementais dos monstros. A missão é simples de dizer e difícil de cumprir: descobrir quem está alimentando o portão antes que a próxima lua nasça.`,
  (name) =>
    `${name} começa com uma traição. O mestre dos clãs foi derrubado por um discípulo que roubou a Pedra de Mana e a quebrou em fragmentos espalhados pelo reino. Cada fragmento desperta um guardião elemental, e só quem dominar o equilíbrio entre fogo, água, tempestade e terra poderá reuni-los. Os jogadores são os últimos recrutas do refúgio: jovens, sem fama, mas com a mana certa para mudar o destino.`,
];
let storyCursor = 0;

// Preenche o campo de história com uma sugestão; pede confirmação antes de substituir texto existente.
function bindStorySuggest(root, getName) {
  const button = root.querySelector('[data-suggest-story]');
  const field = root.querySelector('textarea[name="description"]');
  if (!button || !field) return;
  button.addEventListener('click', () => {
    if (field.value.trim() && !window.confirm('Substituir a história atual pela sugestão?')) return;
    const name = (getName() || 'a campanha').trim() || 'a campanha';
    field.value = STORY_TEMPLATES[storyCursor % STORY_TEMPLATES.length](name);
    storyCursor += 1;
    field.focus();
  });
}


const SELECTED_KEY = 'onikara:master-campaign';

function selectedCampaign() {
  try {
    return sessionStorage.getItem(SELECTED_KEY);
  } catch {
    return null;
  }
}

function selectCampaign(id, { tab = null } = {}) {
  try {
    if (id) sessionStorage.setItem(SELECTED_KEY, id);
    else sessionStorage.removeItem(SELECTED_KEY);
    if (tab) sessionStorage.setItem(TAB_KEY, tab);
  } catch {
    // sessionStorage indisponível
  }
}

const CAMPAIGN_STATUS = {
  active: { label: 'Ativa', badge: 'is-success' },
  draft: { label: 'Em construção', badge: 'is-warning' },
  archived: { label: 'Encerrada', badge: '' },
};

function campaignCard(row, playerCount) {
  const status = CAMPAIGN_STATUS[row.status] || CAMPAIGN_STATUS.archived;
  const story = row.description ? escapeHtml(row.description.slice(0, 180)) + (row.description.length > 180 ? '…' : '') : 'Ainda sem história.';
  return html`
    <li class="ok-combatant ok-campaign-card" data-campaign="${escapeHtml(row.id)}">
      <div class="ok-combatant__head">
        <strong>${escapeHtml(row.name)}</strong>
        <span class="ok-badge ${status.badge}">${status.label}</span>
        ${row.status !== 'archived' ? `<span class="ok-badge">${playerCount} ${playerCount === 1 ? 'jogador' : 'jogadores'}</span>` : ''}
      </div>
      <p class="ok-copy">${story}</p>
      <p class="ok-helper">${row.status === 'archived' ? `Encerrada em ${escapeHtml(formatDate(row.ended_at))}` : `Criada em ${escapeHtml(formatDate(row.created_at))}`}</p>
      <div class="ok-toolbar"><button class="ok-button ok-button--primary" type="button" data-open>${row.status === 'archived' ? 'Ver histórico' : 'Abrir campanha'}</button></div>
    </li>
  `;
}

// Lista de campanhas do mestre: ativa, em construção e encerradas.
async function renderCampaignList(container, session) {
  const userId = session.user.id;
  container.innerHTML = loadingBlock('Carregando as suas campanhas...');
  const result = await loadOwnCampaigns(userId);
  if (!result.ok) {
    container.innerHTML = errorBlock(result.error.message);
    return;
  }
  const rows = result.data;
  const counts = new Map();
  const ids = rows.filter((row) => row.status !== 'archived').map((row) => row.id);
  if (ids.length) {
    const members = await runMemberCounts(ids);
    members.forEach((count, id) => counts.set(id, count));
  }
  const group = (status) => rows.filter((row) => row.status === status);
  const section = (title, list, empty) => html`
    <section class="ok-panel">
      <h2 class="ok-section-title">${title}</h2>
      ${list.length ? `<ul class="ok-combat-enemies">${list.map((row) => campaignCard(row, counts.get(row.id) || 0)).join('')}</ul>` : `<p class="ok-copy">${empty}</p>`}
    </section>
  `;
  const hasActive = group('active').length > 0;
  container.innerHTML = html`
    <div class="ok-quests">
      <section class="ok-panel" aria-labelledby="campaigns-title">
        <h2 id="campaigns-title" class="ok-section-title">Campanhas</h2>
        <p class="ok-copy">
          Monte campanhas em construção e ative uma por vez. Abra uma campanha para configurar a história,
          convidar jogadores, cadastrar missões e conduzir combates.
        </p>
        <div class="ok-toolbar"><button class="ok-button ok-button--primary" type="button" data-new>Nova campanha</button></div>
      </section>
      ${section('Ativa', group('active'), 'Nenhuma campanha ativa. Abra uma em construção e ative-a.')}
      ${section('Em construção', group('draft'), hasActive ? 'Nenhuma campanha em construção.' : 'Crie uma nova campanha para começar.')}
      ${group('archived').length ? section('Encerradas', group('archived'), '') : ''}
    </div>
  `;

  container.querySelector('[data-new]').addEventListener('click', () => renderNewCampaign(container, session));
  container.querySelectorAll('[data-campaign]').forEach((card) => {
    card.querySelector('[data-open]').addEventListener('click', () => {
      selectCampaign(card.dataset.campaign, { tab: 'config' });
      renderMasterView(container, { session });
    });
  });

  watchChanges(
    `master-list:${userId}`,
    [
      { table: 'campaigns', filter: `master_user_id=eq.${userId}` },
      { table: 'campaign_members' },
    ],
    () => renderCampaignList(container, session),
    { alive: () => container.querySelector('[data-new]')?.isConnected },
  );
}

async function runMemberCounts(campaignIds) {
  const result = await loadMemberCounts(campaignIds);
  return result;
}

function renderNewCampaign(container, session) {
  const userId = session.user.id;
  container.innerHTML = html`
    <div class="ok-quests">
      <section class="ok-panel" aria-labelledby="new-title">
        <h2 id="new-title" class="ok-section-title">Nova campanha</h2>
        <p class="ok-copy">A campanha nasce em construção. Você configura tudo e só depois a ativa para jogar.</p>
        <form class="ok-field" data-form="campaign">
          <label for="campaign-name">Nome da campanha</label>
          <input id="campaign-name" name="name" type="text" minlength="2" maxlength="80" required />
          <label for="campaign-description">História da campanha</label>
          <textarea id="campaign-description" name="description" maxlength="4000" rows="6" placeholder="Conte o cenário, o conflito e o que os aventureiros encontram."></textarea>
          <button class="ok-button" type="button" data-suggest-story>Sugerir uma história</button>
          <div class="ok-toolbar">
            <button class="ok-button ok-button--primary" type="submit">Criar campanha</button>
            <button class="ok-button" type="button" data-cancel>Voltar</button>
          </div>
          <p class="ok-helper" role="status" aria-live="polite" data-feedback></p>
        </form>
      </section>
    </div>
  `;
  bindStorySuggest(container, () => container.querySelector('#campaign-name').value);
  container.querySelector('[data-cancel]').addEventListener('click', () => renderCampaignList(container, session));
  container.querySelector('form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const feedback = container.querySelector('[data-feedback]');
    const data = new FormData(event.currentTarget);
    feedbackLine(feedback, 'Criando campanha...');
    const result = await createCampaign(userId, String(data.get('name')), String(data.get('description') || ''));
    if (!result.ok) {
      feedbackLine(feedback, result.error.message, 'is-error');
      return;
    }
    selectCampaign(result.data.id, { tab: 'config' });
    renderMasterView(container, { session });
  });
}

// Campanha encerrada: só leitura (história e histórico de combates).
async function renderArchivedCampaign(container, session, campaign) {
  container.innerHTML = html`
    <div class="ok-quests">
      <div class="ok-detail-head">
        <button class="ok-button" type="button" data-back>← Campanhas</button>
        <span class="ok-badge">Encerrada em ${escapeHtml(formatDate(campaign.ended_at))}</span>
      </div>
      <section class="ok-panel">
        <h2 class="ok-section-title">${escapeHtml(campaign.name)}</h2>
        ${campaign.description ? `<p class="ok-story">${escapeHtml(campaign.description)}</p>` : '<p class="ok-copy">Sem história registrada.</p>'}
      </section>
      <section class="ok-panel">
        <h2 class="ok-section-title">Histórico de combates</h2>
        <div data-history></div>
      </section>
    </div>
  `;
  container.querySelector('[data-back]').addEventListener('click', () => {
    selectCampaign(null);
    renderMasterView(container, { session });
  });
  renderCampaignHistory(container.querySelector('[data-history]'), campaign.id);
}

const STATUS_ICONS = {
  accepted:
    '<span class="ok-status-icon is-accepted" title="Convite aceito"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9" fill="currentColor" opacity=".2"/><path d="M5.5 10.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>Aceito</span>',
  pending:
    '<span class="ok-status-icon is-pending" title="Aguardando aceite"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9" fill="currentColor" opacity=".2"/><path d="M10 5v5l3 2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>Aguardando</span>',
};

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
          <div class="ok-combatant__avatar">
            ${avatarMarkup({ src: details.avatars.get(profile.id) || null, name: profile.character_name, size: 'md' })}
            <div class="ok-combatant__head">
              <strong>${escapeHtml(profile.character_name)}</strong>
              <span class="ok-badge">${escapeHtml(className(profile.class_id))} · Nível ${profile.level}</span>
              ${STATUS_ICONS.accepted}
              ${details.emails.get(profile.id) ? `<span class="ok-helper ok-player-email">${escapeHtml(details.emails.get(profile.id))}</span>` : ''}
            </div>
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

function invitationsMarkup(details) {
  if (!details.invitations.length) return '';
  const className = (id) => details.classes.find((item) => item.id === id)?.name || id;
  return html`
    <h3 class="ok-combat__heading">Convites pendentes</h3>
    <ul class="ok-combat-enemies">
      ${details.invitations
        .map(
          (row) => html`
            <li class="ok-combatant" data-invitation="${escapeHtml(row.id)}">
              <div class="ok-combatant__avatar">
                ${avatarMarkup({ src: details.avatars.get(row.profile?.id) || null, name: row.profile?.character_name, size: 'md' })}
                <div class="ok-combatant__head">
                  <strong>${escapeHtml(row.profile?.character_name || 'Personagem')}</strong>
                  <span class="ok-badge">${escapeHtml(className(row.profile?.class_id))} · Nível ${row.profile?.level ?? '?'}</span>
                  ${STATUS_ICONS.pending}
                  ${details.emails.get(row.profile?.id) ? `<span class="ok-helper ok-player-email">${escapeHtml(details.emails.get(row.profile?.id))}</span>` : ''}
                </div>
              </div>
              <div class="ok-toolbar"><button class="ok-button" type="button" data-cancel-invite>Cancelar convite</button></div>
            </li>
          `,
        )
        .join('')}
    </ul>
  `;
}

// Campo de convite com sugestões (nome do personagem ou e-mail) enquanto o mestre digita.
function bindInviteSearch(root, campaignId, { feedback, onInvited }) {
  const form = root.querySelector('[data-form="member"]');
  const input = form.querySelector('input[name="query"]');
  const list = form.querySelector('[data-suggestions]');
  const submit = form.querySelector('button[type="submit"]');
  let chosen = null;
  let timer = null;
  let sequence = 0;
  let options = [];
  let cursor = -1;

  function close() {
    list.hidden = true;
    list.innerHTML = '';
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    options = [];
    cursor = -1;
  }

  function choose(candidate) {
    chosen = candidate;
    input.value = candidate.character_name;
    submit.disabled = false;
    feedbackLine(feedback, `${candidate.character_name} · ${candidate.email}`, 'is-success');
    close();
  }

  function highlight(index) {
    cursor = index;
    list.querySelectorAll('[role="option"]').forEach((node, position) => {
      node.setAttribute('aria-selected', String(position === index));
    });
    if (index >= 0) input.setAttribute('aria-activedescendant', `candidate-${index}`);
  }

  function showOptions(rows) {
    options = rows;
    if (!rows.length) {
      list.innerHTML = '<li class="ok-helper">Nenhum jogador disponível com esse nome ou e-mail.</li>';
      list.hidden = false;
      return;
    }
    list.innerHTML = rows
      .map(
        (row, index) => html`
          <li role="presentation">
            <button class="ok-suggest__option" type="button" role="option" id="candidate-${index}" aria-selected="false" data-index="${index}" ${row.invited ? 'disabled' : ''}>
              <strong>${escapeHtml(row.character_name)}</strong>
              <span class="ok-helper">${escapeHtml(row.email)} · Nível ${row.level}</span>
              ${row.invited ? '<span class="ok-badge is-warning">Convite pendente</span>' : ''}
            </button>
          </li>
        `,
      )
      .join('');
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    list.querySelectorAll('[data-index]').forEach((button) => {
      button.addEventListener('mousedown', (event) => event.preventDefault());
      button.addEventListener('click', () => choose(options[Number(button.dataset.index)]));
    });
  }

  input.addEventListener('input', () => {
    chosen = null;
    submit.disabled = true;
    clearTimeout(timer);
    const term = input.value.trim();
    if (term.length < 2) {
      close();
      return;
    }
    timer = setTimeout(async () => {
      const ticket = ++sequence;
      const result = await searchCandidates(campaignId, term);
      if (ticket !== sequence) return;
      if (!result.ok) {
        close();
        feedbackLine(feedback, result.error.message, 'is-error');
        return;
      }
      showOptions(result.data);
    }, 250);
  });

  input.addEventListener('keydown', (event) => {
    if (list.hidden) return;
    const enabled = [...list.querySelectorAll('[data-index]:not([disabled])')].map((node) => Number(node.dataset.index));
    if (!enabled.length) return;
    const position = enabled.indexOf(cursor);
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      highlight(enabled[(position + 1) % enabled.length]);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      highlight(enabled[(position - 1 + enabled.length) % enabled.length]);
    } else if (event.key === 'Enter' && cursor >= 0) {
      event.preventDefault();
      choose(options[cursor]);
    } else if (event.key === 'Escape') {
      close();
    }
  });

  input.addEventListener('blur', () => setTimeout(close, 150));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!chosen) {
      feedbackLine(feedback, 'Escolha um jogador entre as sugestões.', 'is-error');
      return;
    }
    submit.disabled = true;
    feedbackLine(feedback, 'Enviando convite...');
    const result = await inviteMember(campaignId, chosen.profile_id);
    if (!result.ok) {
      submit.disabled = false;
      feedbackLine(feedback, result.error.message, 'is-error');
      return;
    }
    onInvited(chosen.character_name);
  });
}

export async function renderMasterView(container, { session }) {
  container.innerHTML = loadingBlock('Abrindo a sua campanha...');
  const userId = session.user.id;
  const selected = selectedCampaign();
  if (!selected) {
    await renderCampaignList(container, session);
    return;
  }
  const campaignResult = await loadCampaignById(selected);
  if (!campaignResult.ok) {
    container.innerHTML = errorBlock(campaignResult.error.message);
    return;
  }
  if (!campaignResult.data || campaignResult.data.master_user_id !== userId) {
    selectCampaign(null);
    await renderCampaignList(container, session);
    return;
  }
  if (campaignResult.data.status === 'archived') {
    await renderArchivedCampaign(container, session, campaignResult.data);
    return;
  }
  let campaign = campaignResult.data;
  const detailsResult = await loadCampaignDetails(campaign.id);
  if (!detailsResult.ok) {
    container.innerHTML = errorBlock(detailsResult.error.message);
    return;
  }
  const details = detailsResult.data;
  const archivedHtml = '';

  container.innerHTML = html`
    <div class="ok-quests">
      <div class="ok-detail-head">
        <button class="ok-button" type="button" data-back>← Campanhas</button>
        <strong>${escapeHtml(campaign.name)}</strong>
        <span class="ok-badge ${campaign.status === 'active' ? 'is-success' : 'is-warning'}" data-status-badge>${campaign.status === 'active' ? 'Ativa' : 'Em construção'}</span>
        ${campaign.status === 'draft' ? '<button class="ok-button ok-button--primary" type="button" data-activate>Ativar campanha</button>' : ''}
      </div>
      <p class="ok-helper" role="status" aria-live="polite" data-feedback="activate"></p>
      <nav class="ok-subtabs" role="tablist" aria-label="Seções do mestre">
        ${MASTER_TABS.map(([id, label]) => `<button class="ok-subtab" type="button" role="tab" id="tab-${id}" data-tab="${id}" aria-selected="false">${label}</button>`).join('')}
      </nav>
      <section class="ok-panel" aria-labelledby="campaigns-title" data-tab-panel="visao">
        <h2 id="campaigns-title" class="ok-section-title">Resumo da campanha</h2>
        <ul class="ok-combat-enemies">
          <li class="ok-combatant" data-overview>
            <div class="ok-combatant__head">
              <strong data-overview-name>${escapeHtml(campaign.name)}</strong>
              <span class="ok-badge ${campaign.status === 'active' ? 'is-success' : 'is-warning'}">${campaign.status === 'active' ? 'Ativa' : 'Em construção'}</span>
              <span class="ok-badge" data-overview-players></span>
              <span class="ok-badge" data-overview-enemies></span>
              <span class="ok-badge">DT medicina ${campaign.medicine_dt ?? 12}</span>
            </div>
            <p class="ok-copy" data-overview-story></p>
            <p class="ok-helper">Criada em ${escapeHtml(formatDate(campaign.created_at))}</p>
          </li>
        </ul>
        <h3 class="ok-combat__heading ok-overview__heading">Jogadores</h3>
        <div data-overview-people></div>
        <div class="ok-toolbar">
          <button class="ok-button" type="button" data-goto-settings>Abrir configurações</button>
        </div>
      </section>
      <section class="ok-panel" aria-labelledby="master-title" data-tab-panel="visao">
        <h2 id="master-title" class="ok-section-title" data-campaign-title>Campanha · ${escapeHtml(campaign.name)}</h2>
        <div id="master-combat"></div>
      </section>
      <section class="ok-panel" aria-labelledby="settings-title" data-tab-panel="config">
        <h2 id="settings-title" class="ok-section-title">Configurações da campanha</h2>
        <form class="ok-field" data-form="settings">
          <label for="campaign-name">Nome da campanha</label>
          <input id="campaign-name" name="name" type="text" minlength="2" maxlength="80" required value="${escapeHtml(campaign.name)}" />
          <label for="campaign-description">História da campanha</label>
          <textarea id="campaign-description" name="description" maxlength="4000" rows="7" placeholder="Conte o cenário, o conflito e o que os aventureiros encontram.">${escapeHtml(campaign.description || '')}</textarea>
          <button class="ok-button" type="button" data-suggest-story>Sugerir uma história</button>
          <button class="ok-button ok-button--primary" type="submit">Salvar campanha</button>
          <p class="ok-helper" role="status" aria-live="polite" data-feedback="settings"></p>
        </form>
        <form class="ok-field" data-form="dt">
          <label for="medicine-dt">DT do teste de medicina (1 a 40; vazio usa o padrão 12)</label>
          <input id="medicine-dt" name="dt" type="number" min="1" max="40" value="${campaign.medicine_dt ?? ''}" />
          <button class="ok-button" type="submit">Salvar DT</button>
          <p class="ok-helper" role="status" aria-live="polite" data-feedback="dt"></p>
        </form>
        <div class="ok-danger-zone">
          <h3 class="ok-combat__heading">Encerrar campanha</h3>
          <p class="ok-copy">Os jogadores saem da campanha, convites pendentes são cancelados e o histórico de combates fica guardado. Depois você pode criar outra campanha.</p>
          <div class="ok-toolbar" data-end-area></div>
          <p class="ok-helper" role="status" aria-live="polite" data-feedback="end"></p>
        </div>
      </section>
      <section class="ok-panel" aria-labelledby="members-title" data-tab-panel="jogadores">
        <h2 id="members-title" class="ok-section-title">Jogadores</h2>
        <form class="ok-field ok-suggest" data-form="member" autocomplete="off">
          <label for="member-query">Convidar pelo nome do personagem ou e-mail</label>
          <input id="member-query" name="query" type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="member-suggestions" placeholder="Comece a digitar..." />
          <ul id="member-suggestions" class="ok-suggest__list" role="listbox" data-suggestions hidden></ul>
          <button class="ok-button ok-button--primary" type="submit" disabled>Enviar convite</button>
          <p class="ok-helper" role="status" aria-live="polite" data-feedback="members"></p>
        </form>
        <div data-people></div>
      </section>
      <section class="ok-panel" aria-labelledby="quests-title" data-tab-panel="missoes">
        <h2 id="quests-title" class="ok-section-title">Missões</h2>
        <p class="ok-copy">Você conduz as missões: atribua ao jogador, confirme os objetivos e entregue a recompensa.</p>
        <p class="ok-helper" role="status" aria-live="polite" data-feedback="quests"></p>
        <div data-quests></div>
      </section>
      <section class="ok-panel" aria-labelledby="enemies-title" data-tab-panel="inimigos">
        <h2 id="enemies-title" class="ok-section-title">Inimigos liberados</h2>
        <p class="ok-copy">Só os inimigos liberados podem entrar em um combate da campanha.</p>
        ${enemiesMarkup(details)}
        <p class="ok-helper" role="status" aria-live="polite" data-feedback="enemies"></p>
      </section>
      <section class="ok-panel" aria-labelledby="history-title" data-tab-panel="historico">
        <h2 id="history-title" class="ok-section-title">Histórico de combates</h2>
        <div data-history></div>
      </section>
      ${archivedHtml}
    </div>
  `;

  function showTab(id) {
    const valid = MASTER_TABS.some(([tab]) => tab === id) ? id : 'visao';
    container.querySelectorAll('[data-tab-panel]').forEach((panel) => {
      panel.hidden = panel.dataset.tabPanel !== valid;
    });
    container.querySelectorAll('[data-tab]').forEach((button) => {
      const active = button.dataset.tab === valid;
      button.setAttribute('aria-selected', String(active));
      button.classList.toggle('is-active', active);
    });
    try {
      sessionStorage.setItem(TAB_KEY, valid);
    } catch {
      // sessionStorage indisponível
    }
  }
  container.querySelectorAll('[data-tab]').forEach((button) => {
    button.addEventListener('click', () => showTab(button.dataset.tab));
  });
  let initialTab = 'visao';
  try {
    initialTab = sessionStorage.getItem(TAB_KEY) || 'visao';
  } catch {
    // sessionStorage indisponível
  }
  showTab(initialTab);

  const membersFeedback = container.querySelector('[data-feedback="members"]');
  const enemiesFeedback = container.querySelector('[data-feedback="enemies"]');
  const peopleHost = container.querySelector('[data-people]');
  const historyHost = container.querySelector('[data-history]');

  // Atualiza só a lista de jogadores e convites; o combate e o resto da tela ficam como estão.
  async function refreshPeople() {
    const fresh = await loadCampaignDetails(campaign.id);
    if (!fresh.ok) {
      feedbackLine(membersFeedback, fresh.error.message, 'is-error');
      return;
    }
    details.members = fresh.data.members;
    details.granted = fresh.data.granted;
    details.invitations = fresh.data.invitations;
    details.avatars = fresh.data.avatars;
    details.emails = fresh.data.emails;
    renderPeople();
    questsPanel.refresh();
  }

  function updateOverview() {
    const n = details.members.length;
    const invited = details.invitations.length;
    container.querySelector('[data-overview-players]').textContent =
      `${n} ${n === 1 ? 'jogador' : 'jogadores'}${invited ? ` · ${invited} ${invited === 1 ? 'convite pendente' : 'convites pendentes'}` : ''}`;
    const released = details.releasedEnemyIds.size;
    container.querySelector('[data-overview-enemies]').textContent = `${released} ${released === 1 ? 'inimigo liberado' : 'inimigos liberados'}`;
    container.querySelector('[data-overview-name]').textContent = campaign.name;
    const people = [
      ...details.members.map((row) => ({ profile: row.profile, status: 'accepted' })),
      ...details.invitations.map((row) => ({ profile: row.profile, status: 'pending' })),
    ];
    container.querySelector('[data-overview-people]').innerHTML = people.length
      ? `<ul class="ok-people-strip">${people
          .map(
            ({ profile, status }) => `<li class="ok-people-strip__item">
              ${avatarMarkup({ src: details.avatars.get(profile.id) || null, name: profile.character_name, size: 'md' })}
              <span class="ok-people-strip__text"><strong>${escapeHtml(profile.character_name)}</strong>
              <span class="ok-helper">${escapeHtml(details.emails.get(profile.id) || '')}</span></span>
              ${STATUS_ICONS[status]}
            </li>`,
          )
          .join('')}</ul>`
      : '<p class="ok-copy">Nenhum jogador ainda. Convide jogadores na aba Jogadores.</p>';
    const story = container.querySelector('[data-overview-story]');
    story.textContent = campaign.description || 'Ainda sem história. Escreva ou peça uma sugestão em "Configurações da campanha".';
  }

  function renderPeople() {
    updateOverview();
    peopleHost.innerHTML = invitationsMarkup(details) + membersMarkup(details);

    peopleHost.querySelectorAll('[data-invitation]').forEach((card) => {
      card.querySelector('[data-cancel-invite]').addEventListener('click', async () => {
        const result = await cancelInvitation(card.dataset.invitation);
        if (!result.ok) return feedbackLine(membersFeedback, result.error.message, 'is-error');
        feedbackLine(membersFeedback, 'Convite cancelado.', 'is-success');
        refreshPeople();
      });
    });

    peopleHost.querySelectorAll('[data-member]').forEach((card) => {
      const profileId = card.dataset.member;
      card.querySelector('[data-grant]')?.addEventListener('click', async () => {
        const spellId = card.querySelector('[data-grant-select]').value;
        const result = await setSpellGranted(campaign.id, profileId, spellId, true);
        if (!result.ok) return feedbackLine(membersFeedback, result.error.message, 'is-error');
        refreshPeople();
      });
      card.querySelectorAll('[data-revoke]').forEach((button) => {
        button.addEventListener('click', async () => {
          const result = await setSpellGranted(campaign.id, profileId, button.dataset.revoke, false);
          if (!result.ok) return feedbackLine(membersFeedback, result.error.message, 'is-error');
          refreshPeople();
        });
      });
      card.querySelector('[data-remove-member]')?.addEventListener('click', async () => {
        const result = await removeMember(campaign.id, profileId);
        if (!result.ok) return feedbackLine(membersFeedback, result.error.message, 'is-error');
        await refreshPeople();
        if (!combatHost.querySelector('.ok-combat')) renderCombatArea();
      });
    });
  }

  bindInviteSearch(container, campaign.id, {
    feedback: membersFeedback,
    onInvited: async (name) => {
      container.querySelector('[data-form="member"] input[name="query"]').value = '';
      feedbackLine(membersFeedback, `Convite enviado para ${name}. O jogador precisa aceitar para entrar na campanha.`, 'is-success');
      await refreshPeople();
    },
  });

  container.querySelector('[data-form="settings"]').addEventListener('submit', async (event) => {
    event.preventDefault();
    const feedback = container.querySelector('[data-feedback="settings"]');
    const data = new FormData(event.currentTarget);
    feedbackLine(feedback, 'Salvando...');
    const result = await updateCampaign(campaign.id, {
      name: String(data.get('name') || ''),
      description: String(data.get('description') || ''),
    });
    if (!result.ok) return feedbackLine(feedback, result.error.message, 'is-error');
    campaign = result.data;
    container.querySelector('[data-campaign-title]').textContent = `Campanha · ${campaign.name}`;
    updateOverview();
    feedbackLine(feedback, 'Campanha salva.', 'is-success');
  });

  container.querySelector('[data-form="dt"]').addEventListener('submit', async (event) => {
    event.preventDefault();
    const feedback = container.querySelector('[data-feedback="dt"]');
    const raw = String(new FormData(event.currentTarget).get('dt') || '').trim();
    const value = raw === '' ? null : Number(raw);
    if (value !== null && (!Number.isInteger(value) || value < 1 || value > 40)) {
      feedbackLine(feedback, 'Informe um número inteiro de 1 a 40.', 'is-error');
      return;
    }
    const result = await setMedicineDt(campaign.id, value);
    feedbackLine(feedback, result.ok ? 'DT salva.' : result.error.message, result.ok ? 'is-success' : 'is-error');
  });

  bindStorySuggest(container.querySelector('[data-form="settings"]'), () => container.querySelector('#campaign-name').value);
  container.querySelector('[data-goto-settings]').addEventListener('click', () => {
    showTab('config');
    container.querySelector('#settings-title').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  container.querySelector('[data-back]').addEventListener('click', () => {
    selectCampaign(null);
    renderMasterView(container, { session });
  });
  container.querySelector('[data-activate]')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    const feedback = container.querySelector('[data-feedback="activate"]');
    button.disabled = true;
    const result = await activateCampaign(campaign.id);
    if (!result.ok) {
      button.disabled = false;
      feedbackLine(feedback, result.error.message, 'is-error');
      return;
    }
    renderMasterView(container, { session });
  });

  // Encerrar exige confirmação em dois passos.
  const endArea = container.querySelector('[data-end-area]');
  const endFeedback = container.querySelector('[data-feedback="end"]');
  function bindEnd() {
    endArea.innerHTML = '<button class="ok-button" type="button" data-end-campaign>Encerrar campanha</button>';
    endArea.querySelector('[data-end-campaign]').addEventListener('click', () => {
      endArea.innerHTML =
        '<button class="ok-button ok-button--primary" type="button" data-confirm-end>Confirmar encerramento</button>' +
        '<button class="ok-button" type="button" data-keep>Manter campanha</button>';
      endArea.querySelector('[data-keep]').addEventListener('click', bindEnd);
      endArea.querySelector('[data-confirm-end]').addEventListener('click', async (event) => {
        event.currentTarget.disabled = true;
        const result = await endCampaign(campaign.id);
        if (!result.ok) {
          feedbackLine(endFeedback, result.error.message, 'is-error');
          bindEnd();
          return;
        }
        selectCampaign(null);
        await renderMasterView(container, { session });
      });
    });
  }
  bindEnd();

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
      updateOverview();
      // Não remonta uma luta em andamento ou recém-encerrada.
      if (!combatHost.querySelector('.ok-combat')) renderCombatArea();
    });
  });

  const combatHost = container.querySelector('#master-combat');

  async function renderRewardsPanel(node, driver, state) {
    if (state.status !== 'victory') return;
    node.innerHTML = '<p class="ok-helper" role="status">Calculando a sugestão de recompensas...</p>';
    const result = await previewRewards(campaign.id, driver.sessionId);
    if (!result.ok) {
      node.innerHTML = `<p class="ok-helper is-error" role="alert">${escapeHtml(result.error.message)}</p>`;
      return;
    }
    const itemName = (id) => state.catalog.items[id]?.name || id;
    const itemChip = (id, quantity) =>
      `<span class="ok-item-line">${itemAvatarMarkup({ item: state.catalog.items[id] || { name: id }, size: 'sm' })}${escapeHtml(itemName(id))} x${quantity}</span>`;
    if (result.data.awarded) {
      const lines = (result.data.summary.awards || []).map((award) => {
        const player = state.participants.find((p) => p.refId === award.profile_id);
        const items = (award.items || []).map((item) => itemChip(item.item_id, item.quantity)).join(' ');
        const level = award.level_after > award.level_before ? ` · subiu para o nível ${award.level_after}` : '';
        return `<li>${escapeHtml(player?.name || 'Jogador')}: ${award.xp} XP${items ? ' · ' + items : ''}${level}</li>`;
      });
      node.innerHTML = `<h4 class="ok-combat__heading">Recompensas concedidas</h4><ul class="ok-copy">${lines.join('')}</ul>`;
      return;
    }

    const players = result.data.suggestion.players;
    node.innerHTML = html`
      <h4 class="ok-combat__heading">Recompensas sugeridas</h4>
      <p class="ok-copy">Ajuste o que quiser e conceda. O XP total foi dividido igualmente entre os jogadores.</p>
      <ul class="ok-combat-enemies">
        ${players
          .map(
            (player) => html`
              <li class="ok-combatant" data-reward="${escapeHtml(player.profileId)}">
                <strong>${escapeHtml(player.name)}</strong>
                <label class="ok-helper" for="xp-${escapeHtml(player.profileId)}">XP</label>
                <input id="xp-${escapeHtml(player.profileId)}" type="number" min="0" max="10000" value="${player.xp}" data-xp />
                ${
                  player.items.length
                    ? player.items
                        .map(
                          (item) => `<label class="ok-helper ok-item-line"><input type="checkbox" checked data-item="${escapeHtml(item.item_id)}" data-quantity="${item.quantity}" />
                            ${itemAvatarMarkup({ item: state.catalog.items[item.item_id] || { name: item.item_id }, size: 'sm' })}${escapeHtml(itemName(item.item_id))} x${item.quantity}</label>`,
                        )
                        .join('')
                    : '<span class="ok-helper">Sem itens</span>'
                }
              </li>
            `,
          )
          .join('')}
      </ul>
      <div class="ok-toolbar"><button class="ok-button ok-button--primary" type="button" data-award>Conceder recompensas</button></div>
      <p class="ok-helper" role="status" aria-live="polite" data-award-feedback></p>
    `;
    node.querySelector('[data-award]').addEventListener('click', async (event) => {
      const button = event.currentTarget;
      button.disabled = true;
      const adjustments = [...node.querySelectorAll('[data-reward]')].map((row) => ({
        profileId: row.dataset.reward,
        xp: Number(row.querySelector('[data-xp]').value || 0),
        items: [...row.querySelectorAll('[data-item]:checked')].map((input) => ({
          item_id: input.dataset.item,
          quantity: Number(input.dataset.quantity),
        })),
      }));
      const outcome = await awardRewards(campaign.id, driver.sessionId, adjustments);
      if (!outcome.ok) {
        button.disabled = false;
        node.querySelector('[data-award-feedback]').textContent = outcome.error.message;
        return;
      }
      renderRewardsPanel(node, driver, state);
    });
  }

  // Mostra o resultado da última vitória (e as recompensas) até o mestre fechar.
  async function renderLastVictory() {
    const last = await loadLastCombatSession(campaign.id);
    if (!last.ok || !last.data || last.data.status !== 'victory' || dismissedSessions.has(last.data.id)) return false;
    // Recompensas já concedidas: o combate está no histórico e a tela de luta não volta.
    if (await loadCombatRewards(last.data.id)) return false;
    const view = await fetchActiveCombat({ campaignId: campaign.id, sessionId: last.data.id });
    if (!view.ok || !view.data.state) return false;
    const driver = createRemoteDriver(view.data, { campaignId: campaign.id });
    mountFight(combatHost, {
      driver,
      avatarFor: await createAvatarResolver({ sessionId: last.data.id }),
      perspective: 'master',
      title: 'Último combate',
      endNote: 'Combate registrado no servidor.',
      initialEvents: await loadSessionLog(last.data.id),
      onExit: () => {
        dismissedSessions.add(last.data.id);
        renderCombatArea();
      },
      renderEndExtra: (node, { state }) => renderRewardsPanel(node, driver, state),
    });
    return true;
  }

  async function renderCombatArea() {
    if (campaign.status === 'draft') {
      combatHost.innerHTML = '<p class="ok-copy">Campanha em construção. Ative a campanha para iniciar combates.</p>';
      return;
    }
    const active = await fetchActiveCombat({ campaignId: campaign.id });
    if (active.ok && active.data.active) {
      const log = await loadSessionLog(active.data.sessionId);
      const driver = createRemoteDriver(active.data, { log, campaignId: campaign.id });
      const fight = mountFight(combatHost, {
        driver,
        avatarFor: await createAvatarResolver({ sessionId: driver.sessionId }),
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
        renderEndExtra: (node, { state }) => renderRewardsPanel(node, driver, state),
      });
      attachLive({ driver, fight, container: combatHost });
      return;
    }

    if (!(active.ok && active.data.active) && (await renderLastVictory())) return;

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

  renderPeople();
  renderCampaignHistory(historyHost, campaign.id);
  const questsPanel = mountMasterQuests(container.querySelector('[data-quests]'), {
    campaignId: campaign.id,
    getMembers: () => details.members,
    feedback: container.querySelector('[data-feedback="quests"]'),
  });

  // Ao vivo: aceite de convite, entrada/saída de jogadores e combates encerrados.
  watchChanges(
    `master:${campaign.id}`,
    [
      { table: 'campaign_members', filter: `campaign_id=eq.${campaign.id}` },
      { table: 'campaign_invitations', filter: `campaign_id=eq.${campaign.id}` },
      { table: 'combat_sessions', filter: `campaign_id=eq.${campaign.id}` },
    ],
    ({ table }) => {
      if (table === 'combat_sessions') renderCampaignHistory(historyHost, campaign.id);
      else refreshPeople();
    },
    { alive: () => historyHost.isConnected },
  );

  await renderCombatArea();
}
