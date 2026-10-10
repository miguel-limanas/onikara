import assert from 'node:assert/strict';
import { test } from 'node:test';
import { evaluateFormula, normalizeRules, parseFormula } from '../../src/engine/combat/rules.js';
import { rows } from '../helpers.js';

test('fórmulas do seed são interpretadas', () => {
  const terms = parseFormula('strength + power - defense');
  assert.equal(evaluateFormula(terms, { strength: 16, power: 20, defense: 4 }), 32);
});

test('fórmula com token desconhecido ou código é rejeitada', () => {
  assert.equal(parseFormula('strength + process.exit()'), null);
  assert.equal(parseFormula('luck + power'), null);
  assert.equal(parseFormula('strength +'), null);
});

test('regras do seed viram regras do motor', () => {
  const rules = normalizeRules({ combat: rows.combatRules, mana: rows.manaRules });
  assert.equal(rules.mitigation.advantage, 1.5);
  assert.equal(rules.mitigation.disadvantage, 0.75);
  assert.equal(rules.mana.combatPerTurn, 5);
  assert.equal(rules.critical.baseChance, 0.05);
  assert.deepEqual(rules.warnings, []);
});

test('fórmula inválida cai no padrão com aviso', () => {
  const rules = normalizeRules({ combat: { damage_formula: { physical: 'x * y' } } });
  assert.equal(rules.damage.physical, 'strength + power - defense');
  assert.equal(rules.warnings.length, 1);
});
