import assert from 'node:assert/strict';
import { test } from 'node:test';
import { applyAction, listActions } from '../../src/engine/combat/index.js';
import { elementalRelation } from '../../src/engine/combat/damage.js';
import { enemyOf, newCombat, playerOf } from '../helpers.js';

function damageOf(events) {
  return events.find((event) => event.type === 'damage');
}

test('relações elementais do seed', () => {
  const { state } = newCombat({ classId: 'mage' });
  assert.equal(elementalRelation(state, 'fire', 'nature'), 'advantage');
  assert.equal(elementalRelation(state, 'fire', 'water'), 'disadvantage');
  assert.equal(elementalRelation(state, 'water', 'storm'), 'disadvantage');
  assert.equal(elementalRelation(state, 'storm', 'water'), 'advantage');
  assert.equal(elementalRelation(state, 'neutral', 'fire'), null);
  assert.equal(elementalRelation(state, 'fire', 'neutral'), null);
});

test('Guerreiro: focused-slash contra o boneco = força + poder - defesa', () => {
  // Remove aleatoriedade do crítico: velocidade do boneco igual e chance fixa em 0.
  const { state } = newCombat({ classId: 'warrior', seed: 'sem-critico' });
  state.rules.critical.baseChance = 0;
  state.rules.critical.speedBonusStep = 0;
  const step = applyAction(state, {
    type: 'spell',
    actorId: 'player-1',
    spellId: 'focused-slash',
    targetId: 'enemy-1',
  });
  const damage = damageOf(step.events);
  assert.equal(damage.payload.amount, 16 + 20 - 4);
  assert.equal(damage.payload.elemental, null);
  assert.equal(enemyOf(step.state).stats.hp, 60 - 32);
});

test('Mago: spark custa 10 de mana e aplica recarga', () => {
  const { state } = newCombat({ classId: 'mage' });
  state.rules.critical.baseChance = 0;
  state.rules.critical.speedBonusStep = 0;
  const step = applyAction(state, { type: 'spell', actorId: 'player-1', spellId: 'spark', targetId: 'enemy-1' });
  // 18 + 22 = 40 (resistência 0), mana 100 - 10 + 5 de regeneração
  assert.equal(damageOf(step.events).payload.amount, 40);
  assert.equal(playerOf(step.state).stats.mana, 95);
  assert.equal(step.state.cooldowns['player-1'].spark > 0, true);
});

test('vantagem 1.5x, desvantagem 0.75x e neutro 1x', () => {
  const base = newCombat({ classId: 'mage', level: 3, enemyIds: ['ash-imp'] }).state;
  base.rules.critical.baseChance = 0;
  base.rules.critical.speedBonusStep = 0;
  // Imp é de fogo: água (tidal-cut) tem vantagem; storm (spark) é neutro contra fogo.
  base.order = ['player-1', 'enemy-1'];
  base.activeIndex = 0;
  const water = applyAction(base, { type: 'spell', actorId: 'player-1', spellId: 'tidal-cut', targetId: 'enemy-1' });
  const waterDamage = damageOf(water.events);
  assert.equal(waterDamage.payload.elemental, 'advantage');
  // intelligence 18 + 4*2 = 26; 26 + 34 = 60 * 1.5 = 90
  assert.equal(waterDamage.payload.amount, 90);

  const spark = applyAction(base, { type: 'spell', actorId: 'player-1', spellId: 'spark', targetId: 'enemy-1' });
  assert.equal(damageOf(spark.events).payload.elemental, null);
  assert.equal(damageOf(spark.events).payload.amount, 26 + 22);
});

test('piso de dano mínimo e ataque básico com dado', () => {
  const { state } = newCombat({ classId: 'mage' });
  state.rules.critical.baseChance = 0;
  state.rules.critical.speedBonusStep = 0;
  state.participants[1].stats.defense = 999;
  const step = applyAction(state, { type: 'basic_attack', actorId: 'player-1', targetId: 'enemy-1' });
  assert.equal(damageOf(step.events).payload.amount, 1);
  assert.ok(step.events.some((event) => event.type === 'basic_attack'));
});

test('mana insuficiente e recarga recusam a ação sem mutar o estado', () => {
  const { state } = newCombat({ classId: 'mage' });
  playerOf(state).stats.mana = 5;
  const before = JSON.stringify(state);
  assert.throws(
    () => applyAction(state, { type: 'spell', actorId: 'player-1', spellId: 'spark', targetId: 'enemy-1' }),
    (error) => error.code === 'not_enough_mana',
  );
  assert.equal(JSON.stringify(state), before);

  const ok = newCombat({ classId: 'mage' }).state;
  const first = applyAction(ok, { type: 'spell', actorId: 'player-1', spellId: 'water-veil', targetId: 'player-1' });
  assert.ok(first);
});

test('recarga bloqueia a magia pelo número de turnos do dono', () => {
  const { state } = newCombat({ classId: 'mage' });
  const cast = applyAction(state, { type: 'spell', actorId: 'player-1', spellId: 'spark', targetId: 'enemy-1' });
  // O boneco é passivo no 05-01: o motor devolve a vez ao jogador no turno seguinte do jogador.
  let current = cast.state;
  while (current.order[current.activeIndex] !== 'player-1') {
    current = applyAction(current, { type: 'pass', actorId: current.order[current.activeIndex] }).state;
  }
  const blocked = listActions(current, 'player-1').find((action) => action.spellId === 'spark');
  assert.equal(blocked.cooldownRemaining, 1);
  assert.equal(blocked.disabled.code, 'on_cooldown');
  assert.throws(
    () => applyAction(current, { type: 'spell', actorId: 'player-1', spellId: 'spark', targetId: 'enemy-1' }),
    (error) => error.code === 'on_cooldown',
  );
  // Após passar o turno, a recarga acaba.
  let later = applyAction(current, { type: 'pass', actorId: 'player-1' }).state;
  while (later.order[later.activeIndex] !== 'player-1') {
    later = applyAction(later, { type: 'pass', actorId: later.order[later.activeIndex] }).state;
  }
  const available = listActions(later, 'player-1').find((action) => action.spellId === 'spark');
  assert.equal(available.disabled, null);
});

test('determinismo: mesma semente e mesmas ações geram os mesmos eventos', () => {
  const run = () => {
    const { state } = newCombat({ classId: 'warrior', seed: 'mesma-semente' });
    let current = state;
    const log = [];
    for (let i = 0; i < 6 && current.status === 'active'; i += 1) {
      const actor = current.order[current.activeIndex];
      const action =
        actor === 'player-1'
          ? { type: 'spell', actorId: actor, spellId: 'focused-slash', targetId: 'enemy-1' }
          : { type: 'pass', actorId: actor };
      const step = applyAction(current, action);
      log.push(...step.events);
      current = step.state;
    }
    return JSON.stringify(log);
  };
  assert.equal(run(), run());
});

test('vitória quando todos os inimigos caem', () => {
  const { state } = newCombat({ classId: 'warrior' });
  enemyOf(state).stats.hp = 1;
  const step = applyAction(state, { type: 'basic_attack', actorId: 'player-1', targetId: 'enemy-1' });
  assert.equal(step.state.status, 'victory');
  assert.ok(step.events.some((event) => event.type === 'defeat'));
  assert.throws(() => applyAction(step.state, { type: 'pass', actorId: 'player-1' }), (e) => e.code === 'combat_finished');
});
