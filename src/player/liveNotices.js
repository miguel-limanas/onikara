import { watchChanges } from '../services/live.js';
import { escapeHtml } from '../ui/components.js';

// Avisos ao vivo para o jogador: o mestre iniciou um combate da campanha.
export function mountLiveNotices(host, { profile, onOpenCombat }) {
  if (!profile) return { stop() {} };

  function show(message, actionLabel, action) {
    const notice = document.createElement('div');
    notice.className = 'ok-notice';
    notice.setAttribute('role', 'alert');
    notice.innerHTML = `
      <strong>${escapeHtml(message)}</strong>
      <div class="ok-toolbar">
        <button class="ok-button ok-button--primary" type="button" data-act>${escapeHtml(actionLabel)}</button>
        <button class="ok-button" type="button" data-dismiss>Dispensar</button>
      </div>`;
    notice.querySelector('[data-act]').addEventListener('click', () => {
      notice.remove();
      action();
    });
    notice.querySelector('[data-dismiss]').addEventListener('click', () => notice.remove());
    host.prepend(notice);
    // Fora da aba: também avisa pelo navegador, se o usuário já permitiu notificações.
    try {
      if (document.hidden && window.Notification?.permission === 'granted') {
        new Notification('Onikara', { body: message });
      }
    } catch {
      // notificações do sistema indisponíveis
    }
  }

  const stop = watchChanges(
    `notices:${profile.id}`,
    [{ table: 'combat_sessions', event: 'INSERT' }],
    ({ payload }) => {
      const row = payload?.new;
      if (!row || !row.campaign_id || row.status !== 'active') return;
      host.querySelectorAll('[data-combat-notice]').forEach((node) => node.remove());
      show('O mestre iniciou um combate!', 'Entrar no combate', onOpenCombat);
      host.querySelector('.ok-notice')?.setAttribute('data-combat-notice', '');
      // Quem já está na aba de combate, sem luta aberta, vê o combate direto.
      if (window.location.hash === '#combate' && document.querySelector('.ok-combat-select')) onOpenCombat();
    },
    { alive: () => host.isConnected, debounceMs: 50 },
  );
  return { stop };
}
