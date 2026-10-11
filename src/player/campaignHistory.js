import { loadCampaignHistory, loadCombatSnapshotCatalog } from '../services/masterCampaign.js';
import { loadSessionLog } from '../services/playerCombat.js';
import { itemAvatarMarkup } from '../ui/avatar.js';
import { emptyBlock, errorBlock, escapeHtml, html, loadingBlock } from '../ui/components.js';
import { logMarkup } from './combatLog.js';

const OUTCOMES = {
  victory: { label: 'Vitória', badge: 'is-success' },
  defeat: { label: 'Derrota', badge: 'is-error' },
  escaped: { label: 'O grupo escapou', badge: 'is-warning' },
  abandoned: { label: 'Encerrado pelo mestre', badge: '' },
};

function formatWhen(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

function duration(row) {
  if (!row.started_at || !row.ended_at) return '';
  const minutes = Math.max(1, Math.round((new Date(row.ended_at) - new Date(row.started_at)) / 60000));
  return `${minutes} min`;
}

function rewardLine(summary) {
  const awards = summary?.awards || [];
  const xp = awards.reduce((total, award) => total + Number(award.xp || 0), 0);
  return xp > 0 ? `${xp} XP distribuídos` : '';
}

function listMarkup(rows) {
  if (!rows.length) return emptyBlock('Nenhum combate encerrado nesta campanha ainda.');
  return `<ul class="ok-combat-enemies ok-history">${rows
    .map((row, index) => {
      const outcome = OUTCOMES[row.status] || { label: row.status, badge: '' };
      const team = (name) =>
        (row.participants || [])
          .filter((participant) => participant.team === name)
          .map((participant) => escapeHtml(participant.display_name))
          .join(', ');
      const reward = rewardLine(row.rewards?.summary);
      return html`
        <li class="ok-combatant ok-history__item" data-session="${escapeHtml(row.id)}">
          <div class="ok-combatant__head">
            <strong>${escapeHtml(formatWhen(row.started_at))}</strong>
            <span class="ok-badge ${outcome.badge}">${escapeHtml(outcome.label)}</span>
            ${row.turn_number ? `<span class="ok-badge">${row.turn_number} rodadas</span>` : ''}
            ${duration(row) ? `<span class="ok-badge">${escapeHtml(duration(row))}</span>` : ''}
          </div>
          <p class="ok-copy"><strong>Aventureiros:</strong> ${team('player') || '—'}</p>
          <p class="ok-copy"><strong>Inimigos:</strong> ${team('enemy') || '—'}</p>
          ${reward ? `<p class="ok-helper">${escapeHtml(reward)}</p>` : ''}
          <div class="ok-toolbar">
            <button class="ok-button ok-history__toggle" type="button" aria-expanded="false" aria-controls="history-detail-${index}">Ver detalhes</button>
          </div>
          <div class="ok-history__detail" id="history-detail-${index}" hidden></div>
        </li>
      `;
    })
    .join('')}</ul>`;
}

function participantLine(participant) {
  const stats = participant.current_stats || {};
  const hp = stats.hp ?? stats.currentHp;
  const maxHp = stats.maxHp ?? stats.max_hp;
  const hpText = hp !== undefined ? `${hp}${maxHp !== undefined ? ` / ${maxHp}` : ''} HP` : '';
  return `<li>${escapeHtml(participant.display_name)}${hpText ? ` · ${escapeHtml(hpText)}` : ''}</li>`;
}

function rewardsMarkup(row, catalog) {
  const awards = row.rewards?.summary?.awards || [];
  if (!awards.length) return '';
  const nameOf = (profileId) =>
    (row.participants || []).find((participant) => participant.profile_id === profileId)?.display_name || 'Jogador';
  const lines = awards.map((award) => {
    const items = (award.items || [])
      .map(
        (item) =>
          `<span class="ok-item-line">${itemAvatarMarkup({ item: catalog.items[item.item_id] || { name: item.item_id }, size: 'sm' })}${escapeHtml(catalog.items[item.item_id]?.name || item.item_id)} x${item.quantity}</span>`,
      )
      .join(' ');
    const level = award.level_after > award.level_before ? ` · subiu para o nível ${award.level_after}` : '';
    return `<li>${escapeHtml(nameOf(award.profile_id))}: ${award.xp} XP${level}${items ? `<div class="ok-reward-list">${items}</div>` : ''}</li>`;
  });
  return `<h4 class="ok-combat__heading">Recompensas</h4><ul class="ok-copy">${lines.join('')}</ul>`;
}

async function fillDetail(node, row) {
  node.innerHTML = loadingBlock('Carregando os detalhes...');
  const [events, catalog] = await Promise.all([loadSessionLog(row.id), loadCombatSnapshotCatalog(row.id)]);
  const state = {
    participants: (row.participants || []).map((participant) => ({ id: participant.id, name: participant.display_name })),
    catalog,
  };
  const players = (row.participants || []).filter((participant) => participant.team === 'player');
  const enemies = (row.participants || []).filter((participant) => participant.team === 'enemy');
  const log = logMarkup(state, events);
  node.innerHTML = html`
    <div class="ok-history__columns">
      <div>
        <h4 class="ok-combat__heading">Aventureiros</h4>
        <ul class="ok-copy">${players.map(participantLine).join('') || '<li>—</li>'}</ul>
      </div>
      <div>
        <h4 class="ok-combat__heading">Inimigos</h4>
        <ul class="ok-copy">${enemies.map(participantLine).join('') || '<li>—</li>'}</ul>
      </div>
    </div>
    ${rewardsMarkup(row, catalog)}
    <h4 class="ok-combat__heading">Registro do combate</h4>
    ${
      log
        ? `<ol class="ok-combat-log ok-history__log" aria-label="Registro do combate">${log}</ol>`
        : '<p class="ok-helper">Sem registro detalhado para este combate.</p>'
    }
  `;
}

// Preenche `node` com o histórico de combates encerrados da campanha; cada item expande os detalhes.
export async function renderCampaignHistory(node, campaignId) {
  node.innerHTML = loadingBlock('Carregando o histórico...');
  const result = await loadCampaignHistory(campaignId);
  if (!result.ok) {
    node.innerHTML = errorBlock(result.error.message);
    return;
  }
  const rows = result.data;
  node.innerHTML = listMarkup(rows);
  node.querySelectorAll('[data-session]').forEach((item) => {
    const row = rows.find((candidate) => candidate.id === item.dataset.session);
    const toggle = item.querySelector('.ok-history__toggle');
    const detail = item.querySelector('.ok-history__detail');
    let loaded = false;
    toggle.addEventListener('click', async () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      toggle.textContent = open ? 'Ver detalhes' : 'Ocultar detalhes';
      detail.hidden = open;
      if (!open && !loaded) {
        loaded = true;
        await fillDetail(detail, row);
      }
    });
  });
}
