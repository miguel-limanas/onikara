import { requireAdminSession, signOutAdmin } from '../services/adminAuth.js';
import { mountAvatarButton } from '../ui/avatarControl.js';
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

const navGroups = [
  {
    label: 'Visão Geral',
    items: [
      ['dashboard', 'Dashboard', 'grid'],
      ['audit', 'Auditoria', 'list', 'logs'],
    ],
  },
  {
    label: 'Catálogos de Jogo',
    items: [
      ['classes', 'Classes', 'users', '', 'catalogs', 'rpg_classes'],
      ['racas', 'Raças', 'star', '', 'catalogs', 'rpg_races'],
      ['elementos', 'Elementos', 'spark', '', 'catalogs', 'elements'],
      ['magias', 'Magias', 'flame', '48', 'catalogs', 'spells'],
      ['itens', 'Itens & Equipamentos', 'box', '', 'catalogs', 'items'],
      ['inimigos', 'Inimigos & NPCs', 'alert', '', 'catalogs', 'enemies'],
      ['missoes', 'Missões', 'check', '', 'catalogs', 'quests'],
      ['relationships', 'Vínculos', 'link'],
    ],
  },
  {
    label: 'Balanceamento',
    items: [
      ['progressao', 'Progressão & XP', 'trend', '', 'balance', '', 'progression_rules'],
      ['mana', 'Mana', 'spark', '', 'balance', '', 'mana_rules'],
      ['combate', 'Regras de Combate', 'sword', '', 'balance', '', 'combat_rules'],
      ['loot', 'Loot & Raridade', 'box', '', 'balance', '', 'loot_rules'],
    ],
  },
  {
    label: 'Plataforma',
    items: [
      ['support', 'Jogadores & Suporte', 'users'],
    ],
  },
];

const navItems = navGroups.flatMap((group) => group.items);

let currentSession;
let currentNavId = 'dashboard';

