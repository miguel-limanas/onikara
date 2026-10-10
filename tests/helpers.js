import { readFileSync } from 'node:fs';
import { buildScenario, createCombat } from '../src/engine/combat/index.js';

export const rows = JSON.parse(readFileSync(new URL('./fixtures/rules.mvp.json', import.meta.url), 'utf8'));

export function newCombat(options) {
  const scenario = buildScenario(rows, { seed: 'teste', enemyIds: ['training-dummy'], ...options });
  return createCombat(scenario);
}

export function playerOf(state) {
  return state.participants.find((participant) => participant.team === 'player');
}

export function enemyOf(state, index = 0) {
  return state.participants.filter((participant) => participant.team === 'enemy')[index];
}
