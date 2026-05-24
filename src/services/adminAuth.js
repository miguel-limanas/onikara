import { isSupabaseConfigured } from '../config/supabase.js';
import { normalizeSupabaseError, supabase } from './supabaseClient.js';

export function getAppRole(session) {
  return (
    session?.user?.app_metadata?.app_role ||
    session?.user?.user_metadata?.app_role ||
    session?.access_token?.app_role ||
    'player'
  );
}

export function isAdminSession(session) {
  return getAppRole(session) === 'admin';
}

export async function signInAdmin({ email, password }) {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      session: null,
      error: {
        code: 'missing_config',
        message: 'Configure ONIKARA_SUPABASE_URL e ONIKARA_SUPABASE_ANON_KEY antes de entrar.',
      },
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, session: null, error: normalizeSupabaseError(error) };

  return { ok: true, session: data.session, error: null };
}

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) return { ok: false, session: null, error: normalizeSupabaseError(error) };
  return { ok: true, session: data.session, error: null };
}

export async function requireAdminSession() {
  const current = await getCurrentSession();
  if (!current.ok || !current.session) {
    return { ok: false, status: 'anonymous', session: null, error: current.error };
  }

  const { data } = await supabase.auth.getUser();
  const session = {
    ...current.session,
    user: data?.user || current.session.user,
  };

  if (!isAdminSession(session)) {
    return {
      ok: false,
      status: 'blocked',
      session,
      error: { code: 'not_admin', message: 'Este usuario nao possui papel administrativo.' },
    };
  }

  return { ok: true, status: 'admin', session, error: null };
}

export async function signOutAdmin() {
  await supabase.auth.signOut();
}
