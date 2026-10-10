import { listProfiles, loadProfileSupport, unsupportedSupportAction } from '../services/adminSupport.js';
import { confirmDialog, emptyBlock, errorBlock, escapeHtml, html, loadingBlock } from '../ui/components.js';
import { showToast } from '../ui/toast.js';

export async function renderSupportView(target) {
  target.innerHTML = html`
    <section class="ok-panel">
      <div class="ok-band-header">
        <p class="ok-kicker">Suporte</p>
        <h2 class="ok-route-title">Diagnóstico controlado de jogador</h2>
        <p class="ok-helper">Somente leitura por padrão. Ações mutáveis exigem RPC auditada.</p>
      </div>
      <div id="support-body">${loadingBlock()}</div>
    </section>
  `;
  await loadProfiles(target);
}

async function loadProfiles(target) {
  const body = target.querySelector('#support-body');
  const result = await listProfiles();
  if (!result.ok) {
    body.innerHTML = errorBlock(result.error.message);
    return;
  }
  if (!result.data.length) {
    body.innerHTML = emptyBlock('Nenhum perfil encontrado.');
    return;
  }
  body.innerHTML = html`
    <div class="ok-table-wrap">
      <table class="ok-table">
        <thead><tr><th>Personagem</th><th>Nível</th><th>Classe</th><th>Raça</th><th>Estado</th><th>Ações</th></tr></thead>
        <tbody>
          ${result.data
            .map(
              (profile) => html`
                <tr>
                  <td>${escapeHtml(profile.character_name)}</td>
                  <td>${escapeHtml(profile.level)}</td>
                  <td>${escapeHtml(profile.class_id)}</td>
                  <td>${escapeHtml(profile.race_id)}</td>
                  <td>Somente leitura</td>
                  <td><button class="ok-button" data-profile="${profile.id}">Diagnosticar</button></td>
                </tr>
              `,
            )
            .join('')}
        </tbody>
      </table>
    </div>
    <section id="support-detail" class="ok-panel" hidden></section>
  `;
  body.querySelectorAll('[data-profile]').forEach((button) => {
    button.addEventListener('click', () => loadSupportDetail(body, button.dataset.profile));
  });
}

async function loadSupportDetail(body, profileId) {
  const detail = body.querySelector('#support-detail');
  detail.hidden = false;
  detail.innerHTML = loadingBlock('Carregando diagnóstico...');
  const data = await loadProfileSupport(profileId);
  detail.innerHTML = html`
    <div class="ok-band-header">
      <p class="ok-kicker">Somente leitura</p>
      <h3 class="ok-route-title">Perfil ${escapeHtml(profileId)}</h3>
    </div>
    <div class="ok-grid-2">
      ${supportTable('Inventário', data.inventory.data)}
      ${supportTable('Equipamentos', data.equipment.data)}
      ${supportTable('Missões', data.quests.data)}
      ${supportTable('Sessões de combate', data.combat_sessions.data)}
    </div>
    <div class="ok-panel">
      <h3 class="ok-route-title">Eventos de combate recentes</h3>
      ${supportTable('Eventos', data.combat_events.data)}
    </div>
    <div class="ok-panel">
      <p class="ok-kicker">Ações de suporte</p>
      <p class="ok-helper">Ações mutáveis permanecem desativadas até existir RPC específica e auditada.</p>
      <button id="support-action" class="ok-button ok-button--danger">Tentar ação controlada</button>
    </div>
  `;
  detail.querySelector('#support-action').addEventListener('click', async () => {
    const ok = await confirmDialog({
      title: 'Ação mutável bloqueada',
      message: 'Sem RPC auditada específica, o suporte mutável é adiado por segurança.',
      confirmLabel: 'Entendi',
      danger: true,
    });
    if (!ok) return;
    const result = await unsupportedSupportAction();
    showToast(result.error.message, 'error');
  });
}

function supportTable(title, rows = []) {
  if (!rows?.length) return `<div>${emptyBlock(`${title}: nenhum registro.`)}</div>`;
  const columns = Object.keys(rows[0]).slice(0, 5);
  return html`
    <div>
      <h4 class="ok-label">${escapeHtml(title)}</h4>
      <div class="ok-table-wrap">
        <table class="ok-table">
          <thead><tr>${columns.map((column) => `<th>${escapeHtml(column)}</th>`).join('')}</tr></thead>
          <tbody>
            ${rows
              .map(
                (row) => html`
                  <tr>${columns.map((column) => `<td>${escapeHtml(typeof row[column] === 'object' ? JSON.stringify(row[column]) : row[column])}</td>`).join('')}</tr>
                `,
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}
