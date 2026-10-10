import assert from 'node:assert/strict';
import { test } from 'node:test';
import { applyAction } from '../../src/engine/combat/index.js';
import { effectiveStat } from '../../src/engine/combat/effects.js';
import { enemyOf, newCombat, playerOf } from '../helpers.js';

function noCrit(state) {
  state.rules.critical.baseChance = 0;
  state.rules.critical.speedBonusStep = 0;
  return state;
}

function giveStatus(state, participant, status) {
  participant.statuses.push({ stacks: 1, remainingTurns: 2, sourceId: 'player-1', ...status });
  return state;
}

function advanceTo(state, actorId) {
  let current = state;
  let guard = 0;
  while (current.status === 'active' && current.order[current.activeIndex] !== actorId && guard < 20) {
    current = applyAction(current, { type: 'pass', actorId: current.order[current.activeIndex] }).state;
    guard += 1;
  }
  return current;
}

test('queimadura causa dano no início do turno do afetado e expira', () => {
  const { state } = newCombat({ classId: 'warrior', enemyIds: ['training-dummy'] });
  noCrit(state);
  const dummy = enemyOf(state);
  giveStatus(state, dummy, { id: 'burn', remainingTurns: 2 });
  const hpBefore = dummy.stats.hp;
  const first = applyAction(state, { type: 'pass', actorId: 'player-1' });
  assert.equal(enemyOf(first.state).stats.hp, hpBefore - 6);
  assert.ok(first.events.some((e) => e.type === 'damage' && e.payload.source === 'status'));
  // Segundo turno do afetado: novo dano; ao fim dele o efeito expira.
  const secondTurn = applyAction(advanceTo(first.state, 'player-1'), { type: 'pass', actorId: 'player-1' });
  assert.equal(enemyOf(secondTurn.state).stats.hp, hpBefore - 12);
  const after = advanceTo(secondTurn.state, 'player-1');
  assert.equal(enemyOf(after).statuses.length, 0);
  assert.equal(enemyOf(after).stats.hp, hpBefore - 12);
});

test('guarda quebrada reduz a defesa a 75% e lentidão reduz a velocidade', () => {
  const { state } = newCombat({ classId: 'warrior' });
  const dummy = enemyOf(state);
  giveStatus(state, dummy, { id: 'guard_break' });
  assert.equal(effectiveStat(state, dummy, 'defense'), 3);
  giveStatus(state, dummy, { id: 'slow' });
  assert.equal(effectiveStat(state, dummy, 'speed'), 0);
});

test('encharcado aumenta em 25% o dano de tempestade', () => {
  const { state } = newCombat({ classId: 'mage' });
  noCrit(state);
  giveStatus(state, enemyOf(state), { id: 'soak' });
  const step = applyAction(state, { type: 'spell', actorId: 'player-1', spellId: 'spark', targetId: 'enemy-1' });
  const damage = step.events.find((e) => e.type === 'damage');
  assert.equal(damage.payload.amount, Math.floor(40 * 1.25));
});

test('choque pode fazer o afetado perder a ação, de forma reproduzível', () => {
  const run = (seed) => {
    const { state } = newCombat({ classId: 'warrior', seed, enemyIds: ['ash-imp'] });
    giveStatus(state, enemyOf(state), { id: 'shock', remainingTurns: 5 });
    state.rules.critical.baseChance = 0;
    let skipped = 0;
    let current = state;
    for (let i = 0; i < 20 && current.status === 'active'; i += 1) {
      const actor = current.order[current.activeIndex];
      const step = applyAction(current, { type: 'pass', actorId: actor });
      skipped += step.events.filter((e) => e.payload.kind === 'status_skipped').length;
      current = step.state;
    }
    return skipped;
  };
  assert.equal(run('s1'), run('s1'));
  assert.ok(Array.from({ length: 12 }, (_, i) => run(`x${i}`)).some((n) => n > 0));
});

