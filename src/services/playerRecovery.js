import { runSupabase } from './supabaseClient.js';

// Recuperação fora de combate. As regras (dado de regeneração, DT, percentual) ficam no banco.

// Aplica a regeneração por dias e por minuto (calculada no servidor) e devolve o estado atual.
export async function recoverRest() {
  return runSupabase((client) => client.rpc('rest_recover'));
}

// Teste de medicina: d20 + modificador de inteligência contra a DT da campanha (ou a padrão).
export async function attemptMedicine() {
  return runSupabase((client) => client.rpc('attempt_medicine'));
}

export async function useConsumable(itemId) {
  return runSupabase((client) => client.rpc('use_consumable', { p_item_id: itemId }));
}
