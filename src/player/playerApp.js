import { requirePlayerSession, signOutPlayer } from '../services/playerAuth.js';
import { emptyBlock, errorBlock, escapeHtml, html } from '../ui/components.js';
import { renderDashboardView } from './dashboardView.js';
import { renderOnboardingView } from './onboardingView.js';

const root = document.querySelector('#player-root');

const state = {
  session: null,
  profile: null,
};

const sections = [
  { id: 'personagem', label: 'Personagem', render: (container) => renderDashboardView(container, { profile: state.profile }) },
  { id: 'inventario', label: 'Inventário', render: renderComingSoon('Inventário') },
  { id: 'magias', label: 'Magias', render: renderComingSoon('Magias') },
  { id: 'missoes', label: 'Missões', render: renderComingSoon('Missões') },
];

function renderComingSoon(title) {
  return (container) => {
    container.innerHTML = emptyBlock(`${title} chega nos próximos passos da jornada.`);
  };
}

function currentSectionId() {
  const hash = window.location.hash.replace('#', '');
  return sections.some((section) => section.id === hash) ? hash : 'personagem';
}

function mountParticles() {
  const host = document.querySelector('#player-particles');
  if (!host || host.childElementCount) return;
  const colors = ['#C8102E', '#FF1744', '#C9A84C', '#8B0000'];
  for (let index = 0; index < 36; index += 1) {
    const ember = document.createElement('span');
    const size = Math.random() * 4 + 2;
    ember.className = 'ok-ember';
    ember.style.cssText = [
      `width:${size}px`,
      `height:${size}px`,
      `background:${colors[index % colors.length]}`,
      `left:${Math.random() * 100}%`,
      `bottom:${Math.random() * 12}%`,
      `animation-duration:${Math.random() * 12 + 10}s`,
      `animation-delay:${Math.random() * 12}s`,
      `--dx:${(Math.random() - 0.5) * 140}px`,
    ].join(';');
    host.appendChild(ember);
  }
}

function renderCenter(content) {
  root.innerHTML = `<main id="player-main" class="ok-player-center" tabindex="-1">${content}</main>`;
}

async function logout() {
  await signOutPlayer();
  window.location.href = '/';
}

function renderShell() {
  root.innerHTML = html`
    <div class="ok-player-shell" data-mode="player">
      <header class="ok-player-topbar">
        <a class="ok-player-brand" href="/play" aria-label="Onikara, início">
          <img src="../.planning/design-system/assets/onikara-logotipo.png" alt="" class="ok-player-brand__logo" />
          <span class="ok-player-brand__text">Onikara</span>
        </a>
        <nav class="ok-player-nav" aria-label="Seções do jogador">
          ${sections
            .map(
              (section) =>
                `<a class="ok-player-nav__link" href="#${section.id}" data-section="${section.id}">${escapeHtml(section.label)}</a>`,
            )
            .join('')}
        </nav>
        <div class="ok-player-topbar__user">
          <span class="ok-player-topbar__name">${escapeHtml(state.profile.character_name)}</span>
          <button id="player-logout" class="ok-button" type="button">Sair</button>
        </div>
      </header>
      <main id="player-main" class="ok-player-main" tabindex="-1"></main>
    </div>
  `;
  document.querySelector('#player-logout').addEventListener('click', logout);
}

async function showSection() {
  const id = currentSectionId();
  document.querySelectorAll('.ok-player-nav__link').forEach((link) => {
    const active = link.dataset.section === id;
    link.classList.toggle('is-active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  const container = document.querySelector('#player-main');
  const section = sections.find((item) => item.id === id);
  try {
    await section.render(container);
  } catch (error) {
    container.innerHTML = errorBlock('Não foi possível carregar esta seção. Tente novamente.');
  }
}

async function showDashboard() {
  renderShell();
  window.addEventListener('hashchange', showSection);
  await showSection();
}

async function showOnboarding() {
  renderCenter('');
  await renderOnboardingView(document.querySelector('#player-main'), {
    session: state.session,
    onCreated: async (profile) => {
      state.profile = profile;
      await showDashboard();
    },
  });
}

async function boot() {
  mountParticles();
  const auth = await requirePlayerSession();

  if (auth.status === 'anonymous') {
    window.location.href = '/';
    return;
  }

  if (auth.status === 'error') {
    renderCenter(errorBlock(auth.error?.message || 'Não foi possível verificar sua sessão.'));
    return;
  }

  state.session = auth.session;
  state.profile = auth.profile;

  if (auth.status === 'needs_profile') {
    await showOnboarding();
    return;
  }

  await showDashboard();
}

boot();
