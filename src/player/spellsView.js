import { loadSpellbook, setSpellEquipped } from '../services/playerSpells.js';
import { emptyBlock, errorBlock, escapeHtml, html, loadingBlock } from '../ui/components.js';
import { rarityBadge } from './playerUi.js';

const STATE_LABELS = {
  locked: 'Bloqueada',
  unlocked: 'Disponível',
  equipped: 'Equipada',
};

function spellMarkup(entry) {
  const { spell, state, unlockLevel } = entry;
  const element = spell.element?.name || spell.element_id;
  let action = '';
  if (state === 'unlocked') {
    action = `<button class="ok-button ok-button--primary" type="button" data-action="equip" data-spell="${escapeHtml(spell.id)}">Equipar</button>`;
  } else if (state === 'equipped') {
    action = `<button class="ok-button" type="button" data-action="unequip" data-spell="${escapeHtml(spell.id)}">Desequipar</button>`;
  }

  return html`
    <li class="ok-spell is-${state}" data-element="${escapeHtml(spell.element_id)}" data-spell="${escapeHtml(spell.id)}">
      <div class="ok-item__head">
        <strong class="ok-item__name">${escapeHtml(spell.name)}</strong>
        <span class="ok-badge ${state === 'equipped' ? 'is-success' : ''}">${STATE_LABELS[state]}</span>
      </div>
      <p class="ok-chip-row">
        <span class="ok-chip ok-chip--element">${escapeHtml(element)}</span>
        ${rarityBadge(spell.rarity)}
      </p>
      ${
        state === 'locked'
          ? `<p class="ok-copy">Requer nível ${unlockLevel}.</p>`
          : `<p class="ok-copy">Custo ${spell.mana_cost} de mana · Recarga ${spell.cooldown_turns} turno(s) · Poder ${spell.power}</p>`
      }
      <div class="ok-item__action">
        ${action}
        <p class="ok-helper ok-item__feedback" role="status" aria-live="polite"></p>
      </div>
    </li>
  `;
}

export async function renderSpellsView(container, { profile }) {
  container.innerHTML = loadingBlock('Abrindo seu grimório...');
  const result = await loadSpellbook(profile);
  if (!result.ok) {
    container.innerHTML = errorBlock(result.error.message);
    return;
  }

  const { spells, usedSlots } = result.data;
  const next = spells.find((entry) => entry.state === 'locked');
  const equippedCount = spells.filter((entry) => entry.state === 'equipped').length;

  container.innerHTML = html`
    <section class="ok-panel" aria-labelledby="spells-title">
      <h2 id="spells-title" class="ok-section-title">Magias</h2>
      ${
        spells.length
          ? html`
              <p class="ok-copy">
                ${equippedCount} equipada(s).
                ${next ? `Próxima magia: ${escapeHtml(next.spell.name)}, no nível ${next.unlockLevel}.` : 'Todas as magias da sua classe estão desbloqueadas.'}
              </p>
              <ul class="ok-spell-list">${spells.map(spellMarkup).join('')}</ul>
            `
          : emptyBlock('Sua classe ainda não tem magias publicadas.')
      }
    </section>
  `;

  container.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', async () => {
      const card = button.closest('.ok-spell');
      const feedback = card.querySelector('.ok-item__feedback');
      const equipping = button.dataset.action === 'equip';
      const spellId = button.dataset.spell;

      button.disabled = true;
      button.classList.add('is-loading');
      feedback.className = 'ok-helper ok-item__feedback';
      feedback.textContent = equipping ? 'Equipando...' : 'Desequipando...';

      const outcome = await setSpellEquipped(profile, spellId, equipping, usedSlots);
      if (!outcome.ok) {
        button.disabled = false;
        button.classList.remove('is-loading');
        feedback.className = 'ok-helper ok-item__feedback is-error';
        feedback.textContent = outcome.error.message;
        return;
      }

      await renderSpellsView(container, { profile });
      const refreshed = container.querySelector(`[data-spell="${spellId}"] .ok-item__feedback`);
      if (refreshed) {
        refreshed.className = 'ok-helper ok-item__feedback is-success';
        refreshed.textContent = equipping ? 'Magia equipada.' : 'Magia desequipada.';
      }
    });
  });
}
