// Fluxo de campanha ponta a ponta contra o Supabase local (planos 05-04 e 05-05).
// Pré-requisitos: Supabase e `supabase functions serve combat` rodando; usuários de teste
// jogador.teste (com personagem 'Aria Teste'), outro.teste e master.teste (app_role = master),
// todos @onikara.local com a mesma senha de desenvolvimento.
// Uso: node supabase/tests/campaignFlow.mjs
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
  if (!r.access_token) throw new Error('login falhou ' + email);
  return r.access_token;
}

function rest(token) {
  const headers = { apikey: anon, authorization: `Bearer ${token}`, 'content-type': 'application/json', Prefer: 'return=representation' };
  return {
    get: (path) => fetch(`${base}/rest/v1/${path}`, { headers }).then((r) => r.json()),
    post: (path, body) => fetch(`${base}/rest/v1/${path}`, { method: 'POST', headers, body: JSON.stringify(body) }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) })),
    rpc: (name, body) => fetch(`${base}/rest/v1/rpc/${name}`, { method: 'POST', headers, body: JSON.stringify(body) }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) })),
    del: (path) => fetch(`${base}/rest/v1/${path}`, { method: 'DELETE', headers }).then((r) => r.status),
  };
}

function combat(token) {
  return async (body) => {
    const r = await fetch(`${base}/functions/v1/combat`, {
      method: 'POST',
      headers: { apikey: anon, authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    return { status: r.status, body: await r.json() };
  };
}

const log = (label, value) => console.log(label.padEnd(44), JSON.stringify(value));

const masterToken = await login('master.teste@onikara.local');
const playerToken = await login('jogador.teste@onikara.local');
const outsiderToken = await login('outro.teste@onikara.local');
const master = rest(masterToken);
const player = rest(playerToken);
const outsider = rest(outsiderToken);
const mCombat = combat(masterToken);
const pCombat = combat(playerToken);
const oCombat = combat(outsiderToken);

// limpeza de execuções anteriores


// jogador comum não cria campanha
const denied = await player.post('campaigns', { name: 'Invasão', master_user_id: (await player.get('profiles?select=user_id'))[0].user_id });
log('jogador cria campanha (esperado bloqueio)', denied.status);

const masterUser = JSON.parse(Buffer.from(masterToken.split('.')[1], 'base64').toString()).sub;
const created = await master.post('campaigns', { name: 'Campanha de Teste', master_user_id: masterUser });
const campaignId = created.body[0].id;
log('mestre cria campanha', created.status);

log('convida personagem inexistente', (await master.rpc('add_campaign_member', { p_campaign_id: campaignId, p_character_name: 'Fantasma' })).body?.message);
const invited = await master.rpc('add_campaign_member', { p_campaign_id: campaignId, p_character_name: 'Aria Teste' });
log('convida Aria Teste', invited.status);
const profileId = invited.body;
log('outsider convida (esperado erro)', (await outsider.rpc('add_campaign_member', { p_campaign_id: campaignId, p_character_name: 'Aria Teste' })).body?.message);

log('libera inimigos', (await master.post('campaign_enemies', [{ campaign_id: campaignId, enemy_id: 'ash-imp' }, { campaign_id: campaignId, enemy_id: 'training-dummy' }])).status);
log('concede tidal-cut', (await master.post('campaign_member_spells', { campaign_id: campaignId, profile_id: profileId, spell_id: 'tidal-cut' })).status);
log('jogador lê magias concedidas', (await player.get('campaign_member_spells?select=spell_id')).map((r) => r.spell_id));
log('outsider lê campanhas', await outsider.get('campaigns?select=id'));
log('mestre lê perfil do membro', (await master.get('profiles?select=character_name,level')).map((p) => p.character_name));

// limpa sessão solo antiga do jogador
await pCombat({ op: 'abandon' });

log('jogador inicia campanha (esperado 403)', (await pCombat({ op: 'start', campaignId, enemyIds: ['ash-imp'] })).body.error);
log('mestre inicia com inimigo não liberado', (await mCombat({ op: 'start', campaignId, enemyIds: ['nao-existe'] })).body.error);
const start = await mCombat({ op: 'start', campaignId, enemyIds: ['ash-imp'] });
log('mestre inicia combate', { status: start.status, ok: start.body.ok, version: start.body.version, order: start.body.state?.order.length });
let view = start.body;

const viewerState = await pCombat({ op: 'state' });
log('jogador vê o combate', { active: viewerState.body.active, viewer: viewerState.body.viewer?.role, hasParticipant: Boolean(viewerState.body.viewer?.participantId) });
log('outsider não vê', (await oCombat({ op: 'state' })).body);

const playerParticipant = view.state.participants.find((p) => p.team === 'player');
log('magia concedida na lista do jogador', playerParticipant.spells.includes('tidal-cut'));

async function turn() {
  const st = (await mCombat({ op: 'state', campaignId })).body;
  if (!st.state) return { st, active: null };
  const active = st.state.participants.find((p) => p.id === st.state.order[st.state.activeIndex]);
  return { st, active };
}

let guard = 0;
while (guard < 30) {
  guard += 1;
  const { st, active } = await turn();
  if (!st.state || st.status !== 'active') break;
  if (active.team === 'enemy') {
    const wrongPlayerMove = await pCombat({ op: 'act', version: st.version, move: { type: 'pass' } });
    if (guard === 1) log('jogador age fora da vez (esperado erro)', wrongPlayerMove.body.error?.code);
    const hint = await mCombat({ op: 'suggest', campaignId });
    const result = await mCombat({ op: 'act', campaignId, version: st.version, move: hint.body.move });
    if (guard === 1) log('mestre age pelo inimigo (sugestão da IA)', { status: result.status, move: hint.body.move.type });
  } else {
    if (guard <= 2) log('mestre tenta agir na vez do jogador', (await mCombat({ op: 'act', campaignId, version: st.version, move: { type: 'basic_attack', targetId: 'x' } })).body.error?.code);
    const target = st.state.participants.find((p) => p.team === 'enemy' && p.stats.hp > 0);
    const spell = active.spells.includes('tidal-cut') ? 'tidal-cut' : 'spark';
    const result = await pCombat({ op: 'act', version: st.version, move: { type: 'spell', spellId: spell, targetId: target.id } });
    if (!result.body.ok) {
      const r2 = await pCombat({ op: 'act', version: (await pCombat({ op: 'state' })).body.version, move: { type: 'basic_attack', targetId: target.id } });
      if (!r2.body.ok) log('erro jogador', r2.body.error);
    }
  }
}
const final = (await mCombat({ op: 'state', campaignId })).body;
log('estado final (sem sessão ativa)', final);
const sessions = await master.get(`combat_sessions?campaign_id=eq.${campaignId}&select=status,turn_number,version`);
log('sessão gravada', sessions);
const events = await master.get(`combat_events?select=seq,event_type&order=seq&limit=5&combat_session_id=eq.${(await master.get(`combat_sessions?campaign_id=eq.${campaignId}&select=id`))[0].id}`);
log('primeiros eventos', events.map((e) => `${e.seq}:${e.event_type}`));

// jogador/outsider não escreve na campanha
log('jogador libera inimigo (esperado bloqueio)', (await player.post('campaign_enemies', { campaign_id: campaignId, enemy_id: 'ash-imp' })).status);
