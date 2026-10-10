import { applyAction, listActions } from './actions.js';
import { elementalRelation } from './damage.js';
import { createRng } from './rng.js';
import { aliveOf, findParticipant, getActiveParticipant } from './state.js';

// A IA usa um sorteio derivado (não consome o cursor do combate), então sugerir uma ação não altera o estado.
export function chooseEnemyAction(state, actorId) {
  const actor = findParticipant(state, actorId);
  const pass = { type: 'pass', actorId };
  if (!actor || actor.behavior.strategy === 'passive') return pass;

  const rng = createRng(`${state.seed}:ai:${state.round}:${actorId}`);
  const opponents = aliveOf(state, actor.team === 'enemy' ? 'player' : 'enemy');
  if (!opponents.length) return pass;
  const target = [...opponents].sort((a, b) => a.stats.hp - b.stats.hp)[0];

  const candidates = listActions(state, actorId)
    .filter((action) => action.type === 'spell' && !action.disabled && action.power > 0)
    .map((action) => {
      let weight = actor.spellWeights[action.spellId] ?? 1;
      if (elementalRelation(state, action.elementId, target.elementId) === 'advantage') weight *= 1.5;
      if (actor.behavior.preferredElement && action.elementId === actor.behavior.preferredElement) weight *= 1.25;
      return { action, weight };
    });

  const picked = rng.pickWeighted(candidates, (entry) => entry.weight);
  if (picked) {
    return { type: 'spell', actorId, spellId: picked.action.spellId, targetId: target.id };
  }
  return { type: 'basic_attack', actorId, targetId: target.id };
}

// Executa os turnos de inimigos até chegar a vez de um jogador ou o fim do combate.
export function runUntilPlayerTurn(state, { maxSteps = 200 } = {}) {
  let current = state;
  const events = [];
  let steps = 0;
  while (current.status === 'active' && steps < maxSteps) {
    const active = getActiveParticipant(current);
    if (active.team === 'player') break;
    const step = applyAction(current, chooseEnemyAction(current, active.id));
    current = step.state;
    events.push(...step.events);
    steps += 1;
  }
  return { state: current, events };
}
