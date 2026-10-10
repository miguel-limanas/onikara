import { applyDamage, elementalMultiplier, elementalRelation, rollDamage } from './damage.js';
import {
  applyBonus,
  applyStatus,
  effectiveStat,
  removeStatuses,
  warnUnknownEffects,
} from './effects.js';
import { CombatError } from './errors.js';
import { rollDice } from './rng.js';
import {
  aliveOf,
  cloneState,
  commitRng,
  findParticipant,
  getActiveParticipant,
  isAlive,
  makeEvent,
  resolveOutcome,
  rngOf,
} from './state.js';
import { cooldownRemaining, cooldownValue, endTurn } from './turns.js';

function opposingTeam(team) {
  if (team === 'player') return 'enemy';
  if (team === 'enemy') return 'player';
  return null;
}

export function spellTargets(state, actor, spell) {
  const enemies = aliveOf(state, opposingTeam(actor.team)).map((item) => item.id);
  const allies = aliveOf(state, actor.team).map((item) => item.id);
  switch (spell.target_type) {
    case 'self':
      return [actor.id];
    case 'ally':
    case 'all_allies':
      return allies;
    case 'all_enemies':
      return enemies;
    default:
      return enemies;
  }
}

function isAreaTarget(spell) {
  return spell.target_type === 'all_enemies' || spell.target_type === 'all_allies' || spell.target_type === 'self';
}

export function isPhysicalSpell(spell) {
  return spell.effects?.scales_with === 'strength';
}

function spellDisabledReason(state, actor, spell) {
  const left = cooldownRemaining(state, actor.id, spell.id);
  if (left > 0) return { code: 'on_cooldown', message: `Em recarga (${left} turno${left > 1 ? 's' : ''}).` };
  if (actor.stats.mana - spell.mana_cost < state.rules.mana.minimumRemaining) {
    return { code: 'not_enough_mana', message: 'Mana insuficiente.' };
  }
  if (!spellTargets(state, actor, spell).length) return { code: 'invalid_target', message: 'Sem alvo disponível.' };
  return null;
}

function usableItems(state, actor) {
  return actor.items.filter((entry) => {
    const item = state.catalog.items[entry.itemId];
    if (!item || item.item_type !== 'consumable' || entry.quantity <= 0) return false;
    return Boolean(item.effects?.restore_hp || item.effects?.restore_mana);
  });
}

export function fleeChance(state, actor) {
  const enemies = aliveOf(state, opposingTeam(actor.team));
  if (!enemies.length) return 0.9;
  const average = enemies.reduce((sum, enemy) => sum + effectiveStat(state, enemy, 'speed'), 0) / enemies.length;
  const chance = 0.5 + 0.05 * (effectiveStat(state, actor, 'speed') - average);
  return Math.min(0.9, Math.max(0.1, chance));
}

// Lista o que o ator pode tentar agora; ações indisponíveis trazem o motivo para a UI.
export function listActions(state, actorId) {
  const actor = findParticipant(state, actorId);
  if (!actor || state.status !== 'active') return [];
  const enemies = aliveOf(state, opposingTeam(actor.team)).map((item) => item.id);
  const actions = [
    {
      type: 'basic_attack',
      label: 'Ataque básico',
      targets: enemies,
      die: actor.weaponDie,
      disabled: enemies.length ? null : { code: 'invalid_target', message: 'Sem alvo disponível.' },
    },
  ];
  for (const spellId of actor.spells) {
    const spell = state.catalog.spells[spellId];
    if (!spell) continue;
    actions.push({
      type: 'spell',
      spellId,
      label: spell.name,
      elementId: spell.element_id,
      manaCost: spell.mana_cost,
      power: spell.power,
      cooldownTurns: spell.cooldown_turns,
      cooldownRemaining: cooldownRemaining(state, actor.id, spellId),
      targets: spellTargets(state, actor, spell),
      selfTarget: spell.target_type === 'self',
      disabled: spellDisabledReason(state, actor, spell),
    });
  }
  if (actor.team === 'player') {
    for (const entry of usableItems(state, actor)) {
      const item = state.catalog.items[entry.itemId];
      actions.push({
        type: 'item',
        itemId: entry.itemId,
        label: item.name,
        quantity: entry.quantity,
        targets: [actor.id],
        selfTarget: true,
        disabled: null,
      });
    }
    actions.push({
      type: 'flee',
      label: 'Fugir',
      targets: [],
      chance: fleeChance(state, actor),
      disabled: null,
    });
  }
  return actions;
}

