import { runSupabase } from './supabaseClient.js';

export function listAuditLogs(filters = {}) {
  return runSupabase((client) => {
    let query = client
      .from('admin_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(filters.limit || 50);

    if (filters.entity_table) query = query.eq('entity_table', filters.entity_table);
    if (filters.action) query = query.eq('action', filters.action);
    if (filters.actor_user_id) query = query.eq('actor_user_id', filters.actor_user_id);
    if (filters.from) query = query.gte('created_at', filters.from);
    if (filters.to) query = query.lte('created_at', filters.to);
    return query;
  });
}
