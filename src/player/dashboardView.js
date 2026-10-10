import { STAT_KEYS, STAT_LABELS, loadCharacterCatalogs } from '../services/playerProfile.js';
import { loadActiveEffects, loadProgressionContext, normalizeCharacter } from '../services/playerProgression.js';
import { loadOwnProfile } from '../services/playerProfile.js';
import { attemptMedicine, recoverRest } from '../services/playerRecovery.js';
import { errorBlock, escapeHtml, html, loadingBlock } from '../ui/components.js';
import { renderCharacterPortrait } from './characterLook.js';

function meter({ label, current, max, percent, modifier = '', hint = '' }) {
  return html`
    <div class="ok-stat-bar ${modifier}">
      <div class="ok-stat-bar__label">
        <span>${escapeHtml(label)}</span>
        <span>${current} / ${max}</span>
      </div>
      <div
        class="ok-stat-bar__track"
        role="progressbar"
        aria-label="${escapeHtml(label)}"
        aria-valuemin="0"
        aria-valuemax="${max}"
        aria-valuenow="${current}"
      >
        <span class="ok-stat-bar__fill" style="--value: ${percent}%"></span>
      </div>
      ${hint ? `<p class="ok-helper">${escapeHtml(hint)}</p>` : ''}
    </div>
  `;
}

function effectsBlock(effects) {
  if (!effects.length) {
    return '<p class="ok-copy">Nenhum efeito ativo no momento. Seu personagem está em condição estável.</p>';
  }
  return `<ul class="ok-effect-list">${effects
    .map(
      (effect) =>
        `<li><span class="ok-badge">${escapeHtml(effect.name)}</span> <span class="ok-helper">${effect.remainingTurns} turno(s)${
          effect.stacks > 1 ? ` · x${effect.stacks}` : ''
        }</span></li>`,
    )
    .join('')}</ul>`;
}

function shortcut(section, title, text) {
  return html`
    <a class="ok-shortcut" href="#${section}">
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(text)}</span>
    </a>
  `;
}

export async function renderDashboardView(container, { profile, notice = '' }) {
  container.innerHTML = loadingBlock('Carregando seu personagem...');

  // Regeneração pelo tempo (servidor) e perfil atualizado antes de desenhar.
  await recoverRest();
  const refreshed = await loadOwnProfile(profile.user_id);
  if (refreshed.ok && refreshed.data) Object.assign(profile, refreshed.data);

  const catalogs = await loadCharacterCatalogs();
  if (!catalogs.ok) {
    container.innerHTML = errorBlock(catalogs.error.message);
    return;
  }

  const progression = await loadProgressionContext();
  const effects = await loadActiveEffects(profile.id, progression.statusEffects);
  const character = normalizeCharacter(profile, {
    rpgClass: catalogs.data.classes.find((item) => item.id === profile.class_id),
    race: catalogs.data.races.find((item) => item.id === profile.race_id),
    xpCurve: progression.xpCurve,
    effects,
  });

  const xpHint = character.xp.atMaxLevel
    ? 'Nível máximo alcançado.'
    : character.xp.current === 0
      ? `Derrote inimigos e conclua missões para ganhar XP. Faltam ${character.xp.remaining} para o nível ${character.level + 1}.`
      : `Faltam ${character.xp.remaining} XP para o nível ${character.level + 1}.`;

  container.innerHTML = html`
    <div class="ok-dashboard">
      <section class="ok-panel ok-hero-sheet" aria-labelledby="sheet-title">
        <div class="ok-hero-sheet__portrait">
          ${renderCharacterPortrait({ rpgClass: character.rpgClass, race: character.race })}
        </div>
        <div class="ok-hero-sheet__body">
          <p class="ok-kicker">
            ${escapeHtml(character.rpgClass?.name || profile.class_id)} · ${escapeHtml(character.race?.name || profile.race_id)}
          </p>
          <h1 id="sheet-title" class="ok-route-title">${escapeHtml(character.name)}</h1>
          <div class="ok-hero-sheet__meters">
            ${meter({ label: 'HP', ...character.hp })}
            ${meter({ label: 'Mana', ...character.mana, modifier: 'ok-stat-bar--mana' })}
            ${meter({
              label: `XP · Nível ${character.level}`,
              current: character.xp.current,
              max: character.xp.needed,
              percent: character.xp.percent,
              modifier: 'ok-stat-bar--xp',
              hint: xpHint,
            })}
          </div>
        </div>
        <div class="ok-level-badge" aria-label="Nível ${character.level}">
          <small>Nível</small>
          <strong>${character.level}</strong>
        </div>
      </section>

      <section class="ok-panel" aria-labelledby="stats-title">
        <h2 id="stats-title" class="ok-section-title">Atributos</h2>
        <dl class="ok-stat-grid">
          ${STAT_KEYS.map(
            (key) => html`
              <div class="ok-stat">
                <dt>${STAT_LABELS[key]}</dt>
                <dd>${character.stats[key]}</dd>
              </div>
            `,
          ).join('')}
        </dl>
      </section>

      <section class="ok-panel" aria-labelledby="state-title">
        <h2 id="state-title" class="ok-section-title">Estado atual</h2>
        ${effectsBlock(character.effects)}
        <p class="ok-helper">
          A mana é seu recurso tático: ela recupera com o descanso e é gasta a cada magia em combate.
          O HP volta devagar com os dias; poções e cuidados médicos aceleram a recuperação.
        </p>
        <div class="ok-toolbar">
          <button class="ok-button" type="button" data-medicine>Cuidar dos ferimentos (medicina)</button>
        </div>
        <p class="ok-helper ${notice ? 'is-success' : ''}" role="status" aria-live="polite" data-recovery-feedback>${escapeHtml(notice)}</p>
      </section>

      <nav class="ok-shortcuts" aria-label="Atalhos do personagem">
        ${shortcut('inventario', 'Inventário', 'Itens, equipamentos e consumíveis')}
        ${shortcut('magias', 'Magias', 'Seu grimório por nível e elemento')}
        ${shortcut('missoes', 'Missões', 'Objetivos disponíveis e progresso')}
      </nav>
    </div>
  `;

  const medicine = container.querySelector('[data-medicine]');
  medicine.addEventListener('click', async () => {
    const feedback = container.querySelector('[data-recovery-feedback]');
    medicine.disabled = true;
    feedback.className = 'ok-helper';
    feedback.textContent = 'Rolando o teste de medicina...';
    const outcome = await attemptMedicine();
    if (!outcome.ok) {
      medicine.disabled = false;
      feedback.className = 'ok-helper is-error';
      feedback.textContent = outcome.error.message;
      return;
    }
    const r = outcome.data;
    const text = `d20: ${r.roll} ${r.modifier >= 0 ? '+' : '-'} ${Math.abs(r.modifier)} = ${r.total} contra DT ${r.dt}. ${
      r.success ? (r.healed > 0 ? `Sucesso: recuperou ${r.healed} de HP.` : 'Sucesso, mas você já estava com o HP cheio.') : 'Não foi dessa vez.'
    }`;
    await renderDashboardView(container, { profile, notice: text });
  });
}
