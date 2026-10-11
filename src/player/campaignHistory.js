import { loadCampaignHistory } from '../services/masterCampaign.js';
import { emptyBlock, errorBlock, escapeHtml, html, loadingBlock } from '../ui/components.js';

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

function rewardLine(summary) {
  const awards = summary?.awards || [];
  const xp = awards.reduce((total, award) => total + Number(award.xp || 0), 0);
  return xp > 0 ? `${xp} XP distribuídos` : '';
}

function historyMarkup(rows) {
  if (!rows.length) return emptyBlock('Nenhum combate encerrado nesta campanha ainda.');
  return `<ul class="ok-combat-enemies ok-history">${rows
    .map((row) => {
      const outcome = OUTCOMES[row.status] || { label: row.status, badge: '' };
      const team = (name) =>
        (row.participants || [])
          .filter((participant) => participant.team === name)
          .map((participant) => escapeHtml(participant.display_name))
          .join(', ');
      const reward = rewardLine(row.rewards?.summary);
      return html`
        <li class="ok-combatant ok-history__item">
          <div class="ok-combatant__head">
            <strong>${escapeHtml(formatWhen(row.started_at))}</strong>
            <span class="ok-badge ${outcome.badge}">${escapeHtml(outcome.label)}</span>
            ${row.turn_number ? `<span class="ok-badge">${row.turn_number} rodadas</span>` : ''}
          </div>
          <p class="ok-copy"><strong>Aventureiros:</strong> ${team('player') || '—'}</p>
          <p class="ok-copy"><strong>Inimigos:</strong> ${team('enemy') || '—'}</p>
          ${reward ? `<p class="ok-helper">${escapeHtml(reward)}</p>` : ''}
        </li>
      `;
    })
    .join('')}</ul>`;
}

// Preenche `node` com o histórico de combates encerrados da campanha.
export async function renderCampaignHistory(node, campaignId) {
  node.innerHTML = loadingBlock('Carregando o histórico...');
  const result = await loadCampaignHistory(campaignId);
  node.innerHTML = result.ok ? historyMarkup(result.data) : errorBlock(result.error.message);
}
