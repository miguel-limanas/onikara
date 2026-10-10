import { applyDamage, elementalMultiplier, elementalRelation, rollDamage } from './damage.js';
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
      cooldownTurns: spell.cooldown_turns,
      cooldownRemaining: cooldownRemaining(state, actor.id, spellId),
      targets: spellTargets(state, actor, spell),
      disabled: spellDisabledReason(state, actor, spell),
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

function dealDamage(state, rng, events, { actor, target, power, elementId, physical, source, spellId }) {
  const roll = rollDamage(state, rng, { attacker: actor, defender: target, power, elementId, physical });
  const { dealt, absorbed } = applyDamage(target, roll.amount);
  events.push(
    makeEvent(state, 'damage', {
      actorId: actor.id,
      targetId: target.id,
      payload: {
        amount: roll.amount,
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

function performSpell(state, rng, events, actor, action) {
  if (!actor.spells.includes(action.spellId)) throw new CombatError('spell_unavailable', 'Magia indisponível.');
  const spell = state.catalog.spells[action.spellId];
  if (!spell) throw new CombatError('spell_unavailable', 'Magia indisponível.');
  const blocked = spellDisabledReason(state, actor, spell);
  if (blocked && blocked.code !== 'invalid_target') throw new CombatError(blocked.code, blocked.message);

  const allowed = spellTargets(state, actor, spell);
  const targets = isAreaTarget(spell)
    ? allowed.map((id) => findParticipant(state, id))
    : [resolveSingleTarget(state, actor, action.targetId, allowed)];
  if (!targets.length) throw new CombatError('invalid_target', 'Sem alvo disponível.');

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

  if (spell.power > 0) {
    for (const target of targets) {
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
  }
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
    case 'pass':
      events.push(makeEvent(next, 'system', { actorId: actor.id, payload: { kind: 'pass' } }));
      break;
    default:
      throw new CombatError('unknown_action', 'Ação desconhecida.');
  }

  commitRng(next, rng);
  if (resolveOutcome(next)) {
    events.push(makeEvent(next, 'system', { actorId: actor.id, payload: { kind: next.status } }));
  } else {
    endTurn(next, events);
    commitRng(next, rng);
  }
  return { state: next, events };
}