// Pré-visualização para a UI: relação elemental de um elemento contra um alvo.
export function previewElemental(state, elementId, targetId) {
  const target = findParticipant(state, targetId);
  const relation = target ? elementalRelation(state, elementId, target.elementId) : null;
  return { relation, multiplier: elementalMultiplier(state, relation) };
}

function dealDamage(state, rng, events, { actor, target, power, elementId, physical, source, spellId, scale = 1 }) {
  const roll = rollDamage(state, rng, { attacker: actor, defender: target, power, elementId, physical });
  const amount = scale === 1 ? roll.amount : Math.max(state.rules.damage.minimum, Math.floor(roll.amount * scale));
  const { dealt, absorbed } = applyDamage(target, amount);
  events.push(
    makeEvent(state, 'damage', {
      actorId: actor.id,
      targetId: target.id,
      payload: {
        amount,
        dealt,
        absorbed,
        crit: roll.crit,
        elemental: roll.relation,
        source,
        spellId: spellId || null,
      },
    }),
  );
  if (!isAlive(target)) {
    events.push(makeEvent(state, 'defeat', { actorId: actor.id, targetId: target.id, payload: { participantId: target.id } }));
  }
}

function resolveSingleTarget(state, actor, targetId, allowed) {
  const target = findParticipant(state, targetId);
  if (!target || !isAlive(target) || !allowed.includes(target.id)) {
    throw new CombatError('invalid_target', 'Alvo inválido.');
  }
  return target;
}

function performBasicAttack(state, rng, events, actor, action) {
  const allowed = aliveOf(state, opposingTeam(actor.team)).map((item) => item.id);
  const target = resolveSingleTarget(state, actor, action.targetId, allowed);
  const power = rollDice(rng, actor.weaponDie);
  events.push(makeEvent(state, 'basic_attack', { actorId: actor.id, targetId: target.id, payload: { die: actor.weaponDie, roll: power } }));
  dealDamage(state, rng, events, {
    actor,
    target,
    power,
    elementId: actor.elementId,
    physical: true,
    source: 'basic_attack',
  });
}

function applySpellEffects(state, rng, events, actor, spell, target, damaged) {
  const effects = spell.effects || {};
  if (damaged && isAlive(target)) {
    const statusId = spell.status_effect_id || state.catalog.elements[spell.element_id]?.status_effect;
    if (statusId && effects.status_chance > 0 && rng.chance(effects.status_chance)) {
      applyStatus(state, events, { actor, target, statusId });
    }
    if (effects.slow && state.catalog.statusEffects.slow) {
      applyStatus(state, events, { actor, target, statusId: 'slow', duration: effects.duration_turns });
    }
    if (effects.mana_drain > 0) {
      const drained = Math.min(effects.mana_drain, target.stats.mana);
      if (drained > 0) {
        target.stats.mana -= drained;
        const gained = Math.min(drained, actor.stats.maxMana - actor.stats.mana);
        actor.stats.mana += gained;
        events.push(makeEvent(state, 'system', { actorId: actor.id, targetId: target.id, payload: { kind: 'mana_drain', amount: drained } }));
      }
    }
  }
  if (effects.shield > 0) {
    target.shield = Math.max(target.shield, effects.shield);
    events.push(makeEvent(state, 'heal', { actorId: actor.id, targetId: target.id, payload: { shield: effects.shield } }));
  }
  if (Array.isArray(effects.cleanse)) {
    removeStatuses(state, events, { actor, target, ids: effects.cleanse });
  }
  if (effects.defense_bonus > 0) {
    applyBonus(state, events, {
      actor,
      target,
      id: 'defense_bonus',
      bonus: { defense: effects.defense_bonus },
      duration: effects.duration_turns || 1,
    });
  }
}

