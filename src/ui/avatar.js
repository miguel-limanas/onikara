import { escapeHtml } from './components.js';

// Avatar redondo: imagem salva ou, sem ela, um avatar padrão (silhueta Oni para
// personagens, máscara para inimigos).

const ELEMENT_COLORS = {
  fire: '#ff5a1f',
  water: '#3b9cff',
  storm: '#b085ff',
  earth: '#b08a4a',
  nature: '#4fbf6a',
  neutral: '#8a8f99',
};

function defaultSvg(kind, elementId) {
  const accent = ELEMENT_COLORS[elementId] || ELEMENT_COLORS.neutral;
  if (kind === 'enemy') {
    return `<svg viewBox="0 0 100 100" aria-hidden="true">
      <rect width="100" height="100" fill="#14090c"/>
      <circle cx="50" cy="56" r="46" fill="${accent}" opacity=".22"/>
      <path d="M26 30 L36 52 L22 46Z M74 30 L64 52 L78 46Z" fill="${accent}"/>
      <ellipse cx="50" cy="58" rx="26" ry="28" fill="#241216"/>
      <path d="M34 54 L46 58 L34 62Z M66 54 L54 58 L66 62Z" fill="${accent}"/>
      <path d="M36 74 L42 68 L46 76 L50 68 L54 76 L58 68 L64 74" fill="none" stroke="#e9d8c8" stroke-width="3" stroke-linejoin="round"/>
    </svg>`;
  }
  return `<svg viewBox="0 0 100 100" aria-hidden="true">
    <rect width="100" height="100" fill="#14090c"/>
    <circle cx="50" cy="45" r="44" fill="#8b1118" opacity=".35"/>
    <path d="M16 100 Q18 66 50 64 Q82 66 84 100Z" fill="#2a2b31"/>
    <circle cx="50" cy="44" r="19" fill="#b8826a"/>
    <path d="M36 32 L30 14 L44 28Z M64 32 L70 14 L56 28Z" fill="#e8c96a"/>
    <circle cx="43" cy="44" r="2.6" fill="#0d0d0d"/><circle cx="57" cy="44" r="2.6" fill="#0d0d0d"/>
  </svg>`;
}

// `src`: data URL ou caminho; vazio usa o padrão. `size`: sm | md | lg.
export function avatarMarkup({ src = null, name = '', kind = 'player', elementId = null, size = 'md' } = {}) {
  const label = name ? `Avatar de ${name}` : 'Avatar';
  const inner = src
    ? `<img src="${escapeHtml(src)}" alt="" draggable="false" />`
    : defaultSvg(kind, elementId);
  return `<span class="ok-avatar ok-avatar--${size} ${src ? '' : 'is-default'}" role="img" aria-label="${escapeHtml(label)}">${inner}</span>`;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Não foi possível carregar a imagem do personagem.'));
    image.src = url;
  });
}

async function composeSource(layerUrls) {
  const images = await Promise.all(layerUrls.map(loadImage));
  const canvas = document.createElement('canvas');
  canvas.width = images[0].naturalWidth;
  canvas.height = images[0].naturalHeight;
  const context = canvas.getContext('2d');
  images.forEach((image) => context.drawImage(image, 0, 0, canvas.width, canvas.height));
  return canvas;
}

const OUTPUT = 160;

function exportCrop(source, { x, y, size }) {
  const out = document.createElement('canvas');
  out.width = OUTPUT;
  out.height = OUTPUT;
  const context = out.getContext('2d');
  context.drawImage(source, x, y, size, size, 0, 0, OUTPUT, OUTPUT);
  const webp = out.toDataURL('image/webp', 0.88);
  return webp.startsWith('data:image/webp') ? webp : out.toDataURL('image/png');
}

