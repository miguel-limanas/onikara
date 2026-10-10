// Anti-trapaça: o jogador não altera nível, XP, inventário nem missões diretamente (plano 05-08).
// Pré-requisitos: Supabase local rodando; usuários jogador.teste (com personagem) e
// outro.teste (SEM personagem), @onikara.local. O personagem criado para outro.teste é removido ao final
// pelo próprio script quando houver permissão de admin; caso contrário, apague-o pelo Studio.
// Uso: node supabase/tests/hardeningFlow.mjs
import { readFileSync } from 'node:fs';

const cfg = readFileSync(new URL('../../src/config/supabase.js', import.meta.url), 'utf8');
const anon = cfg.match(/'(sb_publishable_[^']+)'/)[1];
const base = 'http://127.0.0.1:54321';
const password = 'OnikaraTeste#2026';

async function session(email) {
  const r = await fetch(`${base}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anon, 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).then((x) => x.json());
  return { token: r.access_token, userId: r.user?.id };
}

function client(token) {
  const headers = { apikey: anon, authorization: `Bearer ${token}`, 'content-type': 'application/json', Prefer: 'return=representation' };
  const wrap = async (response) => ({ status: response.status, body: await response.json().catch(() => null) });
  return {
    get: (path) => fetch(`${base}/rest/v1/${path}`, { headers }).then(wrap),
    post: (path, body) => fetch(`${base}/rest/v1/${path}`, { method: 'POST', headers, body: JSON.stringify(body) }).then(wrap),
    patch: (path, body) => fetch(`${base}/rest/v1/${path}`, { method: 'PATCH', headers, body: JSON.stringify(body) }).then(wrap),
    del: (path) => fetch(`${base}/rest/v1/${path}`, { method: 'DELETE', headers }).then(wrap),
    rpc: (name, body = {}) => fetch(`${base}/rest/v1/rpc/${name}`, { method: 'POST', headers, body: JSON.stringify(body) }).then(wrap),
  };
}

let failures = 0;
function check(label, passed, detail = '') {
  if (!passed) failures += 1;
  console.log(`${passed ? 'PASS' : 'FAIL'} ${label}${detail ? ` (${detail})` : ''}`);
}

const owner = await session('jogador.teste@onikara.local');
const player = client(owner.token);
const profile = (await player.get('profiles?select=id,level,xp,character_name,current_state')).body[0];

const level = await player.patch(`profiles?id=eq.${profile.id}`, { level: 99 });
check('jogador não altera o próprio nível', level.status >= 400, `status ${level.status}`);
const xp = await player.patch(`profiles?id=eq.${profile.id}`, { xp: 99999 });
check('jogador não altera o próprio XP', xp.status >= 400, `status ${xp.status}`);
const state = await player.patch(`profiles?id=eq.${profile.id}`, { current_state: { hp: 9999 } });
check('jogador não altera HP/mana diretamente', state.status >= 400, `status ${state.status}`);
const rename = await player.patch(`profiles?id=eq.${profile.id}`, { character_name: profile.character_name });
check('jogador ainda pode editar o nome', rename.status < 300, `status ${rename.status}`);

const loot = await player.post('inventory', { profile_id: profile.id, item_id: 'oni-ash', quantity: 99 });
check('jogador não cria itens no inventário', loot.status >= 400, `status ${loot.status}`);
const progress = await player.patch(`character_quests?profile_id=eq.${profile.id}`, { status: 'completed' });
check('jogador não conclui missões diretamente', progress.status >= 400 || (Array.isArray(progress.body) && progress.body.length === 0), `status ${progress.status}`);
const effect = await player.post('character_status_effects', { profile_id: profile.id, status_effect_id: 'burn' });
check('jogador não grava efeitos de status', effect.status >= 400, `status ${effect.status}`);

// equipamento: slot incompatível
const inventory = (await player.get('inventory?select=id,item_id,item:items(item_type)')).body;
const armor = inventory.find((row) => row.item?.item_type === 'armor');
if (armor) {
  const wrongSlot = await player.post('equipment', { profile_id: profile.id, slot: 'main_hand', inventory_id: armor.id });
  check('armadura não entra na mão principal', wrongSlot.status >= 400, `status ${wrongSlot.status}`);
}

// criação de personagem: só pela RPC
const other = await session('outro.teste@onikara.local');
const stranger = client(other.token);
const direct = await stranger.post('profiles', {
  user_id: other.userId,
  character_name: 'Trapaceiro',
  class_id: 'warrior',
  race_id: 'human',
  base_stats: { hp: 9999, mana: 9999, strength: 999, defense: 999, intelligence: 999, speed: 999 },
  level: 20,
});
check('insert direto de perfil é bloqueado', direct.status >= 400, `status ${direct.status}`);

const invalid = await stranger.rpc('create_character', { p_name: 'A', p_class_id: 'warrior', p_race_id: 'human' });
check('nome curto é recusado', invalid.status >= 400, invalid.body?.message);
const created = await stranger.rpc('create_character', { p_name: 'Novato Teste', p_class_id: 'mage', p_race_id: 'strong_oni', p_element_id: 'water' });
check('RPC cria o personagem', created.status === 200 && created.body?.level === 1, `status ${created.status}`);
if (created.status === 200) {
  const stats = created.body.base_stats;
  check('atributos vêm da classe + raça (Mago Oni Forte)', stats.hp === 115 && stats.mana === 85 && stats.strength === 12, JSON.stringify(stats));
  check('elemento escolhido foi gravado', created.body.element_id === 'water');
  const kit = (await stranger.get('inventory?select=item_id,quantity')).body.map((row) => row.item_id).sort();
  check('kit inicial entregue', kit.join(',') === 'apprentice-staff,health-salve,mana-tonic,patched-armor', kit.join(','));
}
const again = await stranger.rpc('create_character', { p_name: 'Outro Nome', p_class_id: 'warrior', p_race_id: 'human' });
check('segundo personagem é recusado', again.status >= 400, again.body?.message);

console.log(failures ? `\n${failures} verificação(ões) falharam.` : '\nTodas as verificações passaram.');
process.exitCode = failures ? 1 : 0;
