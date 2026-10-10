import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.106.1';
import { supabaseAnonKey, supabaseUrl } from '../config/supabase.js';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export function normalizeSupabaseError(error) {
  if (!error) return null;
  const message = String(error.message || error.details || error.hint || error);
  const lower = message.toLowerCase();

  if (lower.includes('jwt') || lower.includes('session')) {
    return { code: 'session', message: 'Sessão expirada. Entre novamente.' };
  }

  if (lower.includes('permission') || lower.includes('policy') || lower.includes('rls')) {
    return {
      code: 'forbidden',
      message: 'Seu usuário não tem permissão para esta ação.',
    };
  }

  if (lower.includes('duplicate') || lower.includes('unique')) {
    return { code: 'conflict', message: 'Já existe um registro com esse identificador.' };
  }

  if (lower.includes('violates') || lower.includes('constraint')) {
    return { code: 'invalid', message: 'Revise os campos: há uma regra do banco impedindo o salvamento.' };
  }

  return { code: error.code || 'supabase_error', message };
}

export async function runSupabase(action) {
  try {
    const { data, error, count } = await action(supabase);
    if (error) return { ok: false, data: null, count: 0, error: normalizeSupabaseError(error) };
    return { ok: true, data, count: count ?? 0, error: null };
  } catch (error) {
    return { ok: false, data: null, count: 0, error: normalizeSupabaseError(error) };
  }
}
