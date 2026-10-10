import assert from 'node:assert/strict';
import { test } from 'node:test';
import { applyAction, chooseEnemyAction, listActions } from '../../src/engine/combat/index.js';
import { newCombat } from '../helpers.js';

function bestPlayerAction(state, actorId) {
  const actions = listActions(state, actorId).filter((a) => !a.disabled && a.targets.length);
  const damaging = actions
    .filter((a) => a.type === 'spell' && a.power > 0)
    .sort((a, b) => b.power - a.power)[0];
  const pick = damaging || actions.find((a) => a.type === 'basic_attack');
  return { type: pick.type, actorId, spellId: pick.spellId, targetId: pick.targets[0] };
}

function play(options, seed) {
  const { state, events } = newCombat({ ...options, seed });
  let current = state;
  const log = [...events];
  let steps = 0;
  while (current.status === 'active' && steps < 400) {
    const actorId = current.order[current.activeIndex];
    const actor = current.participants.find((p) => p.id === actorId);
    const action = actor.team === 'player' ? bestPlayerAction(current, actorId) : chooseEnemyAction(current, actorId);
    const step = applyAction(current, action);
    log.push(...step.events);
    current = step.state;
    steps += 1;
    for (const p of current.participants) {
      assert.ok(p.stats.hp >= 0, 'HP negativo');
      assert.ok(p.stats.mana >= 0, 'mana negativa');
      assert.ok(p.stats.hp <= p.stats.maxHp, 'HP acima do máximo');
      assert.ok(p.stats.mana <= p.stats.maxMana, 'mana acima do máximo');
    }
    for (const owned of Object.values(current.cooldowns)) {
      for (const value of Object.values(owned)) assert.ok(value > 0);
    }
  }
  return { state: current, log, steps };
}

for (const classId of ['warrior', 'mage']) {
  for (const enemyId of ['training-dummy', 'ash-imp']) {
    test(`200 combates: ${classId} contra ${enemyId} respeitam as invariantes`, () => {
      for (let i = 0; i < 200; i += 1) {
        const { state, steps } = play({ classId, enemyIds: [enemyId], level: 3 }, `sim-${i}`);
        assert.notEqual(state.status, 'active', 'combate não terminou');
        assert.ok(steps < 400);
        assert.ok(state.round <= 60);
      }
    });
  }
}

test('mesma semente produz o mesmo log completo', () => {
  const a = play({ classId: 'mage', enemyIds: ['ash-imp'], level: 3 }, 'repete');
  const b = play({ classId: 'mage', enemyIds: ['ash-imp'], level: 3 }, 'repete');
  assert.equal(JSON.stringify(a.log), JSON.stringify(b.log));
});
