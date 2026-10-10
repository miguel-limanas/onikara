import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { rows } from '../helpers.js';

// Garante que a fixture espelha o seed nos valores que o motor consome.
const seed = readFileSync(new URL('../../supabase/seed.sql', import.meta.url), 'utf8');

function jsonAfter(pattern) {
  const match = pattern.exec(seed);
  assert.ok(match, `trecho do seed não encontrado: ${pattern}`);
  return JSON.parse(match[1]);
}

test('regras de combate e mana', () => {
  const mitigation = jsonAfter(/'(\{"defense_multiplier": 1.0[^']*\})'::jsonb/);
  assert.deepEqual(mitigation, rows.combatRules.mitigation_rules);
  const critical = jsonAfter(/'(\{"base_chance"[^']*\})'::jsonb/);
  assert.deepEqual(critical, rows.combatRules.critical_rules);
  const damage = jsonAfter(/'(\{"physical"[^']*\})'::jsonb/);
  assert.deepEqual(damage, rows.combatRules.damage_formula);
  const regeneration = jsonAfter(/'(\{"combat_per_turn"[^']*\})'::jsonb/);
  assert.deepEqual(regeneration, rows.manaRules.regeneration);
  const fatigue = jsonAfter(/'(\{"legendary_cost_threshold"[^']*\})'::jsonb/);
  assert.deepEqual(fatigue, rows.manaRules.fatigue);
});

test('classes', () => {
  for (const rpgClass of rows.classes) {
    const pattern = new RegExp(`'${rpgClass.id}',\\s*'[^']*',\\s*'[^']*',\\s*'(\\{[^']*\\})'::jsonb,\\s*'(\\{[^']*\\})'::jsonb`);
    const match = pattern.exec(seed);
    assert.ok(match, `classe ${rpgClass.id} ausente no seed`);
    assert.deepEqual(JSON.parse(match[1]), rpgClass.base_stats);
    assert.deepEqual(JSON.parse(match[2]), rpgClass.scaling);
  }
});

test('magias', () => {
  for (const spell of rows.spells) {
    const pattern = new RegExp(`\\('${spell.id}', '[^']*', '(\\w+)', '(\\w+)', (\\d+), (\\d+), (\\d+), '(\\{[^']*\\})'::jsonb\\)`);
    const match = pattern.exec(seed);
    assert.ok(match, `magia ${spell.id} ausente no seed`);
    assert.equal(match[1], spell.element_id);
    assert.equal(Number(match[3]), spell.mana_cost);
    assert.equal(Number(match[4]), spell.cooldown_turns);
    assert.equal(Number(match[5]), spell.power);
    assert.deepEqual(JSON.parse(match[6]), spell.effects);
  }
});

test('inimigos', () => {
  for (const enemy of rows.enemies) {
    const pattern = new RegExp(`'${enemy.id}',\\s*'[^']*',\\s*'[^']*',\\s*(\\d+),\\s*'(\\w+)',\\s*'(\\{[^']*\\})'::jsonb,\\s*'(\\{[^']*\\})'::jsonb`);
    const match = pattern.exec(seed);
    assert.ok(match, `inimigo ${enemy.id} ausente no seed`);
    assert.equal(Number(match[1]), enemy.level);
    assert.equal(match[2], enemy.element_id);
    assert.deepEqual(JSON.parse(match[3]), enemy.base_stats);
    assert.deepEqual(JSON.parse(match[4]), enemy.behavior);
  }
});

test('elementos', () => {
  for (const element of rows.elements) {
    const pattern = new RegExp(`\\('${element.id}', '[^']*', array\\[([^\\]]*)\\](?:::text\\[\\])?, array\\[([^\\]]*)\\]`);
    const match = pattern.exec(seed);
    assert.ok(match, `elemento ${element.id} ausente no seed`);
    const parse = (text) => text.split(',').map((item) => item.trim().replace(/'/g, '')).filter(Boolean);
    assert.deepEqual(parse(match[1]), element.strong_against);
    assert.deepEqual(parse(match[2]), element.weak_against);
  }
});