test('veneno e queimadura empilham até 3 e renovam a duração', () => {
  const { state } = newCombat({ classId: 'mage', level: 2, enemyIds: ['training-dummy'] });
  const dummy = enemyOf(state);
  giveStatus(state, dummy, { id: 'burn', stacks: 3, remainingTurns: 1 });
  noCrit(state);
  const step = applyAction(state, { type: 'pass', actorId: 'player-1' });
  assert.equal(enemyOf(step.state).stats.hp, 60 - 18);
});

test('escudo absorve antes do HP e purificação remove status', () => {
  const { state } = newCombat({ classId: 'mage' });
  const player = playerOf(state);
  giveStatus(state, player, { id: 'burn', remainingTurns: 3 });
  const cast = applyAction(state, { type: 'spell', actorId: 'player-1', spellId: 'water-veil', targetId: 'player-1' });
  assert.equal(playerOf(cast.state).shield, 18);
  assert.equal(playerOf(cast.state).statuses.find((s) => s.id === 'burn'), undefined);
});

test('bônus de defesa dura os turnos do próprio dono', () => {
  const { state } = newCombat({ classId: 'warrior', level: 2 });
  const cast = applyAction(state, { type: 'spell', actorId: 'player-1', spellId: 'stone-guard', targetId: 'player-1' });
  let current = cast.state;
  assert.equal(effectiveStat(current, playerOf(current), 'defense'), 16 + 6);
  // Protege contra duas ações do inimigo; some ao fim do terceiro turno do dono.
  for (let turn = 0; turn < 2; turn += 1) {
    current = advanceTo(current, 'player-1');
    assert.equal(effectiveStat(current, playerOf(current), 'defense'), 16 + 6);
    current = applyAction(current, { type: 'pass', actorId: 'player-1' }).state;
  }
  current = advanceTo(current, 'player-1');
  assert.equal(effectiveStat(current, playerOf(current), 'defense'), 16);
});

test('mana_drain transfere mana do alvo para o conjurador', () => {
  const { state } = newCombat({ classId: 'mage', level: 3, enemyIds: ['ash-imp'] });
  noCrit(state);
  playerOf(state).stats.mana = 50;
  enemyOf(state).stats.hp = 500;
  enemyOf(state).stats.maxHp = 500;
  state.order = ['player-1', 'enemy-1'];
  state.activeIndex = 0;
  const step = applyAction(state, { type: 'spell', actorId: 'player-1', spellId: 'tidal-cut', targetId: 'enemy-1' });
  assert.equal(enemyOf(step.state).stats.mana, 26);
  assert.equal(playerOf(step.state).stats.mana, 50 - 20 + 4 + 5);
});

test('área pequena acerta mais um inimigo com metade do dano', () => {
  const { state } = newCombat({ classId: 'mage', level: 2, enemyIds: ['training-dummy', 'training-dummy'] });
  noCrit(state);
  const step = applyAction(state, { type: 'spell', actorId: 'player-1', spellId: 'fireball', targetId: 'enemy-1' });
  const damages = step.events.filter((e) => e.type === 'damage');
  assert.equal(damages.length, 2);
  assert.equal(damages[1].payload.amount, Math.floor(damages[0].payload.amount * 0.5));
});

test('fadiga reduz a velocidade após magia de custo alto', () => {
  const { state } = newCombat({ classId: 'mage' });
  state.catalog.spells.spark.mana_cost = 70;
  playerOf(state).stats.mana = 100;
  const step = applyAction(state, { type: 'spell', actorId: 'player-1', spellId: 'spark', targetId: 'enemy-1' });
  assert.ok(step.events.some((e) => e.payload.kind === 'fatigue'));
  assert.equal(effectiveStat(step.state, playerOf(step.state), 'speed'), 10 - 2);
});

test('efeito desconhecido gera aviso e não interrompe', () => {
  const { state } = newCombat({ classId: 'mage' });
  state.catalog.spells.spark.effects = { explosao_secreta: 3 };
  const step = applyAction(state, { type: 'spell', actorId: 'player-1', spellId: 'spark', targetId: 'enemy-1' });
  assert.ok(step.events.some((e) => e.payload.kind === 'warning'));
  assert.ok(step.events.some((e) => e.type === 'damage'));
});
