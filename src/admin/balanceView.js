import { activateRule, archiveRule, balanceDefinitions, duplicateRule, listBalanceRules, saveRule } from '../services/adminBalanceRules.js';
import { confirmDialog, emptyBlock, errorBlock, escapeHtml, html, loadingBlock, statusBadge } from '../ui/components.js';
import { stringifyJson } from '../ui/jsonEditor.js';
import { showToast } from '../ui/toast.js';

export async function renderBalanceView(target) {
  const table = target.dataset.ruleTable || 'progression_rules';
  target.innerHTML = html`
    <section class="ok-panel">
      <div role="tablist" class="ok-toolbar" aria-label="Dominios de balanceamento">
        ${Object.entries(balanceDefinitions)
          .map(([id, definition]) => `<button class="ok-tab" role="tab" aria-selected="${id === table}" data-rule="${id}">${definition.label}</button>`)
          .join('')}
      </div>
      <div id="balance-body">${loadingBlock()}</div>
    </section>
    <section id="balance-editor" class="ok-panel" hidden></section>
  `;
  target.querySelectorAll('[data-rule]').forEach((button) => {
    button.addEventListener('click', () => {
      target.dataset.ruleTable = button.dataset.rule;
      renderBalanceView(target);
    });
  });
  await loadRules(target, table);
}

async function loadRules(target, table) {
  const body = target.querySelector('#balance-body');
  body.innerHTML = loadingBlock('Carregando regras versionadas...');
  const result = await listBalanceRules(table);
  if (!result.ok) {
    body.innerHTML = errorBlock(result.error.message);
    return;
  }
  body.innerHTML = renderRulesTable(table, result.data);
  body.querySelector('#new-rule').addEventListener('click', () => renderRuleEditor(target, table));
  body.querySelectorAll('[data-edit]').forEach((button) => {
    renderAction(button, () => renderRuleEditor(target, table, result.data.find((rule) => rule.id === button.dataset.edit)));
  });
  body.querySelectorAll('[data-duplicate]').forEach((button) => {
    renderAction(button, async () => {
      const rule = result.data.find((item) => item.id === button.dataset.duplicate);
      const duplicated = await duplicateRule(table, rule);
      if (!duplicated.ok) showToast(duplicated.error.message, 'error');
      else showToast('Draft duplicado.', 'success');
      await loadRules(target, table);
    });
  });
  body.querySelectorAll('[data-activate]').forEach((button) => {
    renderAction(button, async () => {
      const ok = await confirmDialog({
        title: 'Ativar regra',
        message: 'A regra ativa sera consumida pelas views publicas do jogador.',
        confirmLabel: 'Ativar',
      });
      if (!ok) return;
      const activated = await activateRule(table, button.dataset.activate);
      if (!activated.ok) showToast(activated.error.message, 'error');
      else showToast('Regra ativa confirmada na view publica.', 'success');
      await loadRules(target, table);
    });
  });
  body.querySelectorAll('[data-archive]').forEach((button) => {
    renderAction(button, async () => {
      const ok = await confirmDialog({
        title: 'Arquivar regra',
        message: 'Arquivar remove esta versao da regra ativa sem apagar historico sensivel.',
        confirmLabel: 'Arquivar',
        danger: true,
      });
      if (!ok) return;
      const archived = await archiveRule(table, button.dataset.archive);
      if (!archived.ok) showToast(archived.error.message, 'error');
      else showToast('Regra arquivada.', 'success');
      await loadRules(target, table);
    });
  });
}

function renderAction(button, handler) {
  button.addEventListener('click', handler);
}