// Editor de avatar: o jogador marca, sobre a imagem atual do personagem, a área
// quadrada (exibida redonda) que vira o avatar.
// sources: [{ id, label, loadLayers: async () => [url...] }]; vários só para quem não tem personagem.
export function openAvatarEditor({ sources, current = null, name = '', onSave }) {
  const overlay = document.createElement('div');
  overlay.className = 'ok-avatar-editor';
  overlay.innerHTML = `
    <div class="ok-modal ok-avatar-editor__dialog" role="dialog" aria-modal="true" aria-labelledby="avatar-editor-title">
      <h2 id="avatar-editor-title" class="ok-route-title">Editar avatar</h2>
      <p class="ok-copy">Arraste o círculo sobre a imagem do personagem e ajuste o tamanho. Setas do teclado movem a seleção.</p>
      ${
        sources.length > 1
          ? `<label class="ok-helper" for="avatar-source">Personagem base</label>
             <select id="avatar-source">${sources.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.label)}</option>`).join('')}</select>`
          : ''
      }
      <div class="ok-avatar-editor__body">
        <div class="ok-avatar-editor__stage" data-stage>
          <canvas data-canvas></canvas>
          <div class="ok-avatar-editor__crop" data-crop tabindex="0" role="slider" aria-label="Área do avatar"></div>
        </div>
        <div class="ok-avatar-editor__side">
          <p class="ok-helper">Prévia</p>
          <canvas class="ok-avatar-editor__preview" data-preview width="${OUTPUT}" height="${OUTPUT}"></canvas>
          <label class="ok-helper" for="avatar-size">Tamanho</label>
          <input id="avatar-size" type="range" min="80" max="600" step="2" data-size />
        </div>
      </div>
      <p class="ok-helper" role="status" aria-live="polite" data-feedback></p>
      <div class="ok-toolbar">
        <button class="ok-button ok-button--primary" type="button" data-save disabled>Salvar avatar</button>
        ${current ? '<button class="ok-button" type="button" data-reset>Voltar ao padrão</button>' : ''}
        <button class="ok-button" type="button" data-cancel>Cancelar</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const stage = overlay.querySelector('[data-stage]');
  const canvas = overlay.querySelector('[data-canvas]');
  const cropNode = overlay.querySelector('[data-crop]');
  const preview = overlay.querySelector('[data-preview]');
  const sizeInput = overlay.querySelector('[data-size]');
  const feedback = overlay.querySelector('[data-feedback]');
  const saveButton = overlay.querySelector('[data-save]');
  let source = null;
  let crop = { x: 0, y: 0, size: 300 };

  const close = () => {
    overlay.remove();
    document.removeEventListener('keydown', onKey);
  };
  const onKey = (event) => {
    if (event.key === 'Escape') close();
  };
  document.addEventListener('keydown', onKey);

  function clamp() {
    crop.size = Math.max(80, Math.min(crop.size, source.width, source.height));
    crop.x = Math.max(0, Math.min(crop.x, source.width - crop.size));
    crop.y = Math.max(0, Math.min(crop.y, source.height - crop.size));
  }

  function paint() {
    clamp();
    const scale = canvas.clientWidth / source.width;
    cropNode.style.left = `${crop.x * scale}px`;
    cropNode.style.top = `${crop.y * scale}px`;
    cropNode.style.width = `${crop.size * scale}px`;
    cropNode.style.height = `${crop.size * scale}px`;
    sizeInput.value = String(Math.round(crop.size));
    const context = preview.getContext('2d');
    context.clearRect(0, 0, OUTPUT, OUTPUT);
    context.drawImage(source, crop.x, crop.y, crop.size, crop.size, 0, 0, OUTPUT, OUTPUT);
  }

  async function useSource(item) {
    saveButton.disabled = true;
    feedback.textContent = 'Carregando a imagem...';
    try {
      source = await composeSource(await item.loadLayers());
    } catch (error) {
      feedback.textContent = error.message;
      return;
    }
    canvas.width = source.width;
    canvas.height = source.height;
    canvas.getContext('2d').drawImage(source, 0, 0);
    sizeInput.max = String(Math.min(source.width, source.height));
    // Posição inicial perto da cabeça (arte em pé, rosto no terço superior).
    crop = { size: source.width * 0.3, x: source.width * 0.5 - source.width * 0.15, y: source.height * 0.06 };
    feedback.textContent = '';
    saveButton.disabled = false;
    paint();
  }

  let drag = null;
  cropNode.addEventListener('pointerdown', (event) => {
    drag = { px: event.clientX, py: event.clientY, x: crop.x, y: crop.y };
    cropNode.setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  cropNode.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const scale = source.width / canvas.clientWidth;
    crop.x = drag.x + (event.clientX - drag.px) * scale;
    crop.y = drag.y + (event.clientY - drag.py) * scale;
    paint();
  });
  const endDrag = () => {
    drag = null;
  };
  cropNode.addEventListener('pointerup', endDrag);
  cropNode.addEventListener('pointercancel', endDrag);
  cropNode.addEventListener('keydown', (event) => {
    const step = event.shiftKey ? 40 : 12;
    const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (!moves[event.key]) return;
    event.preventDefault();
    crop.x += moves[event.key][0];
    crop.y += moves[event.key][1];
    paint();
  });
  sizeInput.addEventListener('input', () => {
    const center = { x: crop.x + crop.size / 2, y: crop.y + crop.size / 2 };
    crop.size = Number(sizeInput.value);
    crop.x = center.x - crop.size / 2;
    crop.y = center.y - crop.size / 2;
    paint();
  });
  window.addEventListener('resize', () => source && paint());

  const select = overlay.querySelector('#avatar-source');
  if (select) select.addEventListener('change', () => useSource(sources.find((item) => item.id === select.value)));

  overlay.querySelector('[data-cancel]').addEventListener('click', close);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) close();
  });

  async function persist(value) {
    saveButton.disabled = true;
    feedback.textContent = 'Salvando...';
    const result = await onSave(value);
    if (result && result.ok === false) {
      feedback.textContent = result.error?.message || 'Não foi possível salvar o avatar.';
      saveButton.disabled = false;
      return;
    }
    close();
  }
  saveButton.addEventListener('click', () => persist(exportCrop(source, crop)));
  overlay.querySelector('[data-reset]')?.addEventListener('click', () => persist(null));

  useSource(sources[0]);
  stage.focus?.();
}
