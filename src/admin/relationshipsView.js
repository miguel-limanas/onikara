import {
  deleteClassSpell,
  deleteEnemySpell,
  deleteQuestStep,
  listClassSpells,
  listEnemySpells,
  listQuestSteps,
  saveClassSpell,
  saveEnemySpell,
  saveQuestStep,
} from '../services/adminRelationships.js';
import { confirmDialog, emptyBlock, errorBlock, escapeHtml, html, loadingBlock } from '../ui/components.js';
import { showToast } from '../ui/toast.js';

export async function renderRelationshipsView(target) {
  target.innerHTML = html`
    <section class="ok-panel">
      <div class="ok-band-header">
        <p class="ok-kicker">Relacionamentos</p>
        <h2 class="ok-route-title">Vinculos de gameplay</h2>
      </div>
      <div class="ok-grid">
        <button class="ok-button ok-button--primary" data-rel="class">Classe-Magia</button>
        <button class="ok-button" data-rel="enemy">Inimigo-Magia</button>
        <button class="ok-button" data-rel="quest">Etapas de Missao</button>
      </div>
      <div id="relationship-body">${loadingBlock()}</div>
    </section>
  `;
  target.querySelectorAll('[data-rel]').forEach((button) => {
    button.addEventListener('click', () => loadRelationship(target, button.dataset.rel));
  });
  await loadRelationship(target, 'class');
}

async function loadRelationship(target, type) {
  const body = target.querySelector('#relationship-body');
  body.innerHTML = loadingBlock('Carregando vinculos...');
  const loaders = {
    class: listClassSpells,
    enemy: listEnemySpells,
    quest: listQuestSteps,
  };
  const result = await loaders[type]();
  if (!result.ok) {
    body.innerHTML = errorBlock(result.error.message);
    return;
  }
  body.innerHTML = renderRelationshipTable(type, result.data);
  bindRelationshipForm(body, type);
}

function renderRelationshipTable(type, rows) {
  const labels = {
    class: ['class_id', 'spell_id', 'unlock_level'],
    enemy: ['enemy_id', 'spell_id', 'weight'],
    quest: ['quest_id', 'step_order', 'objective_type', 'target_ref', 'target_count'],
  };
  return html`
    ${rows.length ? html`
      <div class="ok-table-wrap">
        <table class="ok-table">
          <thead><tr>${labels[type].map((label) => `<th>${label}</th>`).join('')}<th>Acoes</th></tr></thead>
          <tbody>
            ${rows
              .map(
                (row) => html`
                  <tr>
                    ${labels[type].map((label) => `<td>${escapeHtml(row[label])}</td>`).join('')}
                    <td><button class="ok-button ok-button--danger" data-remove='${escapeHtml(JSON.stringify(row))}'>Remover</button></td>
                  </tr>
                `,
              )
              .join('')}
          </tbody>
        </table>
      </div>
    ` : emptyBlock('Nenhum vinculo registrado.')}
    <form id="relationship-form" class="ok-form-grid" novalidate>
      ${relationshipFields(type)}
      <p id="relationship-status" class="ok-helper ok-field--full" aria-live="polite"></p>
      <button class="ok-button ok-button--primary ok-field--full" type="submit">Salvar vinculo</button>
    </form>
  `;
}

function relationshipFields(type) {
  if (type === 'class') {
    return `
      <label class="ok-field"><span>class_id *</span><input class="ok-input" name="class_id" required /></label>
      <label class="ok-field"><span>spell_id *</span><input class="ok-input" name="spell_id" required /></label>
      <label class="ok-field"><span>unlock_level *</span><input class="ok-input" name="unlock_level" type="number" min="1" value="1" required /></label>
    `;
  }
  if (type === 'enemy') {
    return `
      <label class="ok-field"><span>enemy_id *</span><input class="ok-input" name="enemy_id" required /></label>
      <label class="ok-field"><span>spell_id *</span><input class="ok-input" name="spell_id" required /></label>
      <label class="ok-field"><span>weight *</span><input class="ok-input" name="weight" type="number" min="1" value="1" required /></label>
    `;
  }
  return `
    <label class="ok-field"><span>id *</span><input class="ok-input" name="id" required /></label>
    <label class="ok-field"><span>quest_id *</span><input class="ok-input" name="quest_id" required /></label>
    <label class="ok-field"><span>step_order *</span><input class="ok-input" name="step_order" type="number" min="1" value="1" required /></label>
    <label class="ok-field"><span>objective_type *</span><select class="ok-select" name="objective_type"><option>dialogue</option><option>defeat_enemy</option><option>collect_item</option><option>reach_level</option><option>custom</option></select></label>
    <label class="ok-field"><span>target_ref</span><input class="ok-input" name="target_ref" /></label>
    <label class="ok-field"><span>target_count</span><input class="ok-input" name="target_count" type="number" min="1" value="1" /></label>
    <label class="ok-field ok-field--full"><span>metadata JSON</span><textarea class="ok-input ok-json-input" name="metadata">{}</textarea></label>
  `;
}

function bindRelationshipForm(body, type) {
  body.querySelector('#relationship-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    const status = body.querySelector('#relationship-status');
    try {
      const result =
        type === 'class'
          ? await saveClassSpell(values)
          : type === 'enemy'
            ? await saveEnemySpell(values)
            : await saveQuestStep(values);
      if (!result.ok) throw new Error(result.error.message);
      status.textContent = 'Vinculo salvo e auditado.';
      status.className = 'ok-helper is-success ok-field--full';
      showToast('Vinculo salvo.', 'success');
    } catch (error) {
      status.textContent = error.message;
      status.className = 'ok-helper is-error ok-field--full';
    }
  });
  body.querySelectorAll('[data-remove]').forEach((button) => {
    button.addEventListener('click', async () => {
      const row = JSON.parse(button.dataset.remove);
      const ok = await confirmDialog({
        title: 'Remover vinculo',
        message: 'Esta alteracao sera auditada e pode afetar desbloqueios ou encontros.',
        confirmLabel: 'Remover',
        danger: true,
      });
      if (!ok) return;
      const result =
        type === 'class'
          ? await deleteClassSpell(row)
          : type === 'enemy'
            ? await deleteEnemySpell(row)
            : await deleteQuestStep(row);
      if (!result.ok) showToast(result.error.message, 'error');
      else showToast('Vinculo removido.', 'success');
    });
  });
}