function performSpell(state, rng, events, actor, action) {
  if (!actor.spells.includes(action.spellId)) throw new CombatError('spell_unavailable', 'Magia indisponível.');
  const spell = state.catalog.spells[action.spellId];
  if (!spell) throw new CombatError('spell_unavailable', 'Magia indisponível.');
  const blocked = spellDisabledReason(state, actor, spell);
  if (blocked) throw new CombatError(blocked.code, blocked.message);

  const allowed = spellTargets(state, actor, spell);
  const targets = isAreaTarget(spell)
    ? allowed.map((id) => findParticipant(state, id))
    : [resolveSingleTarget(state, actor, action.targetId, allowed)];

  actor.stats.mana -= spell.mana_cost;
  const cooldown = cooldownValue(spell.cooldown_turns);
  if (cooldown > 0) {
    state.cooldowns[actor.id] = { ...(state.cooldowns[actor.id] || {}), [spell.id]: cooldown };
  }
  events.push(
    makeEvent(state, 'spell_cast', {
      actorId: actor.id,
      targetId: targets.length === 1 ? targets[0].id : null,
      payload: { spellId: spell.id, manaCost: spell.mana_cost, cooldown: spell.cooldown_turns },
    }),
  );
  warnUnknownEffects(state, events, actor, spell);

  if (spell.mana_cost >= state.rules.mana.legendaryCostThreshold) {
    actor.flags.fatiguedTurns = state.rules.mana.fatigueTurns + 1;
    events.push(makeEvent(state, 'system', { actorId: actor.id, payload: { kind: 'fatigue', turns: state.rules.mana.fatigueTurns } }));
  }

  const damaging = spell.power > 0;
  for (const target of targets) {
    if (damaging) {
      dealDamage(state, rng, events, {
        actor,
        target,
        power: spell.power,
        elementId: spell.element_id,
        physical: isPhysicalSpell(spell),
        source: 'spell',
        spellId: spell.id,
      });
    }
    applySpellEffects(state, rng, events, actor, spell, target, damaging);
  }

  if (damaging && spell.effects?.area === 'small' && !isAreaTarget(spell)) {
    const primary = targets[0];
    const splash = aliveOf(state, opposingTeam(actor.team)).find((enemy) => enemy.id !== primary.id);
    if (splash) {
      dealDamage(state, rng, events, {
        actor,
        target: splash,
        power: spell.power,
        elementId: spell.element_id,
        physical: isPhysicalSpell(spell),
        source: 'spell',
        spellId: spell.id,
        scale: 0.5,
      });
    }
  }
}

function performItem(state, events, actor, action) {
  const entry = usableItems(state, actor).find((item) => item.itemId === action.itemId);
  if (!entry) throw new CombatError('item_unavailable', 'Item indisponível.');
  const item = state.catalog.items[entry.itemId];
  const hp = Math.min(item.effects.restore_hp || 0, actor.stats.maxHp - actor.stats.hp);
  const mana = Math.min(item.effects.restore_mana || 0, actor.stats.maxMana - actor.stats.mana);
  actor.stats.hp += hp;
  actor.stats.mana += mana;
  entry.quantity -= 1;
  if (entry.quantity <= 0) actor.items = actor.items.filter((candidate) => candidate.itemId !== entry.itemId);
  events.push(makeEvent(state, 'item_used', { actorId: actor.id, targetId: actor.id, payload: { itemId: entry.itemId } }));
  events.push(makeEvent(state, 'heal', { actorId: actor.id, targetId: actor.id, payload: { hp, mana } }));
}

function performFlee(state, rng, events, actor) {
  if (actor.team !== 'player') throw new CombatError('unknown_action', 'Somente jogadores podem fugir.');
  const success = rng.chance(fleeChance(state, actor));
  events.push(makeEvent(state, 'system', { actorId: actor.id, payload: { kind: 'flee', success } }));
  if (success) state.status = 'escaped';
}

// Valida e aplica uma ação do participante ativo; devolve um novo estado e os eventos gerados.
export function applyAction(state, action) {
  if (state.status !== 'active') throw new CombatError('combat_finished', 'O combate já terminou.');
  const active = getActiveParticipant(state);
  if (!action?.actorId || action.actorId !== active.id) {
    throw new CombatError('not_active_turn', 'Não é a vez deste participante.');
  }

  const next = cloneState(state);
  const actor = findParticipant(next, action.actorId);
  const rng = rngOf(next);
  const events = [];

  switch (action.type) {
    case 'basic_attack':
      performBasicAttack(next, rng, events, actor, action);
      break;
    case 'spell':
      performSpell(next, rng, events, actor, action);
      break;
    case 'item':
      performItem(next, events, actor, action);
      break;
    case 'flee':
      performFlee(next, rng, events, actor);
      break;
    case 'pass':
      events.push(makeEvent(next, 'system', { actorId: actor.id, payload: { kind: 'pass' } }));
      break;
    default:
      throw new CombatError('unknown_action', 'Ação desconhecida.');
  }

  if (next.status === 'active' && resolveOutcome(next)) {
    events.push(makeEvent(next, 'system', { actorId: actor.id, payload: { kind: next.status } }));
  } else if (next.status === 'active') {
    endTurn(next, events, rng);
  }
  commitRng(next, rng);
  return { state: next, events };
}
