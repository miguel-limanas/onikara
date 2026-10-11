import { escapeHtml, html } from '../ui/components.js';

// Fim de combate: efeito de confete (vitória) ou fogo (derrota) e um modal que
// leva o jogador de volta à tela do personagem.

const COPY = {
  victory: { title: 'Vitória!', text: 'O grupo venceu o combate.' },
  defeat: { title: 'Derrota', text: 'O grupo foi derrotado. Descanse e volte mais forte.' },
  escaped: { title: 'O grupo escapou', text: 'Vocês fugiram do combate.' },
  abandoned: { title: 'Combate encerrado', text: 'O mestre encerrou este combate.' },
};

const CONFETTI_COLORS = ['#C8102E', '#FF1744', '#C9A84C', '#F5E6B8', '#7B61FF', '#2DD4BF'];
const FIRE_COLORS = ['#FF4500', '#FF8C00', '#FFC107', '#C8102E'];

function spawnParticles(kind, width, height) {
  const count = kind === 'victory' ? 160 : 110;
  return Array.from({ length: count }, () => {
    if (kind === 'victory') {
      return {
        x: Math.random() * width,
        y: -20 - Math.random() * height * 0.5,
        vx: (Math.random() - 0.5) * 3,
        vy: 2 + Math.random() * 4,
        size: 6 + Math.random() * 8,
        tilt: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.3,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      };
    }
    return {
      x: Math.random() * width,
      y: height + Math.random() * 40,
      vx: (Math.random() - 0.5) * 1.6,
      vy: -(1.5 + Math.random() * 3.5),
      size: 10 + Math.random() * 22,
      life: 0.6 + Math.random() * 0.8,
      color: FIRE_COLORS[Math.floor(Math.random() * FIRE_COLORS.length)],
    };
  });
}

function runCanvas(canvas, kind, still) {
  const context = canvas.getContext('2d');
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  const particles = spawnParticles(kind, canvas.width, canvas.height);
  // Movimento reduzido: um quadro estático, espalhado pela tela, sem animação.
  if (still) {
    for (const particle of particles) {
      particle.y = Math.random() * canvas.height;
      if (kind === 'defeat') particle.y = canvas.height * (0.45 + Math.random() * 0.55);
    }
  }
  const started = performance.now();
  let frame = 0;

  function tick(now) {
    const elapsed = now - started;
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (const particle of particles) {
      if (kind === 'victory') {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.tilt += particle.spin;
        context.save();
        context.translate(particle.x, particle.y);
        context.rotate(particle.tilt);
        context.fillStyle = particle.color;
        context.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size / 2);
        context.restore();
        if (particle.y > canvas.height + 20 && elapsed < 6000) {
          particle.y = -20;
          particle.x = Math.random() * canvas.width;
        }
      } else {
        particle.x += particle.vx + Math.sin((particle.y + elapsed / 6) / 30) * 0.6;
        particle.y += particle.vy;
        particle.life -= 0.006;
        if (particle.life <= 0 && elapsed < 6000) {
          particle.y = canvas.height + 10;
          particle.x = Math.random() * canvas.width;
          particle.life = 0.6 + Math.random() * 0.8;
        }
        if (particle.life > 0) {
          context.globalAlpha = Math.min(1, particle.life);
          const gradient = context.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.size);
          gradient.addColorStop(0, '#FFE9A8');
          gradient.addColorStop(0.4, particle.color);
          gradient.addColorStop(1, 'rgba(120,0,0,0)');
          context.fillStyle = gradient;
          context.beginPath();
          context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          context.fill();
          context.globalAlpha = 1;
        }
      }
    }
    if (still) return;
    if (elapsed < 8000) frame = requestAnimationFrame(tick);
    else context.clearRect(0, 0, canvas.width, canvas.height);
  }

  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
}

// Mostra o efeito e o modal. `onClose` roda quando o jogador confirma.
export function showCombatEnd({ status, extra = '', onClose }) {
  const copy = COPY[status] || COPY.abandoned;
  const effect = status === 'victory' || status === 'defeat' ? status : null;
  const overlay = document.createElement('div');
  overlay.className = `ok-end-overlay ${effect ? `is-${effect}` : ''}`;
  overlay.innerHTML = html`
    ${effect ? '<canvas class="ok-end-overlay__canvas" aria-hidden="true"></canvas>' : ''}
    <div class="ok-modal ok-end-modal is-${escapeHtml(status)}" role="dialog" aria-modal="true" aria-labelledby="end-title">
      <h2 id="end-title" class="ok-route-title">${escapeHtml(copy.title)}</h2>
      <p class="ok-copy">${escapeHtml(copy.text)}</p>
      ${extra}
      <div class="ok-toolbar"><button class="ok-button ok-button--primary" type="button" data-end-close>Voltar ao personagem</button></div>
    </div>
  `;
  document.body.appendChild(overlay);

  const canvas = overlay.querySelector('canvas');
  const stopCanvas = canvas ? runCanvas(canvas, effect, false) : () => {};
  const button = overlay.querySelector('[data-end-close]');
  button.focus();
  button.addEventListener('click', () => {
    stopCanvas();
    overlay.remove();
    onClose?.();
  });
}
