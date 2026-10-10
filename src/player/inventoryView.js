import { ITEM_TYPE_LABELS, equipItem, loadInventory, unequipItem } from '../services/playerInventory.js';
import { emptyBlock, errorBlock, escapeHtml, html, loadingBlock } from '../ui/components.js';
import { rarityBadge, statChips } from './playerUi.js';

function slotMarkup(slot) {
  const entry = slot.entry;
  return html`
    <li class="ok-slot ${entry ? 'is-filled' : ''}">
      <span class="ok-slot__label">${escapeHtml(slot.label)}</span>
      ${
        entry
          ? html`<strong>${escapeHtml(entry.item.name)}</strong>${rarityBadge(entry.item.rarity)}`
          : '<span class="ok-slot__empty">Vazio</span>'
      }
    </li>
  `;
}

function itemMarkup(entry) {
  const { item } = entry;
  const equipped = Boolean(entry.equippedSlot);
  let action;
  if (equipped) {
    action = `<button class="ok-button" type="button" data-action="unequip" data-slot="${escapeHtml(entry.equippedSlot)}">Desequipar</button>`;
  } else if (entry.slot) {
    action = `<button class="ok-button ok-button--primary" type="button" data-action="equip" data-inventory="${escapeHtml(entry.inventoryId)}">Equipar</button>`;
  } else {
    action = '<span class="ok-helper">Não equipável</span>';
  }

  return html`
    <li class="ok-item ${equipped ? 'is-equipped' : ''}" data-inventory="${escapeHtml(entry.inventoryId)}">
      <div class="ok-item__head">
        <strong class="ok-item__name">${escapeHtml(item.name)}</strong>
        ${equipped ? '<span class="ok-badge is-success">Equipado</span>' : ''}
      </div>
      <p class="ok-chip-row">
        <span class="ok-chip">${escapeHtml(ITEM_TYPE_LABELS[item.item_type] || item.item_type)}</span>
        ${rarityBadge(item.rarity)}
        <span class="ok-chip">Qtd. ${entry.quantity}</span>
      </p>
      ${item.description ? `<p class="ok-copy">${escapeHtml(item.description)}</p>` : ''}
      ${statChips(item.stats)}
      <div class="ok-item__action">
        ${action}
        <p class="ok-helper ok-item__feedback" role="status" aria-live="polite"></p>
      </div>
    </li>
  `;
}

export async function renderInventoryView(container, { profile }) {
  container.innerHTML = loadingBlock('Abrindo seu inventário...');
  const result = await loadInventory(profile.id);
  if (!result.ok) {
    container.innerHTML = errorBlock(result.error.message);
    return;
  }

  const { items, slots } = result.data;
  container.innerHTML = html`
    <div class="ok-inventory">
      <section class="ok-panel" aria-labelledby="equipment-title">
        <h2 id="equipment-title" class="ok-section-title">Equipamentos</h2>
        <ul class="ok-slot-list">${slots.map(slotMarkup).join('')}</ul>
      </section>
      <section class="ok-panel" aria-labelledby="items-title">
        <h2 id="items-title" class="ok-section-title">Inventário</h2>
        ${
          items.length
            ? `<ul class="ok-item-list">${items.map(itemMarkup).join('')}</ul>`
            : emptyBlock('Seu inventário está vazio. Itens de missões e combates aparecerão aqui.')
        }
      </section>
    </div>
  `;

  container.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', async () => {
      const card = button.closest('.ok-item');
      const feedback = card.querySelector('.ok-item__feedback');
      const entry = items.find((candidate) => candidate.inventoryId === card.dataset.inventory);
      const equipping = button.dataset.action === 'equip';

      button.disabled = true;
      button.classList.add('is-loading');
      feedback.className = 'ok-helper ok-item__feedback';
      feedback.textContent = equipping ? 'Equipando...' : 'Desequipando...';

      const outcome = equipping
        ? await equipItem(profile.id, entry)
        : await unequipItem(profile.id, button.dataset.slot);

      if (!outcome.ok) {
        button.disabled = false;
        button.classList.remove('is-loading');
        feedback.className = 'ok-helper ok-item__feedback is-error';
        feedback.textContent = outcome.error.message;
        return;
      }

      await renderInventoryView(container, { profile });
      const refreshed = container.querySelector(`[data-inventory="${entry.inventoryId}"] .ok-item__feedback`);
      if (refreshed) {
        refreshed.className = 'ok-helper ok-item__feedback is-success';
        refreshed.textContent = equipping ? 'Item equipado.' : 'Item desequipado.';
      }
    });
  });
}
