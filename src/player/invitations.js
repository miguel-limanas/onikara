import { watchChanges } from '../services/live.js';
import { loadMyInvitations, respondInvitation } from '../services/playerCampaign.js';
import { escapeHtml, html } from '../ui/components.js';

// Notificação de convites de campanha: aparece no topo da área do jogador até ser
// aceita ou recusada. Consulta o servidor periodicamente.
export function mountInvitations(host, { profile, onAccepted, pollMs = 30000 }) {
  let timer = null;

  async function refresh() {
    if (!host.isConnected) {
      clearInterval(timer);
      return;
    }
    const result = await loadMyInvitations(profile.id);
    if (!result.ok) return;
    const rows = result.data.filter((row) => row.campaign);
    host.hidden = rows.length === 0;
    host.innerHTML = rows
      .map(
        (row) => html`
          <section class="ok-invite" role="alert" data-invitation="${escapeHtml(row.id)}">
            <div>
              <strong>Convite de campanha</strong>
              <p class="ok-copy">O mestre convidou você para a campanha <em>${escapeHtml(row.campaign.name)}</em>.</p>
              ${row.campaign.description ? `<p class="ok-helper">${escapeHtml(row.campaign.description.slice(0, 240))}${row.campaign.description.length > 240 ? '…' : ''}</p>` : ''}
              <p class="ok-helper is-error" data-invite-error></p>
            </div>
            <div class="ok-toolbar">
              <button class="ok-button ok-button--primary" type="button" data-accept>Aceitar</button>
              <button class="ok-button" type="button" data-decline>Recusar</button>
            </div>
          </section>
        `,
      )
      .join('');

    host.querySelectorAll('[data-invitation]').forEach((card) => {
      const id = card.dataset.invitation;
      const respond = async (accept) => {
        card.querySelectorAll('button').forEach((button) => {
          button.disabled = true;
        });
        const outcome = await respondInvitation(id, accept);
        if (!outcome.ok) {
          card.querySelector('[data-invite-error]').textContent = outcome.error.message;
          card.querySelectorAll('button').forEach((button) => {
            button.disabled = false;
          });
          return;
        }
        await refresh();
        if (accept) onAccepted?.();
      };
      card.querySelector('[data-accept]').addEventListener('click', () => respond(true));
      card.querySelector('[data-decline]').addEventListener('click', () => respond(false));
    });
  }

  refresh();
  // Ao vivo (Realtime); a consulta periódica é só reserva.
  const stopLive = watchChanges(
    `invites:${profile.id}`,
    [{ table: 'campaign_invitations', filter: `profile_id=eq.${profile.id}` }],
    () => refresh(),
    { alive: () => host.isConnected },
  );
  timer = setInterval(refresh, pollMs);
  return {
    refresh,
    stop: () => {
      clearInterval(timer);
      stopLive();
    },
  };
}
