import { getAppRole, getCurrentSession, signInAdmin } from './adminAuth.js';
import { supabase } from './supabaseClient.js';
import { loadOwnProfile } from './playerProfile.js';

export { getAppRole };

export async function signInPlayer(credentials) {
  return signInAdmin(credentials);
}

export async function signOutPlayer() {
  await supabase.auth.signOut();
}

// Estados: anonymous | ready | needs_profile | error
export async function requirePlayerSession() {
  const current = await getCurrentSession();
  if (!current.ok) return { status: 'error', session: null, profile: null, error: current.error };
  if (!current.session) return { status: 'anonymous', session: null, profile: null, error: null };

  const profile = await loadOwnProfile(current.session.user.id);
  if (!profile.ok) return { status: 'error', session: current.session, profile: null, error: profile.error };
  if (!profile.data) return { status: 'needs_profile', session: current.session, profile: null, error: null };

  return { status: 'ready', session: current.session, profile: profile.data, error: null };
}

// Admin segue para /admin; jogador (com ou sem personagem) segue para /play,
// onde o onboarding aparece quando ainda não há personagem.
export function resolveDestination(session) {
  return getAppRole(session) === 'admin' ? '/admin' : '/play';
}
