export function stringifyJson(value) {
  if (typeof value === 'string') return value;
  return JSON.stringify(value ?? {}, null, 2);
}

export function parseJSON(value, fallback = {}) {
  if (!String(value || '').trim()) return { ok: true, value: fallback, error: null };
  try {
    return { ok: true, value: JSON.parse(value), error: null };
  } catch (error) {
    return { ok: false, value: fallback, error: 'JSON invalido. Revise chaves, virgulas e aspas.' };
  }
}

export function formatJSON(value) {
  const parsed = parseJSON(value);
  if (!parsed.ok) return { ok: false, value, error: parsed.error };
  return { ok: true, value: stringifyJson(parsed.value), error: null };
}
