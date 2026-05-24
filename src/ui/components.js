export function html(strings, ...values) {
  return strings.reduce((out, part, index) => out + part + (values[index] ?? ''), '');
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function statusBadge(status) {
  const safe = escapeHtml(status || 'unknown');
  const map = {
    active: 'is-success',
    draft: 'is-warning',
    archived: 'is-muted',
    insert: 'is-success',
    update: 'is-warning',
    delete: 'is-error',
  };
  return `<span class="ok-badge ${map[status] || ''}">${safe}</span>`;
}

export function loadingBlock(message = 'Carregando dados do Supabase...') {
  return `<div class="ok-empty is-loading" aria-live="polite">${escapeHtml(message)}</div>`;
}

export function emptyBlock(message = 'Nenhum registro encontrado.') {
  return `<div class="ok-empty is-empty">${escapeHtml(message)}</div>`;
}

export function errorBlock(message) {
  return `<div class="ok-empty is-error" role="alert">${escapeHtml(message)}</div>`;
}

export async function confirmDialog({ title, message, confirmLabel = 'Confirmar', danger = false }) {
  const overlay = document.createElement('div');
  overlay.className = 'ok-dialog-backdrop';
  overlay.innerHTML = html`
    <section class="ok-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <h2 id="confirm-title" class="ok-route-title">${escapeHtml(title)}</h2>
      <p class="ok-copy">${escapeHtml(message)}</p>
      <div class="ok-toolbar">
        <button class="ok-button" data-action="cancel">Cancelar</button>
        <button class="ok-button ${danger ? 'ok-button--danger' : 'ok-button--primary'}" data-action="confirm">
          ${escapeHtml(confirmLabel)}
        </button>
      </div>
    </section>
  `;
  document.body.appendChild(overlay);
  const cancel = overlay.querySelector('[data-action="cancel"]');
  const confirm = overlay.querySelector('[data-action="confirm"]');
  cancel.focus();

  return new Promise((resolve) => {
    const close = (value) => {
      overlay.remove();
      resolve(value);
    };
    cancel.addEventListener('click', () => close(false));
    confirm.addEventListener('click', () => close(true));
    overlay.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') close(false);
    });
  });
}
