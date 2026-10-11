import { loadMyCampaign } from '../services/playerCampaign.js';
import { emptyBlock, errorBlock, escapeHtml, formatDate, html, loadingBlock } from '../ui/components.js';
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
  await renderCampaignHistory(container.querySelector('[data-history]'), campaign.id);
}
