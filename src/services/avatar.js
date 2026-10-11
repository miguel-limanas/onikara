import { runSupabase } from './supabaseClient.js';

// Avatar redondo do usuário (jogador, mestre ou admin). Sem avatar, a interface usa o padrão.

export async function loadMyAvatar(userId) {
  const result = await runSupabase((client) =>
    client.from('user_avatars').select('avatar').eq('user_id', userId).maybeSingle(),
  );
  return result.ok ? result.data?.avatar || null : null;
}

export async function saveMyAvatar(dataUrl) {
  return runSupabase((client) => client.rpc('set_my_avatar', { p_avatar: dataUrl }));
}

// Mapa profile_id -> avatar dos jogadores de um combate.
export async function loadCombatAvatars(sessionId) {
  if (!sessionId) return new Map();
  const result = await runSupabase((client) => client.rpc('combat_avatars', { p_session_id: sessionId }));
  if (!result.ok) return new Map();
  return new Map(result.data.map((row) => [row.profile_id, row.avatar]));
}
