import { requireAdminSession, signOutAdmin } from '../services/adminAuth.js';
import { loadDashboardData } from '../services/adminDashboard.js';
import { renderCatalogsView } from './catalogsView.js';
import { renderRelationshipsView } from './relationshipsView.js';
import { renderBalanceView } from './balanceView.js';
import { renderAuditView } from './auditView.js';
import { renderSupportView } from './supportView.js';
import { emptyBlock, errorBlock, escapeHtml, formatDate, html, loadingBlock, statusBadge } from '../ui/components.js';

const root = document.querySelector('#admin-root');

const views = {
  dashboard: renderDashboard,
  catalogs: renderCatalogsView,
  relationships: renderRelationshipsView,
  balance: renderBalanceView,
  audit: renderAuditView,
  support: renderSupportView,
};

const navItems = [
  ['dashboard', 'Dashboard'],
  ['catalogs', 'Catalogos'],
  ['relationships', 'Relacionamentos'],
  ['balance', 'Balanceamento'],
  ['audit', 'Auditoria'],
  ['support', 'Suporte'],
];

let currentSession;

async function boot() {
  const auth = await requireAdminSession();
  if (auth.status === 'anonymous') {
    window.location.href = './index.html';
    return;
  }

  if (auth.status === 'blocked') {
    renderBlocked(auth.error.message);
    return;
  }

  currentSession = auth.session;
  renderShell();
  await navigate('dashboard');
}

function renderBlocked(message) {
  root.innerHTML = html`
    <main class="ok-page">
      <section class="ok-panel" role="alert">
        <p class="ok-kicker">Acesso bloqueado</p>
        <h1 class="ok-route-title">Permissao administrativa requerida</h1>
        <p class="ok-copy">${escapeHtml(message)}</p>
        <button id="blocked-logout" class="ok-button ok-button--primary">Sair</button>
      </section>
    </main>
  `;
  document.querySelector('#blocked-logout').addEventListener('click', async () => {
    await signOutAdmin();
    window.location.href = './index.html';
  });
}

function renderShell() {
  root.innerHTML = html`
    <div class="ok-admin-shell" data-mode="admin">
      <aside class="ok-sidebar" aria-label="Navegacao administrativa">
        <div class="ok-sidebar__brand">
          <img src="../.planning/design-system/assets/onikara-logotipo.png" alt="Onikara" />
          <div>
            <strong>ONIKARA</strong>
            <p class="ok-label">Admin</p>
          </div>
        </div>
        <nav>
          ${navItems
            .map(([id, label]) => `<button class="ok-button ok-nav-button" data-view="${id}">${label}</button>`)
            .join('')}
        </nav>
      </aside>
      <main id="admin-main" class="ok-admin-main">
        <header class="ok-admin-topbar">
          <div>
            <p class="ok-kicker">Admin / <span id="breadcrumb">Dashboard</span></p>
            <h1 id="view-title" class="ok-route-title">Dashboard operacional</h1>
          </div>
          <div class="ok-toolbar">
            <span class="ok-badge">admin</span>
            <button id="logout" class="ok-button">Sair</button>
          </div>
        </header>
        <section id="view-root">${loadingBlock()}</section>
      </main>
    </div>
  `;

  document.querySelector('#logout').addEventListener('click', async () => {
    await signOutAdmin();
    window.location.href = './index.html';
  });

  document.querySelectorAll('[data-view]').forEach((button) => {
    button.addEventListener('click', () => navigate(button.dataset.view));
  });
}

export async function navigate(view) {
  document.querySelectorAll('[data-view]').forEach((button) => {
    button.setAttribute('aria-current', button.dataset.view === view ? 'page' : 'false');
  });
  const label = navItems.find(([id]) => id === view)?.[1] || view;
  document.querySelector('#breadcrumb').textContent = label;
  document.querySelector('#view-title').textContent = label;
  document.querySelector('#view-root').innerHTML = loadingBlock();
  await views[view](document.querySelector('#view-root'), { navigate, session: currentSession });
}

async function renderDashboard(target) {
  target.innerHTML = loadingBlock('Carregando dashboard operacional...');
  const data = await loadDashboardData();
  const catalogTotal = Object.values(data.catalogCounts).reduce((sum, value) => sum + (value || 0), 0);
  const activeRules = Object.values(data.ruleCounts).reduce((sum, value) => sum + (value.active || 0), 0);
  const drafts = Object.values(data.ruleCounts).reduce((sum, value) => sum + (value.draft || 0), 0);

  target.innerHTML = html`
    <section class="ok-grid-4">
      <div class="ok-metric"><span>Catalogos</span><strong>${catalogTotal}</strong></div>
      <div class="ok-metric"><span>Regras ativas</span><strong>${activeRules}</strong></div>
      <div class="ok-metric"><span>Drafts</span><strong>${drafts}</strong></div>
      <div class="ok-metric"><span>Auditoria</span><strong>${data.recentAudit.length}</strong></div>
    </section>

    <section class="ok-panel">
      <div class="ok-band-header">
        <p class="ok-kicker">Status de catalogos</p>
        <h2 class="ok-route-title">Conteudo administrativo</h2>
      </div>
      <div class="ok-table-wrap">
        <table class="ok-table">
          <thead><tr><th>Tabela</th><th>Registros</th><th>Estado</th></tr></thead>
          <tbody>
            ${Object.entries(data.catalogCounts)
              .map(
                ([table, count]) => html`
                  <tr>
                    <td>${escapeHtml(table)}</td>
                    <td>${count ?? '-'}</td>
                    <td>${count === null ? statusBadge('erro') : statusBadge('active')}</td>
                  </tr>
                `,
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </section>

    <section class="ok-panel">
      <div class="ok-band-header">
        <p class="ok-kicker">Auditoria recente</p>
        <h2 class="ok-route-title">Ultimas alteracoes</h2>
      </div>
      ${
        data.recentAudit.length
          ? html`
              <div class="ok-table-wrap">
                <table class="ok-table">
                  <thead><tr><th>Quando</th><th>Acao</th><th>Entidade</th><th>ID</th></tr></thead>
                  <tbody>
                    ${data.recentAudit
                      .map(
                        (log) => html`
                          <tr>
                            <td>${formatDate(log.created_at)}</td>
                            <td>${statusBadge(log.action)}</td>
                            <td>${escapeHtml(log.entity_table)}</td>
                            <td>${escapeHtml(log.entity_id)}</td>
                          </tr>
                        `,
                      )
                      .join('')}
                  </tbody>
                </table>
              </div>
            `
          : data.auditError
            ? errorBlock(data.auditError.message)
            : emptyBlock('Nenhum log de auditoria registrado ainda.')
      }
    </section>
  `;
}

boot();
