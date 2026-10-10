import { escapeHtml } from '../ui/components.js';

// Texto em português dos eventos do motor. Retorna null para eventos que não entram no log.
export function describeEvent(state, event) {
  const nameOf = (id) => state.participants.find((participant) => participant.id === id)?.name || 'Alguém';
  const spellName = (id) => state.catalog.spells[id]?.name || id;
  const statusName = (id) => state.catalog.statusEffects[id]?.name || (id === 'defense_bonus' ? 'Defesa reforçada' : id);
  const actor = nameOf(event.actorId);
  const target = nameOf(event.targetId);
  const p = event.payload || {};

  switch (event.type) {
    case 'turn_start':
      return null;
    case 'turn_end':
      return null;
    case 'basic_attack':
      return { tone: 'action', text: `${actor} ataca ${target} (dado ${p.die}: ${p.roll}).` };
    case 'spell_cast':
      return { tone: 'action', text: `${actor} conjura ${spellName(p.spellId)} (${p.manaCost} de mana).` };
    case 'item_used':
      return { tone: 'action', text: `${actor} usa ${state.catalog.items[p.itemId]?.name || p.itemId}.` };
    case 'damage': {
      const relation =
        p.elemental === 'advantage' ? ' Fraqueza elemental!' : p.elemental === 'disadvantage' ? ' Resistido.' : '';
      const crit = p.crit ? ' Golpe crítico!' : '';
      const source = p.source === 'status' ? ` por ${statusName(p.statusId)}` : '';
      const absorbed = p.absorbed ? ` (${p.absorbed} absorvido pelo escudo)` : '';
      return { tone: 'damage', text: `${target} sofre ${p.amount} de dano${source}${absorbed}.${crit}${relation}` };
    }
    case 'heal': {
      const parts = [];
      if (p.hp) parts.push(`${p.hp} de HP`);
      if (p.mana) parts.push(`${p.mana} de mana`);
      if (p.shield) parts.push(`${p.shield} de escudo`);
      return parts.length ? { tone: 'heal', text: `${target} recupera ${parts.join(' e ')}.` } : null;
    }
    case 'status_applied':
      return { tone: 'status', text: `${target} recebe ${statusName(p.statusId)}.` };
    case 'defeat':
      return { tone: 'defeat', text: `${target} foi derrotado.` };
    case 'system':
      switch (p.kind) {
        case 'status_expired':
          return { tone: 'status', text: `${statusName(p.statusId)} acabou em ${actor}.` };
        case 'status_skipped':
          return { tone: 'status', text: `${actor} perde a ação por ${statusName(p.statusId)}.` };
        case 'cleanse':
          return { tone: 'status', text: `${target} foi purificado.` };
        case 'mana_drain':
          return { tone: 'status', text: `${actor} drena ${p.amount} de mana de ${target}.` };
        case 'fatigue':
          return { tone: 'status', text: `${actor} sente a fadiga do esforço arcano.` };
        case 'pass':
          return { tone: 'action', text: `${actor} aguarda.` };
        case 'flee':
          return { tone: 'action', text: p.success ? `${actor} escapa do combate.` : `${actor} tenta fugir, mas não consegue.` };
        case 'victory':
          return { tone: 'victory', text: 'Vitória!' };
        case 'defeat':
          return { tone: 'defeat', text: 'Derrota.' };
        default:
          return null;
      }
    default:
      return null;
  }
}

export function logMarkup(state, events) {
  return events
    .map((event) => describeEvent(state, event))
    .filter(Boolean)
    .map((entry) => `<li class="ok-combat-log__entry is-${entry.tone}">${escapeHtml(entry.text)}</li>`)
    .join('');
}
