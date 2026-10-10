import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRng, parseDice, rollDice } from '../../src/engine/combat/rng.js';

test('mesma semente gera a mesma sequência', () => {
  const a = createRng('abc');
  const b = createRng('abc');
  assert.deepEqual([a.next(), a.next(), a.next()], [b.next(), b.next(), b.next()]);
});

test('retomar pelo cursor continua a sequência', () => {
  const full = createRng('abc');
  const values = [full.next(), full.next(), full.next(), full.next()];
  const resumed = createRng('abc', 2);
  assert.deepEqual([resumed.next(), resumed.next()], values.slice(2));
  assert.equal(resumed.cursor, 4);
});

test('sementes diferentes divergem e valores ficam em [0, 1)', () => {
  const a = createRng('a');
  const b = createRng('b');
  assert.notEqual(a.next(), b.next());
  const rng = createRng('faixa');
  for (let i = 0; i < 500; i += 1) {
    const value = rng.next();
    assert.ok(value >= 0 && value < 1);
  }
});

test('dados respeitam os limites e notação inválida cai em 1d4', () => {
  const rng = createRng('dados');
  for (let i = 0; i < 300; i += 1) {
    const roll = rollDice(rng, '1d10');
    assert.ok(roll >= 1 && roll <= 10);
  }
  assert.deepEqual(parseDice('abc'), { count: 1, sides: 4 });
  assert.deepEqual(parseDice('2d6'), { count: 2, sides: 6 });
});
