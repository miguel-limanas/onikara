import { catalogDefinitions, deleteCatalog, listCatalog, preparePayload, saveCatalog } from '../services/adminCatalogs.js';
import { confirmDialog, emptyBlock, errorBlock, escapeHtml, html, loadingBlock } from '../ui/components.js';
import { showToast } from '../ui/toast.js';

export async function renderCatalogsView(target) {
  const table = target.dataset.catalogTable || 'rpg_classes';
  target.innerHTML = renderShell(table, loadingBlock('Carregando catalogos...'));
  bindCatalogShell(target);
  await loadTable(target, table);
}

function renderShell(activeTable, body) {
  return html`
    <section class="ok-panel">
      <div class="ok-toolbar" aria-label="Ferramentas de catalogo">
        <label class="ok-field">
          <span class="ok-label">Entidade</span>
          <select id="catalog-table" class="ok-select">
            ${Object.entries(catalogDefinitions)
              .map(([id, definition]) => `<option value="${id}" ${id === activeTable ? 'selected' : ''}>${definition.label}</option>`)
              .join('')}
          </select>
        </label>
        <label class="ok-field">
          <span class="ok-label">Busca</span>
          <input id="catalog-search" class="ok-input" type="search" placeholder="Filtrar registros" />
        </label>
        <button id="catalog-new" class="ok-button ok-button--primary">Novo registro</button>
      </div>
      <div id="catalog-body">${body}</div>
    </section>
    <section id="catalog-form-panel" class="ok-panel" hidden></section>
  `;
}

function bindCatalogShell(target) {
  target.querySelector('#catalog-table').addEventListener('change', async (event) => {
    target.dataset.catalogTable = event.target.value;
    await loadTable(target, event.target.value);
  });
  target.querySelector('#catalog-search').addEventListener('input', () => filterRows(target));
  target.querySelector('#catalog-new').addEventListener('click', () => renderForm(target, target.dataset.catalogTable || 'rpg_classes'));
}

async function loadTable(target, table) {
  target.dataset.catalogTable = table;
  const body = target.querySelector('#catalog-body');
  body.innerHTML = loadingBlock('Consultando Supabase...');
  const result = await listCatalog(table);
  if (!result.ok) {
    body.innerHTML = errorBlock(result.error.message);
    return;
  }
  if (!result.data.length) {
    body.innerHTML = emptyBlock('Nenhum registro cadastrado.');
    return;
  }
  body.innerHTML = renderTable(table, result.data);
  body.querySelectorAll('[data-edit]').forEach((button) => {
    button.addEventListener('click', () => {
      const record = result.data.find((item) => item.id === button.dataset.edit);
      renderForm(target, table, record);
    });
  });
  body.querySelectorAll('[data-delete]').forEach((button) => {
    button.addEventListener('click', async () => {
      const ok = await confirmDialog({
        title: 'Confirmar exclusao',
        message: `Excluir ${button.dataset.delete}? Esta acao e auditada e pode afetar relacionamentos.`,
        confirmLabel: 'Excluir',
        danger: true,
      });
      if (!ok) return;
      const deleted = await deleteCatalog(table, button.dataset.delete);
      if (!deleted.ok) showToast(deleted.error.message, 'error');
      else showToast('Registro removido. Auditoria sera registrada pelo Supabase.', 'success');
      await loadTable(target, table);
    });
  });
}

function renderTable(table, rows) {
  const definition = catalogDefinitions[table];
  return html`
    <div class="ok-table-wrap">
      <table class="ok-table">
        <caption>${definition.label}: ${rows.length} registro(s)</caption>
        <thead>
          <tr>
            ${definition.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join('')}
            <th>Acoes</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) => html`
                <tr data-filter="${escapeHtml(JSON.stringify(row).toLowerCase())}">
                  ${definition.columns.map((column) => `<td>${formatCell(row[column])}</td>`).join('')}
                  <td>
                    <div class="ok-toolbar">
                      <button class="ok-button" data-edit="${escapeHtml(row.id)}">Editar</button>
                      <button class="ok-button ok-button--danger" data-delete="${escapeHtml(row.id)}">Excluir</button>
                    </div>
                  </td>
                </tr>
              `,
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `;
}

