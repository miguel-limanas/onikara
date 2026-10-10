import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  applyAction,
  chooseEnemyAction,
  listActions,
  runUntilPlayerTurn,
} from '../../src/engine/combat/index.js';
import { enemyOf, newCombat, playerOf } from '../helpers.js';

const potions = [
  { itemId: 'health-salve', quantity: 2 },
  { itemId: 'mana-tonic', quantity: 1 },
];

test('consumível restaura sem passar do máximo e respeita a quantidade', () => {
  const { state } = newCombat({ classId: 'warrior', items: potions });
  playerOf(state).stats.hp = 100;
  playerOf(state).stats.mana = 10;
  const step = applyAction(state, { type: 'item', actorId: 'player-1', itemId: 'health-salve' });
  assert.equal(playerOf(step.state).stats.hp, 120);
  assert.equal(playerOf(step.state).items.find((i) => i.itemId === 'health-salve').quantity, 1);
  assert.ok(step.events.some((e) => e.type === 'item_used'));

  const tonic = applyAction(state, { type: 'item', actorId: 'player-1', itemId: 'mana-tonic' });
  assert.equal(playerOf(tonic.state).stats.mana, 35);
  assert.equal(playerOf(tonic.state).items.some((i) => i.itemId === 'mana-tonic'), false);
});

test('item sem quantidade ou inexistente é recusado', () => {
  const { state } = newCombat({ classId: 'warrior', items: [] });
  assert.throws(
    () => applyAction(state, { type: 'item', actorId: 'player-1', itemId: 'health-salve' }),
    (error) => error.code === 'item_unavailable',
  );
});

test('fuga é reproduzível e, com sucesso, encerra como escaped', () => {
  const outcomes = new Set();
  for (let i = 0; i < 30; i += 1) {
    const { state } = newCombat({ classId: 'warrior', seed: `fuga-${i}`, enemyIds: ['ash-imp'] });
    let current = state;
    if (current.order[current.activeIndex] !== 'player-1') {
      current = applyAction(current, { type: 'pass', actorId: current.order[current.activeIndex] }).state;
    }
    const a = applyAction(current, { type: 'flee', actorId: 'player-1' });
    const b = applyAction(current, { type: 'flee', actorId: 'player-1' });
    assert.equal(a.state.status, b.state.status);
    outcomes.add(a.state.status);
  }
  assert.ok(outcomes.has('escaped'));
});

test('IA: boneco passa o turno e Imp usa magia quando tem mana', () => {
  const { state } = newCombat({ classId: 'warrior', enemyIds: ['training-dummy', 'ash-imp'] });
  const dummy = chooseEnemyAction(state, 'enemy-1');
  assert.equal(dummy.type, 'pass');
  const imp = chooseEnemyAction(state, 'enemy-2');
  assert.equal(imp.type, 'spell');
  assert.equal(imp.targetId, 'player-1');
});

test('IA: sem mana cai em outra magia ou no ataque básico', () => {
  const { state } = newCombat({ classId: 'warrior', enemyIds: ['ash-imp'] });
  enemyOf(state).stats.mana = 0;
  const action = chooseEnemyAction(state, 'enemy-1');
  assert.equal(action.type, 'basic_attack');
  enemyOf(state).stats.mana = 6;
  const cheap = chooseEnemyAction(state, 'enemy-1');
  assert.equal(cheap.spellId, 'focused-slash');
});

test('IA: sugerir ação não altera o estado nem o cursor', () => {
  const { state } = newCombat({ classId: 'warrior', enemyIds: ['ash-imp'] });
  const before = JSON.stringify(state);
  chooseEnemyAction(state, 'enemy-1');
  assert.equal(JSON.stringify(state), before);
});

test('runUntilPlayerTurn executa inimigos e termina mesmo com todos passivos', () => {
  const { state } = newCombat({ classId: 'warrior', enemyIds: ['ash-imp', 'training-dummy'] });
  const result = runUntilPlayerTurn(state);
  assert.equal(result.state.order[result.state.activeIndex], 'player-1');
  assert.ok(result.events.some((e) => e.type === 'spell_cast' || e.type === 'basic_attack'));

  const passive = newCombat({ classId: 'warrior', enemyIds: ['training-dummy'] }).state;
  assert.doesNotThrow(() => runUntilPlayerTurn(passive));
});

test('listActions inclui itens e fuga para o jogador', () => {
  const { state } = newCombat({ classId: 'warrior', items: potions });
  const types = listActions(state, 'player-1').map((a) => a.type);
  assert.ok(types.includes('item'));
  assert.ok(types.includes('flee'));
});
