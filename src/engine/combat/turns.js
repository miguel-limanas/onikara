import { applyDamage } from './damage.js';
import { effectiveStat, expireStatuses } from './effects.js';
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

function activeOf(state) {
  return state.participants.find((item) => item.id === state.order[state.activeIndex]);
}

// Abre o turno do participante ativo: recargas, fadiga, dano por turno e perda de ação.
// Pode encerrar o turno sozinho (morte por efeito ou ação perdida).
export function beginTurn(state, events, rng) {
  const participant = activeOf(state);
  const owned = state.cooldowns[participant.id];
  if (owned) {
    for (const spellId of Object.keys(owned)) {
      owned[spellId] = Math.max(0, owned[spellId] - 1);
      if (owned[spellId] === 0) delete owned[spellId];
    }
  }
  if (participant.flags.fatiguedTurns > 0) participant.flags.fatiguedTurns -= 1;

  events.push(makeEvent(state, 'turn_start', { actorId: participant.id, payload: { round: state.round, activeId: participant.id } }));

  for (const status of participant.statuses) {
    const perTurn = state.catalog.statusEffects[status.id]?.rules?.damage_per_turn;
    if (!perTurn) continue;
    const amount = perTurn * status.stacks;
    const { dealt, absorbed } = applyDamage(participant, amount);
    events.push(
      makeEvent(state, 'damage', {
        actorId: status.sourceId,
        targetId: participant.id,
        payload: { amount, dealt, absorbed, crit: false, elemental: null, source: 'status', statusId: status.id },
      }),
    );
    if (!isAlive(participant)) {
      events.push(makeEvent(state, 'defeat', { targetId: participant.id, payload: { participantId: participant.id } }));
      break;
    }
  }

  if (!isAlive(participant)) {
    endTurn(state, events, rng);
    return;
  }

  for (const status of participant.statuses) {
    const chance = state.catalog.statusEffects[status.id]?.rules?.skip_action_chance;
    if (chance && rng.chance(chance)) {
      events.push(makeEvent(state, 'system', { actorId: participant.id, payload: { kind: 'status_skipped', statusId: status.id } }));
      endTurn(state, events, rng);
      return;
    }
  }
}

// Fecha o turno do ator ativo: regenera mana, expira efeitos, avança a ordem e abre o próximo turno.
export function endTurn(state, events, rng) {
  const actor = activeOf(state);
  let regen = 0;
  if (isAlive(actor)) {
    regen = Math.max(0, Math.min(state.rules.mana.combatPerTurn, actor.stats.maxMana - actor.stats.mana));
    actor.stats.mana += regen;
    expireStatuses(state, events, actor);
  }
  events.push(makeEvent(state, 'turn_end', { actorId: actor.id, payload: { manaRegen: regen } }));

  if (resolveOutcome(state)) {
    if (state.status !== 'escaped') events.push(makeEvent(state, 'system', { payload: { kind: state.status } }));
    return;
  }

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
  beginTurn(state, events, rng);
}
