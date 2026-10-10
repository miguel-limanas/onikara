// Recompensas, missões e recuperação ponta a ponta contra o Supabase local (plano 05-07).
// Pré-requisitos: Supabase e `supabase functions serve combat` rodando; usuários
// jogador.teste (personagem 'Aria Teste') e master.teste (app_role = master), @onikara.local.
// Uso: node supabase/tests/rewardsFlow.mjs
import { readFileSync } from 'node:fs';

const cfg = readFileSync(new URL('../../src/config/supabase.js', import.meta.url), 'utf8');
const anon = cfg.match(/'(sb_publishable_[^']+)'/)[1];
const base = 'http://127.0.0.1:54321';
const password = 'OnikaraTeste#2026';

async function login(email) {
  const r = await fetch(`${base}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anon, 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).then((x) => x.json());
  return r.access_token;
}

function client(token) {
  const headers = { apikey: anon, authorization: `Bearer ${token}`, 'content-type': 'application/json' };
  return {
    get: (path) => fetch(`${base}/rest/v1/${path}`, { headers }).then((r) => r.json()),
    rpc: (name, body = {}) =>
      fetch(`${base}/rest/v1/rpc/${name}`, { method: 'POST', headers, body: JSON.stringify(body) }).then(async (r) => ({
        status: r.status,
        body: await r.json().catch(() => null),
      })),
    combat: (body) =>
      fetch(`${base}/functions/v1/combat`, { method: 'POST', headers, body: JSON.stringify(body) }).then((r) => r.json()),
  };
}

const log = (label, value) => console.log(label.padEnd(46), JSON.stringify(value));
const player = client(await login('jogador.teste@onikara.local'));

// estado inicial: encerra combates, zera missão e perfil de teste
await player.combat({ op: 'abandon' });
const before = (await player.get('profiles?select=id,level,xp,current_state'))[0];
log('perfil antes', { level: before.level, xp: before.xp, hp: before.current_state.hp });

// missão
log('aceita missão', (await player.rpc('start_quest', { p_quest_id: 'first-sparks' })).body);
log('resgata sem objetivos (esperado erro)', (await player.rpc('claim_quest_reward', { p_quest_id: 'first-sparks' })).body?.message);

// combate solo contra o boneco (conta de teste): vitória concede recompensas na hora
let view = await player.combat({ op: 'start', enemyIds: ['training-dummy'] });
let guard = 0;
while (view.status === 'active' && guard < 12) {
  guard += 1;
  const state = view.state;
  const me = state.participants.find((p) => p.id === view.viewer.participantId);
  const foe = state.participants.find((p) => p.team === 'enemy' && p.stats.hp > 0);
  const cooling = state.cooldowns[me.id]?.spark > 0;
  const move = cooling
    ? { type: 'basic_attack', targetId: foe.id }
    : { type: 'spell', spellId: 'spark', targetId: foe.id };
  view = await player.combat({ op: 'act', sessionId: view.sessionId, version: view.version, move });
  if (!view.ok) {
    log('erro', view.error);
    break;
  }
}
log('combate terminou', { status: view.status, rounds: view.round });

const rewards = await player.get(`combat_rewards?combat_session_id=eq.${view.sessionId}&select=summary`);
log('recompensa gravada', rewards[0]?.summary);
const after = (await player.get('profiles?select=level,xp,current_state'))[0];
log('perfil depois', { level: after.level, xp: after.xp, hp: after.current_state.hp, mana: after.current_state.mana });
const quest = (await player.get('character_quests?select=quest_id,status,progress'))[0];
log('progresso da missão', quest);

log('resgata missão', (await player.rpc('claim_quest_reward', { p_quest_id: 'first-sparks' })).body);
log('resgata de novo (esperado erro)', (await player.rpc('claim_quest_reward', { p_quest_id: 'first-sparks' })).body?.message);
log('inventário', (await player.get('inventory?select=item_id,quantity')).map((i) => `${i.item_id}x${i.quantity}`));

// recuperação
log('descansar (regeneração)', (await player.rpc('rest_recover')).body);
log('medicina', (await player.rpc('attempt_medicine')).body);
log('medicina de novo (esperado erro)', (await player.rpc('attempt_medicine')).body?.message);
log('usar unguento', (await player.rpc('use_consumable', { p_item_id: 'health-salve' })).body);
log('usar item inexistente (esperado erro)', (await player.rpc('use_consumable', { p_item_id: 'oni-ash' })).body?.message);
