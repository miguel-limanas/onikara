import { loadMyCampaign } from '../services/playerCampaign.js';
import { emptyBlock, errorBlock, escapeHtml, formatDate, html, loadingBlock } from '../ui/components.js';
import { watchChanges } from '../services/live.js';
import { renderCampaignHistory } from './campaignHistory.js';

// Campanha ativa do jogador: história, desde quando participa e histórico de combates.
export async function renderCampaignView(container, { profile }) {
  container.innerHTML = loadingBlock('Abrindo a sua campanha...');
  const result = await loadMyCampaign(profile.id);
  if (!result.ok) {
    container.innerHTML = errorBlock(result.error.message);
    return;
  }
  const campaign = result.data;
  if (!campaign) {
    container.innerHTML = html`
      <section class="ok-panel">
        <h2 class="ok-section-title">Campanha</h2>
        ${emptyBlock('Você ainda não participa de uma campanha. Quando um mestre convidar você, o convite aparece no topo da tela.')}
      </section>
    `;
    return;
  }
  container.innerHTML = html`
    <div class="ok-quests">
      <section class="ok-panel" aria-labelledby="campaign-title">
        <h2 id="campaign-title" class="ok-section-title">${escapeHtml(campaign.name)}</h2>
        <p class="ok-helper">Você participa desde ${escapeHtml(formatDate(campaign.joined_at))}</p>
        ${
          campaign.description
            ? `<p class="ok-story">${escapeHtml(campaign.description)}</p>`
            : '<p class="ok-copy">O mestre ainda não escreveu a história desta campanha.</p>'
        }
      </section>
      <section class="ok-panel" aria-labelledby="history-title">
        <h2 id="history-title" class="ok-section-title">Histórico de combates</h2>
        <div data-history></div>
      </section>
    </div>
  `;
  const historyHost = container.querySelector('[data-history]');
  await renderCampaignHistory(historyHost, campaign.id);

  // Ao vivo: novos combates no histórico e encerramento da campanha.
  watchChanges(
    `campaign-view:${campaign.id}`,
    [
      { table: 'combat_sessions', filter: `campaign_id=eq.${campaign.id}` },
      { table: 'campaigns', filter: `id=eq.${campaign.id}` },
      { table: 'campaign_members', filter: `campaign_id=eq.${campaign.id}` },
    ],
    ({ table }) => {
      if (table === 'combat_sessions') renderCampaignHistory(historyHost, campaign.id);
      else renderCampaignView(container, { profile });
    },
    { alive: () => historyHost.isConnected },
  );
}
