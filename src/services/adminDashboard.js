import { runSupabase } from './supabaseClient.js';

export const catalogTables = [
  'rpg_classes',
  'rpg_races',
  'elements',
  'status_effects',
  'spells',
  'items',
  'enemies',
  'quests',
];

export const ruleTables = [
  'progression_rules',
  'mana_rules',
  'combat_rules',
  'rarity_rules',
  'loot_rules',
];

export async function countTable(table) {
  return runSupabase((client) =>
    client.from(table).select('id', { count: 'exact', head: true }),
  );
}

export async function countRulesByStatus(table) {
  const result = await runSupabase((client) => client.from(table).select('status'));
  if (!result.ok) return result;

  return {
    ok: true,
    data: result.data.reduce(
      (acc, row) => {
        acc[row.status] = (acc[row.status] || 0) + 1;
        return acc;
      },
      { draft: 0, active: 0, archived: 0 },
    ),
    error: null,
  };
}

export async function getRecentAuditLogs(limit = 6) {
  return runSupabase((client) =>
    client
      .from('admin_audit_logs')
      .select('id, actor_user_id, actor_role, action, entity_table, entity_id, redacted, created_at')
      .order('created_at', { ascending: false })
      .limit(limit),
  );
}

export async function loadDashboardData() {
  const catalogCounts = {};
  const ruleCounts = {};

  await Promise.all(
    catalogTables.map(async (table) => {
      const result = await countTable(table);
      catalogCounts[table] = result.ok ? result.count : null;
    }),
  );

  await Promise.all(
    ruleTables.map(async (table) => {
      const result = await countRulesByStatus(table);
      ruleCounts[table] = result.ok ? result.data : { draft: 0, active: 0, archived: 0 };
    }),
  );

  const recentAudit = await getRecentAuditLogs();

  return {
    catalogCounts,
    ruleCounts,
    recentAudit: recentAudit.ok ? recentAudit.data : [],
    auditError: recentAudit.error,
  };
}