function renderRulesTable(table, rows) {
  const definition = balanceDefinitions[table];
  return html`
    <div class="ok-band-header">
      <p class="ok-kicker">${definition.label}</p>
      <h2 class="ok-route-title">Regras ${definition.label}</h2>
    </div>
    <button id="new-rule" class="ok-button ok-button--primary">Novo draft</button>
    ${rows.length ? html`
      <div class="ok-table-wrap">
        <table class="ok-table">
          <thead><tr><th>Nome</th><th>Versao</th><th>Status</th><th>Notas</th><th>Acoes</th></tr></thead>
          <tbody>
            ${rows
              .map(
                (rule) => html`
                  <tr>
                    <td>${escapeHtml(rule.name)}</td>
                    <td>${escapeHtml(rule.version)}</td>
                    <td>${statusBadge(rule.status)}</td>
                    <td>${escapeHtml(rule.notes || '-')}</td>
                    <td>
                      <div class="ok-toolbar">
                        <button class="ok-button" data-edit="${rule.id}">Editar</button>
                        <button class="ok-button" data-duplicate="${rule.id}">Duplicar</button>
                        <button class="ok-button" data-activate="${rule.id}">Ativar</button>
                        <button class="ok-button ok-button--danger" data-archive="${rule.id}">Arquivar</button>
                      </div>
                    </td>
                  </tr>
                `,
              )
              .join('')}
          </tbody>
        </table>
      </div>
    ` : emptyBlock('Nenhuma regra cadastrada.')}
  `;
}

function renderRuleEditor(target, table, rule = null) {
  const definition = balanceDefinitions[table];
  const panel = target.querySelector('#balance-editor');
  panel.hidden = false;
  panel.innerHTML = html`
    <div class="ok-band-header">
      <p class="ok-kicker">${rule ? 'Editar' : 'Criar'} regra</p>
      <h2 class="ok-route-title">${definition.label}</h2>
    </div>
    <form id="balance-form" class="ok-form-grid" novalidate>
      <label class="ok-field"><span>Nome *</span><input class="ok-input" name="name" required value="${escapeHtml(rule?.name || '')}" /></label>
      <label class="ok-field"><span>Versao *</span><input class="ok-input" type="number" name="version" min="1" required value="${escapeHtml(rule?.version || 1)}" /></label>
      <label class="ok-field"><span>Status</span><select class="ok-select" name="status"><option>draft</option><option>active</option><option>archived</option></select></label>
      <label class="ok-field ok-field--full"><span>Notas</span><input class="ok-input" name="notes" value="${escapeHtml(rule?.notes || '')}" /></label>
      ${definition.jsonFields
        .map((field) => `<label class="ok-field ok-field--full"><span>${field} JSON *</span><textarea class="ok-input ok-json-input" name="${field}" required>${escapeHtml(stringifyJson(rule?.[field] ?? {}))}</textarea></label>`)
        .join('')}
      <p id="balance-status" class="ok-helper ok-field--full" aria-live="polite"></p>
      <div class="ok-toolbar ok-field--full">
        <button class="ok-button ok-button--primary" type="submit">Salvar</button>
        <button id="balance-cancel" class="ok-button" type="button">Cancelar</button>
      </div>
    </form>
  `;
  panel.querySelector('[name="status"]').value = rule?.status || 'draft';
  panel.querySelector('#balance-cancel').addEventListener('click', () => {
    panel.hidden = true;
    panel.innerHTML = '';
  });
  panel.querySelector('#balance-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const status = panel.querySelector('#balance-status');
    const button = event.currentTarget.querySelector('[type="submit"]');
    button.disabled = true;
    button.classList.add('is-loading');
    try {
      const values = Object.fromEntries(new FormData(event.currentTarget).entries());
      const result = await saveRule(table, values, rule?.id);
      if (!result.ok) throw new Error(result.error.message);
      status.textContent = 'Regra salva.';
      status.className = 'ok-helper is-success ok-field--full';
      showToast('Regra versionada salva.', 'success');
      await loadRules(target, table);
    } catch (error) {
      status.textContent = error.message;
      status.className = 'ok-helper is-error ok-field--full';
    } finally {
      button.disabled = false;
      button.classList.remove('is-loading');
    }
  });
}
