let container;

function ensureContainer() {
  if (!container) {
    container = document.createElement('div');
    container.className = 'ok-toast-stack';
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }
  return container;
}

export function showToast(message, type = 'success') {
  const target = ensureContainer();
  const toast = document.createElement('div');
  toast.className = `ok-toast is-${type}`;
  toast.textContent = message;
  target.appendChild(toast);
  setTimeout(() => toast.remove(), 4200);
}
