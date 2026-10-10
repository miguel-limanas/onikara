import assert from 'node:assert/strict';
import { test } from 'node:test';
import { applyAction } from '../../src/engine/combat/index.js';
import { enemyOf, newCombat, playerOf } from '../helpers.js';

test('ordem por velocidade (Imp 11, Guerreiro 8, boneco 1)', () => {
  const { state } = newCombat({ classId: 'warrior', enemyIds: ['ash-imp', 'training-dummy'] });
  assert.deepEqual(state.order, ['enemy-1', 'player-1', 'enemy-2']);
});

test('empate de velocidade favorece o jogador', () => {
  const { state } = newCombat({ classId: 'warrior', level: 4, enemyIds: ['ash-imp'] });
  // Guerreiro nível 4 tem velocidade 11, igual ao Imp.
  assert.equal(playerOf(state).stats.speed, 11);
  assert.deepEqual(state.order, ['player-1', 'enemy-1']);
});

test('regenera mana no fim do turno sem passar do máximo', () => {
  const { state } = newCombat({ classId: 'mage' });
  const player = playerOf(state);
  player.stats.mana = 50;
  const result = applyAction(state, { type: 'pass', actorId: player.id });
  assert.equal(playerOf(result.state).stats.mana, 55);

  const full = newCombat({ classId: 'mage' }).state;
  const after = applyAction(full, { type: 'pass', actorId: playerOf(full).id });
  assert.equal(playerOf(after.state).stats.mana, playerOf(after.state).stats.maxMana);
});

test('participante derrotado é pulado na ordem', () => {
  const { state } = newCombat({ classId: 'warrior', enemyIds: ['training-dummy', 'training-dummy'] });
  enemyOf(state, 0).stats.hp = 0;
  const step = applyAction(state, { type: 'pass', actorId: 'player-1' });
  assert.notEqual(step.state.order[step.state.activeIndex], 'enemy-1');
});

test('turn_start e turn_end são emitidos', () => {
  const { state, events } = newCombat({ classId: 'warrior' });
  assert.equal(events[0].type, 'turn_start');
  const step = applyAction(state, { type: 'pass', actorId: 'player-1' });
  assert.ok(step.events.some((event) => event.type === 'turn_end'));
});

test('ação fora da vez é recusada e o estado original não muda', () => {
  const { state } = newCombat({ classId: 'warrior', enemyIds: ['ash-imp'] });
  const before = JSON.stringify(state);
  assert.throws(
    () => applyAction(state, { type: 'pass', actorId: 'player-1' }),
    (error) => error.code === 'not_active_turn',
  );
  assert.equal(JSON.stringify(state), before);
});
