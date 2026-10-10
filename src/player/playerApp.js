import { requirePlayerSession, signOutPlayer } from '../services/playerAuth.js';
import { errorBlock, escapeHtml, html } from '../ui/components.js';
import { renderDashboardView } from './dashboardView.js';
import { renderOnboardingView } from './onboardingView.js';

const root = document.querySelector('#player-root');

const state = {
  session: null,
  profile: null,
};

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

async function showDashboard() {
  renderShell();
  await renderDashboardView(document.querySelector('#player-main'), { profile: state.profile });
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
