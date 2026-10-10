import { listAuditLogs } from '../services/adminAudit.js';
import { emptyBlock, errorBlock, escapeHtml, formatDate, html, loadingBlock, statusBadge } from '../ui/components.js';

export async function renderAuditView(target) {
  target.innerHTML = html`
    <section class="ok-panel">
      <div class="ok-band-header">
        <p class="ok-kicker">Auditoria</p>
        <h2 class="ok-route-title">Trilha administrativa somente leitura</h2>
        <p class="ok-helper">Somente leitura: os registros de auditoria nunca são alterados por esta tela.</p>
      </div>
      <form id="audit-filter" class="ok-form-grid">
        <label class="ok-field"><span>Entidade</span><input class="ok-input" name="entity_table" placeholder="public.spells" /></label>
        <label class="ok-field"><span>Operação</span><input class="ok-input" name="action" placeholder="insert, update, delete" /></label>
        <label class="ok-field"><span>De</span><input class="ok-input" name="from" type="datetime-local" /></label>
        <label class="ok-field"><span>Até</span><input class="ok-input" name="to" type="datetime-local" /></label>
        <button class="ok-button ok-button--primary ok-field--full" type="submit">Filtrar logs</button>
      </form>
      <div id="audit-body">${loadingBlock()}</div>
    </section>
  `;
  target.querySelector('#audit-filter').addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    await loadAudit(target, values);
  });
  await loadAudit(target);
}

async function loadAudit(target, filters = {}) {
  const body = target.querySelector('#audit-body');
  body.innerHTML = loadingBlock('Carregando admin_audit_logs...');
  const result = await listAuditLogs(filters);
  if (!result.ok) {
    body.innerHTML = errorBlock(result.error.message);
    return;
  }
  if (!result.data.length) {
    body.innerHTML = emptyBlock('Nenhum log encontrado.');
    return;
  }
  body.innerHTML = html`
    <div class="ok-table-wrap">
      <table class="ok-table">
        <thead><tr><th>Quando</th><th>Ator</th><th>Ação</th><th>Entidade</th><th>ID</th><th>Redigido</th><th>Detalhe</th></tr></thead>
        <tbody>
          ${result.data
            .map(
              (log) => html`
                <tr>
                  <td>${formatDate(log.created_at)}</td>
                  <td>${escapeHtml(log.actor_user_id || log.actor_role || '-')}</td>
                  <td>${statusBadge(log.action)}</td>
                  <td>${escapeHtml(log.entity_table)}</td>
                  <td>${escapeHtml(log.entity_id || '-')}</td>
                  <td>${log.redacted ? statusBadge('redacted') : '-'}</td>
                  <td><button class="ok-button" data-detail="${escapeHtml(JSON.stringify(log))}">Ver detalhes</button></td>
                </tr>
              `,
            )
            .join('')}
        </tbody>
      </table>
    </div>
    <section id="audit-detail" class="ok-panel" hidden></section>
  `;
  body.querySelectorAll('[data-detail]').forEach((button) => {
    button.addEventListener('click', () => {
      const log = JSON.parse(button.dataset.detail);
      const detail = body.querySelector('#audit-detail');
      detail.hidden = false;
      detail.innerHTML = html`
        <div class="ok-band-header">
          <p class="ok-kicker">Detalhe do log</p>
          <h3 class="ok-route-title">${escapeHtml(log.entity_table)}</h3>
        </div>
        <p class="ok-helper">${log.redacted ? 'Dados sensíveis foram redigidos.' : 'Antes/depois completo disponível quando registrado.'}</p>
        <div class="ok-grid-2">
          <pre class="ok-empty"><code>${escapeHtml(JSON.stringify(log.before_data, null, 2))}</code></pre>
          <pre class="ok-empty"><code>${escapeHtml(JSON.stringify(log.after_data, null, 2))}</code></pre>
        </div>
      `;
    });
  });
}
