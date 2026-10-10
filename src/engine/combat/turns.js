import { effectiveStat } from './effects.js';
import { isAlive, makeEvent, resolveOutcome } from './state.js';

// Ordem por velocidade efetiva (maior primeiro); empate favorece o jogador e depois a ordem original.
export function computeOrder(state) {
  const playerFirst = state.rules.initiative.tieBreaker === 'player_first';
  return state.participants
    .map((participant, index) => ({ participant, index }))
    .filter(({ participant }) => isAlive(participant))
    .sort((a, b) => {
      const speed = effectiveStat(state, b.participant, 'speed') - effectiveStat(state, a.participant, 'speed');
      if (speed !== 0) return speed;
      if (playerFirst) {
        const team = Number(b.participant.team === 'player') - Number(a.participant.team === 'player');
        if (team !== 0) return team;
      }
      return a.index - b.index;
    })
    .map(({ participant }) => participant.id);
}

// Recarga: ao conjurar vale cooldown_turns + 1; cai 1 no início de cada turno do dono.
// Assim `cooldown_turns = N` bloqueia a magia por N turnos do próprio dono.
export function cooldownValue(cooldownTurns) {
  return cooldownTurns > 0 ? cooldownTurns + 1 : 0;
}

export function cooldownRemaining(state, participantId, spellId) {
  return state.cooldowns[participantId]?.[spellId] || 0;
}

export function beginTurn(state, events) {
  const participant = state.participants.find((item) => item.id === state.order[state.activeIndex]);
  const owned = state.cooldowns[participant.id];
  if (owned) {
    for (const spellId of Object.keys(owned)) {
      owned[spellId] = Math.max(0, owned[spellId] - 1);
      if (owned[spellId] === 0) delete owned[spellId];
    }
  }
  events.push(makeEvent(state, 'turn_start', { actorId: participant.id, payload: { round: state.round, activeId: participant.id } }));
}

// Fecha o turno do ator ativo: regenera mana, avança a ordem e abre o próximo turno.
export function endTurn(state, events) {
  const actor = state.participants.find((item) => item.id === state.order[state.activeIndex]);
  let regen = 0;
  if (isAlive(actor)) {
    regen = Math.min(state.rules.mana.combatPerTurn, actor.stats.maxMana - actor.stats.mana);
    actor.stats.mana += Math.max(0, regen);
  }
  events.push(makeEvent(state, 'turn_end', { actorId: actor.id, payload: { manaRegen: Math.max(0, regen) } }));

  if (resolveOutcome(state)) return;

  let nextIndex = state.activeIndex;
  do {
    nextIndex += 1;
    if (nextIndex >= state.order.length) {
      state.round += 1;
      state.order = computeOrder(state);
      nextIndex = 0;
    }
  } while (!isAlive(state.participants.find((item) => item.id === state.order[nextIndex])));
  state.activeIndex = nextIndex;
  beginTurn(state, events);
}
