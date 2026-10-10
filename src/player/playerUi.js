import { RARITY_LABELS } from '../services/playerInventory.js';
import { STAT_LABELS } from '../services/playerProfile.js';
import { escapeHtml } from '../ui/components.js';

export function rarityBadge(rarity) {
  const key = RARITY_LABELS[rarity] ? rarity : 'common';
  return `<span class="ok-badge ok-rarity ok-rarity--${key}">${escapeHtml(RARITY_LABELS[key])}</span>`;
}

// Mostra apenas atributos numéricos conhecidos, ex.: "Força +2".
export function statChips(stats = {}) {
  const chips = Object.entries(stats)
    .filter(([key, value]) => STAT_LABELS[key] && Number(value))
    .map(([key, value]) => {
      const number = Number(value);
      return `<span class="ok-chip">${escapeHtml(STAT_LABELS[key])} ${number > 0 ? '+' : ''}${number}</span>`;
    });
  return chips.length ? `<p class="ok-chip-row">${chips.join('')}</p>` : '';
}
