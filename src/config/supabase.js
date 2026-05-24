export const supabaseUrl =
  globalThis.ONIKARA_SUPABASE_URL ||
  localStorage.getItem('ONIKARA_SUPABASE_URL') ||
  'http://127.0.0.1:54321';

export const supabaseAnonKey =
  globalThis.ONIKARA_SUPABASE_ANON_KEY ||
  localStorage.getItem('ONIKARA_SUPABASE_ANON_KEY') ||
  'replace-with-local-anon-key';

export function isSupabaseConfigured() {
  return Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      supabaseAnonKey !== 'replace-with-local-anon-key',
  );
}