function formatCell(value) {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'object') return `<code>${escapeHtml(JSON.stringify(value))}</code>`;
  return escapeHtml(value);
}

function filterRows(target) {
  const needle = target.querySelector('#catalog-search').value.toLowerCase();
  target.querySelectorAll('tbody tr[data-filter]').forEach((row) => {
    row.hidden = !row.dataset.filter.includes(needle);
  });
}

function renderForm(target, table, record = null) {
  const definition = catalogDefinitions[table];
  const panel = target.querySelector('#catalog-form-panel');
  panel.hidden = false;
  panel.innerHTML = html`
    <div class="ok-band-header">
      <p class="ok-kicker">${record ? 'Editar' : 'Criar'} ${definition.label}</p>
      <h2 class="ok-route-title">${escapeHtml(record?.id || 'Novo registro')}</h2>
      <p class="ok-helper">Campos JSON sao validados antes do envio. Alteracoes administrativas sao auditadas.</p>
    </div>
    <form id="catalog-form" class="ok-form-grid" novalidate>
      ${definition.fields.map((field) => renderField(field, record?.[field.name])).join('')}
      <p id="catalog-form-status" class="ok-helper ok-field--full" aria-live="polite"></p>
      <div class="ok-toolbar ok-field--full">
        <button class="ok-button ok-button--primary" type="submit">Salvar</button>
        <button class="ok-button" type="button" id="catalog-cancel">Cancelar</button>
      </div>
    </form>
  `;
  panel.querySelector('#catalog-cancel').addEventListener('click', () => {
    panel.hidden = true;
    panel.innerHTML = '';
  });
  panel.querySelector('#catalog-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const status = panel.querySelector('#catalog-form-status');
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    submit.classList.add('is-loading');
    try {
      const values = Object.fromEntries(new FormData(form).entries());
      form.querySelectorAll('[type="checkbox"]').forEach((input) => {
        values[input.name] = input.checked;
      });
      const payload = preparePayload(definition, values);
      const result = await saveCatalog(table, payload, record?.id);
      if (!result.ok) throw new Error(result.error.message);
      status.textContent = 'Registro salvo com sucesso.';
      status.className = 'ok-helper is-success ok-field--full';
      showToast('Registro salvo. Auditoria administrativa registrada.', 'success');
      await loadTable(target, table);
    } catch (error) {
      status.textContent = error.message;
      status.className = 'ok-helper is-error ok-field--full';
    } finally {
      submit.disabled = false;
      submit.classList.remove('is-loading');
    }
  });
}

function renderField(field, value) {
  const serialized = field.type === 'json' ? JSON.stringify(value ?? field.fallback ?? {}, null, 2) : value ?? '';
  const required = field.required ? 'required' : '';
  const full = field.type === 'json' ? 'ok-field--full' : '';
  if (field.options) {
    return html`
      <label class="ok-field ${full}">
        <span>${field.label}${field.required ? ' *' : ''}</span>
        <select class="ok-select" name="${field.name}" ${required}>
          ${field.options.map((option) => `<option value="${option}" ${option === value ? 'selected' : ''}>${option}</option>`).join('')}
        </select>
      </label>
    `;
  }
  if (field.type === 'boolean') {
    return html`
      <label class="ok-field">
        <span>${field.label}</span>
        <input class="ok-input" type="checkbox" name="${field.name}" ${value ? 'checked' : ''} />
      </label>
    `;
  }
  const tag = field.type === 'json' ? 'textarea' : 'input';
  const type = field.type === 'number' ? 'number' : 'text';
  return html`
    <label class="ok-field ${full}">
      <span>${field.label}${field.required ? ' *' : ''}</span>
      ${
        tag === 'textarea'
          ? `<textarea class="ok-input ok-json-input" name="${field.name}" ${required}>${escapeHtml(serialized)}</textarea>`
          : `<input class="ok-input" type="${type}" name="${field.name}" value="${escapeHtml(serialized)}" ${required} ${field.min !== undefined ? `min="${field.min}"` : ''} />`
      }
    </label>
  `;
}
