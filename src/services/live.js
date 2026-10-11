import { supabase } from './supabaseClient.js';

// Assinatura Realtime (postgres_changes) com antirrepique. A RLS decide o que cada
// usuário recebe. `alive` encerra a assinatura quando a tela some do DOM.
// specs: [{ table, event = '*', filter }]
export function watchChanges(name, specs, onChange, { debounceMs = 300, alive = () => true } = {}) {
  let timer = null;
  let stopped = false;
  let lastTable = null;
  let lastPayload = null;
  const channel = supabase.channel(name);

  function fire(table, payload) {
    lastTable = table;
    lastPayload = payload;
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (stopped) return;
      if (!alive()) {
        stop();
        return;
      }
      onChange({ table: lastTable, payload: lastPayload });
    }, debounceMs);
  }

  specs.forEach((spec) => {
    const options = { event: spec.event || '*', schema: 'public', table: spec.table };
    if (spec.filter) options.filter = spec.filter;
    channel.on('postgres_changes', options, (payload) => fire(spec.table, payload));
  });
  channel.subscribe();

  function stop() {
    if (stopped) return;
    stopped = true;
    clearTimeout(timer);
    supabase.removeChannel(channel);
  }
  return stop;
}