async function boot() {
  const auth = await requireAdminSession();
  if (auth.status === 'anonymous') {
    window.location.href = '/';
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
        <h1 class="ok-route-title">Permissão administrativa requerida</h1>
        <p class="ok-copy">${escapeHtml(message)}</p>
        <button id="blocked-logout" class="ok-button ok-button--primary">Sair</button>
      </section>
    </main>
  `;
  document.querySelector('#blocked-logout').addEventListener('click', async () => {
    await signOutAdmin();
    window.location.href = '/';
  });
}

function renderShell() {
  root.innerHTML = html`
    <div id="admin-particles" class="ok-admin-particles" aria-hidden="true"></div>
    <div class="ok-admin-rune-bg" aria-hidden="true"></div>
    <div class="ok-admin-shell" data-mode="admin">
      <aside class="ok-sidebar" aria-label="Navegação administrativa">
        <div class="ok-sidebar__brand">
          <span class="ok-logo-mark" aria-hidden="true"></span>
          <div>
            <strong class="ok-logo-text">ONIKARA</strong>
            <p class="ok-logo-role">Painel Administrativo</p>
          </div>
        </div>
        <nav>
          ${navGroups
            .map(
              (group) => html`
                <div class="ok-sidebar-section">
                  <p class="ok-sidebar-label">${group.label}</p>
                  ${group.items
                    .map(
                      ([id, label, iconName, badge, route, catalogTable, ruleTable]) => html`
                        <button
                          class="ok-nav-button"
                          data-nav-id="${id}"
                          data-view="${route || id}"
                          data-label="${escapeHtml(label)}"
                          ${catalogTable ? `data-catalog-table="${catalogTable}"` : ''}
                          ${ruleTable ? `data-rule-table="${ruleTable}"` : ''}
                        >
                          ${icon(iconName)}
                          <span>${label}</span>
                          ${badge ? `<span class="ok-nav-badge">${badge}</span>` : ''}
                        </button>
                      `,
                    )
                    .join('')}
                </div>
              `,
            )
            .join('')}
        </nav>
        <div class="ok-sidebar-footer">
          <div class="ok-admin-chip">
            <span class="ok-admin-avatar">AD</span>
            <div>
              <p class="ok-admin-name">${escapeHtml(currentSession?.user?.email || 'admin')}</p>
              <p class="ok-admin-role-tag">platform admin</p>
            </div>
          </div>
        </div>
      </aside>
      <section class="ok-admin-content">
        <header class="ok-admin-topbar">
          <div class="ok-topbar-breadcrumb">
            <span>Admin</span>
            <span>/</span>
            <strong id="breadcrumb">Dashboard</strong>
          </div>
          <div class="ok-topbar-actions">
            <button class="ok-topbar-button ok-topbar-button--primary" data-view="catalogs" data-label="Catálogos" data-catalog-table="rpg_classes">Novo conteúdo</button>
            <span id="admin-avatar"></span>
            <span class="ok-topbar-divider" aria-hidden="true"></span>
            <button id="logout" class="ok-topbar-button ok-topbar-button--ghost">Sair</button>
          </div>
        </header>
        <main id="admin-main" class="ok-admin-main">
          <div class="ok-page-header">
            <p class="ok-page-eyebrow">Onikara Control</p>
            <h1 id="view-title" class="ok-page-title">Dashboard <em>operacional</em></h1>
          </div>
          <section id="view-root">${loadingBlock()}</section>
        </main>
      </section>
    </div>
  `;

  seedAdminParticles();

  mountAvatarButton(document.querySelector('#admin-avatar'), {
    userId: currentSession.user.id,
    name: currentSession.user.email || 'Admin',
    size: 'sm',
  });

  document.querySelector('#logout').addEventListener('click', async () => {
    await signOutAdmin();
    window.location.href = '/';
  });

  document.querySelectorAll('[data-view]').forEach((button) => {
    button.addEventListener('click', () => navigate(button.dataset.view, {
      navId: button.dataset.navId,
      label: button.dataset.label,
      catalogTable: button.dataset.catalogTable,
      ruleTable: button.dataset.ruleTable,
    }));
  });
}

export async function navigate(view, options = {}) {
  currentNavId = options.navId || view;
  document.querySelectorAll('[data-view]').forEach((button) => {
    const current = (button.dataset.navId || button.dataset.view) === currentNavId;
    button.setAttribute('aria-current', current ? 'page' : 'false');
    button.classList.toggle('is-active', current);
  });
  const label = options.label || navItems.find(([id]) => id === currentNavId)?.[1] || view;
  document.querySelector('#breadcrumb').textContent = label;
  document.querySelector('#view-title').innerHTML = `${escapeHtml(label.split(' ')[0])} <em>${escapeHtml(label.split(' ').slice(1).join(' ') || 'operacional')}</em>`;
  const viewRoot = document.querySelector('#view-root');
  viewRoot.innerHTML = loadingBlock();
  delete viewRoot.dataset.catalogTable;
  delete viewRoot.dataset.ruleTable;
  if (options.catalogTable) viewRoot.dataset.catalogTable = options.catalogTable;
  if (options.ruleTable) viewRoot.dataset.ruleTable = options.ruleTable;
  await views[view](viewRoot, { navigate, session: currentSession });
}

async function renderDashboard(target) {
  target.innerHTML = loadingBlock('Carregando dashboard operacional...');
  const data = await loadDashboardData();
  const catalogTotal = Object.values(data.catalogCounts).reduce((sum, value) => sum + (value || 0), 0);
  const activeRules = Object.values(data.ruleCounts).reduce((sum, value) => sum + (value.active || 0), 0);
  const drafts = Object.values(data.ruleCounts).reduce((sum, value) => sum + (value.draft || 0), 0);

  target.innerHTML = html`
    <section class="ok-grid-4">
      <div class="ok-metric"><span>Catálogos</span><strong>${catalogTotal}</strong><small>conteúdo governado</small></div>
      <div class="ok-metric"><span>Regras ativas</span><strong class="is-gold">${activeRules}</strong><small>publicadas</small></div>
      <div class="ok-metric"><span>Drafts</span><strong class="is-red">${drafts}</strong><small>pendentes</small></div>
      <div class="ok-metric"><span>Auditoria</span><strong>${data.recentAudit.length}</strong><small>eventos recentes</small></div>
    </section>

    <section class="ok-panel">
      <div class="ok-section-head">
        <div class="ok-section-title-bar"><h2 class="ok-section-title">Status de catálogos</h2></div>
        <button class="ok-topbar-button ok-topbar-button--ghost" data-view="catalogs">Abrir catálogos</button>
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
      <div class="ok-section-head">
        <div class="ok-section-title-bar"><h2 class="ok-section-title">Auditoria recente</h2></div>
        <button class="ok-topbar-button ok-topbar-button--ghost" data-view="audit">Ver logs</button>
      </div>
      ${
        data.recentAudit.length
          ? html`
              <div class="ok-table-wrap">
                <table class="ok-table">
                  <thead><tr><th>Quando</th><th>Ação</th><th>Entidade</th><th>ID</th></tr></thead>
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
  target.querySelectorAll('[data-view]').forEach((button) => {
    button.addEventListener('click', () => navigate(button.dataset.view));
  });
}

function icon(name) {
  const icons = {
    grid: '<rect x="1" y="1" width="5" height="5" rx="1"/><rect x="8" y="1" width="5" height="5" rx="1"/><rect x="1" y="8" width="5" height="5" rx="1"/><rect x="8" y="8" width="5" height="5" rx="1"/>',
    list: '<path d="M2 3h10M2 7h10M2 11h6"/>',
    book: '<path d="M2 2.5h4.5A2.5 2.5 0 019 5v6.5H4A2 2 0 012 9.5z"/><path d="M9 5a2.5 2.5 0 012.5-2.5H12v9H9z"/>',
    star: '<path d="M7 1l1.8 3.6 4.2.6-3 2.9.7 4.1L7 10.1l-3.7 2.1.7-4.1-3-2.9 4.2-.6z"/>',
    spark: '<path d="M7 1v12M1 7h12M3 3l8 8M11 3l-8 8"/>',
    flame: '<path d="M7 1c0 3.3-2 6-5 7 2 .7 4 .5 5 2 1-1.5 3-1.3 5-2-3-1-5-3.7-5-7z"/>',
    box: '<rect x="2" y="4" width="10" height="8" rx="1"/><path d="M5 4V3a2 2 0 014 0v1"/>',
    alert: '<path d="M7 2L2 11h10L7 2z"/><path d="M7 8v1"/><circle cx="7" cy="6" r=".5" fill="currentColor" stroke="none"/>',
    check: '<path d="M2 2h10v10H2z"/><path d="M5 7l1.5 1.5L9 5"/>',
    sword: '<path d="M2 12L12 2M9 2h3v3"/><path d="M2 5L5 2"/>',
    link: '<path d="M5.8 4.2l1-1a3 3 0 014.2 4.2l-1 1"/><path d="M8.2 9.8l-1 1A3 3 0 013 6.6l1-1"/><path d="M5.5 8.5l3-3"/>',
    trend: '<path d="M2 10l3-4 2 2 2-4 3 4"/>',
    users: '<circle cx="5" cy="4.5" r="2.2"/><path d="M1.5 12c0-2.2 1.6-4 3.5-4s3.5 1.8 3.5 4"/><path d="M9 6.5a2 2 0 100-4"/><path d="M10 8.5c1.5.4 2.5 1.8 2.5 3.5"/>',
  };
  return `<svg class="ok-nav-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">${icons[name] || icons.grid}</svg>`;
}

function seedAdminParticles() {
  const particleRoot = document.querySelector('#admin-particles');
  if (!particleRoot || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const colors = ['#C8102E', '#C9A84C'];
  for (let index = 0; index < 20; index += 1) {
    const ember = document.createElement('span');
    const size = Math.random() * 2 + 1;
    const duration = Math.random() * 16 + 10;
    const delay = Math.random() * 16;
    const dx = (Math.random() - 0.5) * 120;
    ember.className = 'ok-ember';
    ember.style.cssText = `width:${size}px;height:${size}px;background:${colors[index % colors.length]};left:${Math.random() * 100}%;bottom:0;animation-duration:${duration}s;animation-delay:${delay}s;--dx:${dx}px`;
    particleRoot.appendChild(ember);
  }
}

boot();
