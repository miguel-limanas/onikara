import { STAT_KEYS, STAT_LABELS, loadCharacterCatalogs } from '../services/playerProfile.js';
import { escapeHtml, html } from '../ui/components.js';
import { renderCharacterPortrait } from './characterLook.js';

// Versão inicial (04-01): ficha resumida. O painel completo vem no plano 04-02.
export async function renderDashboardView(container, { profile }) {
  const catalogs = await loadCharacterCatalogs();
  const rpgClass = catalogs.ok ? catalogs.data.classes.find((item) => item.id === profile.class_id) : null;
  const race = catalogs.ok ? catalogs.data.races.find((item) => item.id === profile.race_id) : null;
  const stats = profile.base_stats || {};

  container.innerHTML = html`
    <section class="ok-panel ok-sheet" aria-labelledby="sheet-title">
      <div class="ok-sheet__portrait">${renderCharacterPortrait({ rpgClass, race })}</div>
      <div>
        <p class="ok-kicker">${escapeHtml(rpgClass?.name || profile.class_id)} · ${escapeHtml(race?.name || profile.race_id)}</p>
        <h1 id="sheet-title" class="ok-route-title">${escapeHtml(profile.character_name)}</h1>
        <p class="ok-copy">Nível ${profile.level} · ${profile.xp} XP</p>
        <dl class="ok-stat-grid">
          ${STAT_KEYS.map(
            (key) => html`
              <div class="ok-stat">
                <dt>${STAT_LABELS[key]}</dt>
                <dd>${escapeHtml(stats[key] ?? '-')}</dd>
              </div>
            `,
          ).join('')}
        </dl>
      </div>
    </section>
  `;
}
