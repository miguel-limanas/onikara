// Combate de campanha com 2 jogadores nunca fica preso no turno do inimigo.
// Bug original: no combate com 2 jogadores contra o Boneco de Treino o turno do boneco não andava,
// porque em campanha os inimigos só agiam quando o mestre agia por eles.
// Pré-requisitos: Supabase local, `supabase functions serve combat`, usuários @onikara.local:
// jogador.teste (personagem Aria Teste), outro.teste (sem personagem; o script cria "Josh Teste"),
// master.teste (app_role = master). Usa só contas de teste e a campanha do master.teste; o usuário
// fora.teste@onikara.local é criado quando não existe. Uso: node supabase/tests/stuckEnemyFlow.mjs
import { readFileSync } from 'node:fs';

const cfg = readFileSync(new URL('../../src/config/supabase.js', import.meta.url), 'utf8');
const anon = cfg.match(/'(sb_publishable_[^']+)'/)[1];
const base = 'http://127.0.0.1:54321';
const password = 'OnikaraTeste#2026';

async function signUpIfMissing(email) {
  await fetch(`${base}/auth/v1/signup`, {
    method: 'POST',
    headers: { apikey: anon, 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
}

async function login(email) {
  const r = await fetch(`${base}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anon, 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).then((x) => x.json());
  if (!r.access_token) throw new Error(`login falhou: ${email}`);
  return { token: r.access_token, userId: r.user.id };
}

function client(token) {
  const headers = { apikey: anon, authorization: `Bearer ${token}`, 'content-type': 'application/json', Prefer: 'return=representation' };
  const wrap = async (r) => ({ status: r.status, body: await r.json().catch(() => null) });
  return {
    get: (path) => fetch(`${base}/rest/v1/${path}`, { headers }).then(wrap),
    post: (path, body) => fetch(`${base}/rest/v1/${path}`, { method: 'POST', headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify(body) }).then(wrap),
    rpc: (name, body = {}) => fetch(`${base}/rest/v1/rpc/${name}`, { method: 'POST', headers, body: JSON.stringify(body) }).then(wrap),
    combat: (body) => fetch(`${base}/functions/v1/combat`, { method: 'POST', headers, body: JSON.stringify(body) }).then((r) => r.json()),
  };
}

let failures = 0;
function check(label, passed, detail = '') {
  if (!passed) failures += 1;
  console.log(`${passed ? 'PASS' : 'FAIL'} ${label}${detail ? ` (${detail})` : ''}`);
}

const masterSession = await login('master.teste@onikara.local');
const master = client(masterSession.token);
const ren = client((await login('jogador.teste@onikara.local')).token);
const josh = client((await login('outro.teste@onikara.local')).token);

// Josh precisa de personagem
if (!(await josh.get('profiles?select=id')).body?.length) {
  await josh.rpc('create_character', { p_name: 'Josh Teste', p_class_id: 'warrior', p_race_id: 'human' });
}

// campanha com os dois jogadores e o boneco liberado
let campaign = (await master.get('campaigns?select=id&status=eq.active&limit=1')).body?.[0];
if (!campaign) {
  campaign = (await master.post('campaigns', { name: 'Campanha de Teste', master_user_id: masterSession.userId })).body[0];
}
const campaignId = campaign.id;
for (const name of ['Aria Teste', 'Josh Teste']) {
  await master.rpc('add_campaign_member', { p_campaign_id: campaignId, p_character_name: name });
}
await master.post('campaign_enemies', [
  { campaign_id: campaignId, enemy_id: 'training-dummy' },
  { campaign_id: campaignId, enemy_id: 'ash-imp' },
]);
await master.combat({ op: 'abandon', campaignId });

const players = [ren, josh];

async function view(who, extra = {}) {
  return who.combat({ op: 'state', ...extra });
}

async function playerTurn(state, version, sessionId) {
  // quem é o participante ativo?
  const active = state.participants.find((p) => p.id === state.order[state.activeIndex]);
  for (const who of players) {
    const mine = (await view(who)).viewer?.participantId;
    if (mine === active.id) {
      const foe = state.participants.find((p) => p.team === 'enemy' && p.stats.hp > 0);
      return who.combat({ op: 'act', sessionId, version, move: { type: 'basic_attack', targetId: foe.id } });
    }
  }
  return null;
}

// --- Cenário 1: 2 jogadores contra o Boneco de Treino, sem o mestre agir ---
let started = await master.combat({ op: 'start', campaignId, enemyIds: ['training-dummy'] });
check('combate iniciado com 2 jogadores', started.ok && started.state.participants.filter((p) => p.team === 'player').length === 2);

let current = started;
let stalled = false;
for (let step = 0; step < 80 && current.status === 'active'; step += 1) {
  const state = current.state;
  const active = state.participants.find((p) => p.id === state.order[state.activeIndex]);
  if (active.team === 'enemy') {
    stalled = true;
    break;
  }
  const result = await playerTurn(state, current.version, current.sessionId);
  if (!result || !result.ok) {
    console.log('erro na ação', JSON.stringify(result?.error));
    break;
  }
  current = result;
}
check('o turno do boneco anda sozinho (sem travar)', !stalled);
check('o combate termina em vitória com 2 jogadores e o boneco', current.status === 'victory', current.status);

// --- Cenário 2: inimigo com IA e mestre ausente: qualquer jogador executa o turno ---
await master.combat({ op: 'abandon', campaignId });
started = await master.combat({ op: 'start', campaignId, enemyIds: ['ash-imp'] });
current = started;
let guard = 0;
while (current.status === 'active' && guard < 5) {
  guard += 1;
  const state = current.state;
  const active = state.participants.find((p) => p.id === state.order[state.activeIndex]);
  if (active.team === 'enemy') break;
  const next = await playerTurn(state, current.version, current.sessionId);
  if (!next?.ok) break;
  current = next;
}
const state = current.state;
const active = state.participants.find((p) => p.id === state.order[state.activeIndex]);
check('chegou a vez do Imp (mestre ausente)', current.status === 'active' && active.team === 'enemy', active?.name);

await signUpIfMissing('fora.teste@onikara.local');
const outsider = client((await login('fora.teste@onikara.local')).token);
const denied = await outsider.combat({ op: 'enemy_turn', sessionId: current.sessionId });
check('quem não participa não executa o turno', denied.ok === false, denied.error?.code);

const executed = await ren.combat({ op: 'enemy_turn', sessionId: current.sessionId });
const after = executed.state?.participants.find((p) => p.id === executed.state.order[executed.state.activeIndex]);
check('jogador executa o turno do inimigo pela IA', executed.ok === true && after?.team === 'player', executed.error?.message || after?.name);

const notEnemy = await ren.combat({ op: 'enemy_turn', sessionId: current.sessionId });
check('fora da vez do inimigo a operação é recusada', notEnemy.ok === false, notEnemy.error?.code);

await master.combat({ op: 'abandon', campaignId });
console.log(failures ? `\n${failures} verificação(ões) falharam.` : '\nTodas as verificações passaram.');
process.exitCode = failures ? 1 : 0;
