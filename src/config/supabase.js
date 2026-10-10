const pageHost = globalThis.location?.hostname || '';
const isLocalHost = !pageHost || pageHost === 'localhost' || pageHost === '127.0.0.1' || pageHost === '[::1]';

export const supabaseUrl =
  globalThis.ONIKARA_SUPABASE_URL ||
  localStorage.getItem('ONIKARA_SUPABASE_URL') ||
  (isLocalHost ? 'http://127.0.0.1:54321' : `http://${pageHost}:54321`);

export const supabaseAnonKey =
  globalThis.ONIKARA_SUPABASE_ANON_KEY ||
  localStorage.getItem('ONIKARA_SUPABASE_ANON_KEY') ||
  'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

export function isSupabaseConfigured() {
  return Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      supabaseAnonKey !== 'replace-with-local-anon-key',
  );
}
