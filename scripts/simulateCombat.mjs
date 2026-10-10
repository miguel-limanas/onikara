// Simulador de combate no terminal (usa o motor puro e a fixture do seed).
// Exemplo: npm run combat:sim -- --class mage --enemy ash-imp --seed abc --level 3
import { readFileSync } from 'node:fs';
import { applyAction, buildScenario, createCombat, listActions } from '../src/engine/combat/index.js';

const rows = JSON.parse(readFileSync(new URL('../tests/fixtures/rules.mvp.json', import.meta.url), 'utf8'));

function parseArgs(argv) {
  const args = { class: 'warrior', enemy: 'training-dummy', seed: 'demo', level: 1, runs: 1, verbose: true };
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index].replace(/^--/, '');
    args[key] = argv[index + 1];
  }
  args.level = Number(args.level);
  args.runs = Number(args.runs);
  args.verbose = args.runs === 1;
  return args;
}

function nameOf(state, id) {
  return state.participants.find((participant) => participant.id === id)?.name || '?';
}

function describe(state, event) {
  const actor = nameOf(state, event.actorId);
  const target = nameOf(state, event.targetId);
  const p = event.payload;
  switch (event.type) {
    case 'turn_start':
      return `  Vez de ${actor}`;
    case 'basic_attack':
      return `  ${actor} ataca ${target} (dado ${p.die}: ${p.roll})`;
    case 'spell_cast':
      return `  ${actor} conjura ${state.catalog.spells[p.spellId]?.name || p.spellId} (-${p.manaCost} mana)`;
    case 'damage': {
      const elemental = p.elemental === 'advantage' ? ' [vantagem elemental]' : p.elemental === 'disadvantage' ? ' [resistido]' : '';
      return `    ${target} sofre ${p.amount} de dano${p.crit ? ' (crítico!)' : ''}${elemental}`;
    }
    case 'defeat':
      return `    ${target} foi derrotado`;
    case 'turn_end':
      return `  fim do turno (+${p.manaRegen} mana)`;
    case 'system':
      return `  [${p.kind}]`;
    default:
      return `  ${event.type}`;
  }
}

// Estratégia simples: magia de maior dano esperado que couber; senão ataque básico.
function chooseAction(state, actorId) {
  const actions = listActions(state, actorId).filter((action) => !action.disabled && action.targets.length);
  const spells = actions.filter((action) => action.type === 'spell');
  const damaging = spells
    .map((action) => ({ action, power: state.catalog.spells[action.spellId].power }))
    .filter((entry) => entry.power > 0)
    .sort((a, b) => b.power - a.power);
  const pick = damaging[0]?.action || actions.find((action) => action.type === 'basic_attack');
  if (!pick) return { type: 'pass', actorId };
  return { type: pick.type, actorId, spellId: pick.spellId, targetId: pick.targets[0] };
}

function chooseEnemyAction(state, actorId) {
  return { type: 'pass', actorId };
}

function simulate(args, seed) {
  const scenario = buildScenario(rows, {
    classId: args.class,
    level: args.level,
    enemyIds: [args.enemy],
    seed,
  });
  let { state, events } = createCombat(scenario);
  const log = [];
  let guard = 0;
  while (state.status === 'active' && guard < 400) {
    const actorId = state.order[state.activeIndex];
    const actor = state.participants.find((participant) => participant.id === actorId);
    const action = actor.team === 'player' ? chooseAction(state, actorId) : chooseEnemyAction(state, actorId);
    const step = applyAction(state, action);
    if (args.verbose) {
      log.push(`Rodada ${state.round}`);
      for (const event of step.events) log.push(describe(step.state, event));
    }
    state = step.state;
    guard += 1;
  }
  return { state, log };
}

const args = parseArgs(process.argv.slice(2));
if (args.runs === 1) {
  const { state, log } = simulate(args, args.seed);
  console.log(log.join('\n'));
  const player = state.participants.find((participant) => participant.team === 'player');
  console.log(`\nResultado: ${state.status} em ${state.round} rodada(s). HP ${player.stats.hp}/${player.stats.maxHp}, mana ${player.stats.mana}/${player.stats.maxMana}.`);
} else {
  let wins = 0;
  let rounds = 0;
  for (let run = 0; run < args.runs; run += 1) {
    const { state } = simulate(args, `${args.seed}-${run}`);
    if (state.status === 'victory') wins += 1;
    rounds += state.round;
  }
  console.log(`${args.runs} combates: vitórias ${wins} (${Math.round((wins / args.runs) * 100)}%), rodadas médias ${(rounds / args.runs).toFixed(1)}.`);
}
