# Phase 01 Supabase Access Contracts

**Status:** Phase 1 contract baseline
**Scope:** Supabase data access for future admin, player, master and game-engine services
**Non-goal:** No JavaScript service stubs are created in Phase 1.

This document is the canonical Supabase access contract for the backend governance foundation. Future services should use these tables, views and RPCs through Supabase JS with normal RLS enforcement.

## Role Claims

Roles are read from signed Supabase Auth JWT claims through SQL helpers in `supabase/migrations/20260524031051_initial_rpg_schema.sql`.

| Claim | Meaning | Phase 1 permissions |
| --- | --- | --- |
| `player` | Default authenticated player and owner of profile/game state. | Own profile, inventory, quests, combat state and public/active reads. |
| `admin` | Platform administrator. Operates catalogs, gameplay configuration, player support, permissions and audit surfaces. | Broad RLS-mediated platform access. |
| `master` | Narrative/campaign role. A master can also be a player, creates campaigns and directs narrative in future phases. | Recognized by claim helper, but no special active permissions beyond player-level access in Phase 1. |

Helpers:

- `current_app_role()` reads `auth.jwt() ->> 'app_role'`, defaulting to `player`.
- `has_app_role(expected_role text)` compares the current signed app role.
- `is_admin()` gates platform administration.
- `is_master()` recognizes the reserved master role for future policies.

Role decisions must be based on signed claims and RLS. Frontend state can select UI mode, but it must not become the authorization source.

## Admin Contract

`admin` means platform administrator, not game master. The admin area manipulates and operationalizes platform configuration, catalogs, permissions, support and player state.

Future admin services may use the Supabase anon/client key with a signed `app_role = admin` claim. They must rely on RLS policies and helper functions such as `is_admin()`. The admin UI must not use `service_role`.

Allowed admin surfaces:

- Catalog CRUD: `rpg_classes`, `rpg_races`, `elements`, `status_effects`, `spells`, `class_spells`, `items`, `enemies`, `enemy_spells`, `quests`, `quest_steps`.
- Versioned gameplay configuration CRUD: `progression_rules`, `mana_rules`, `combat_rules`, `rarity_rules`, `loot_rules`.
- Player/platform operation tables: `profiles`, `character_spells`, `inventory`, `equipment`, `character_status_effects`, `character_quests`, `combat_sessions`, `combat_participants`, `combat_events`.
- Audit read: `admin_audit_logs`, admin-only.
- Sensitive operation logging RPCs: `log_admin_permission_action()` and `log_admin_support_action()`.

Admin audit expectations:

- Catalog and rule-table admin CRUD is audited by triggers with full `before_data` and `after_data`.
- Sensitive support and permission actions should be logged through RPCs with redacted payloads.
- Platform audit logs are for `admin` only. `master` never reads platform audit logs.

## Player Contract

`player` means the owner of their own profile and game state.

Allowed player reads:

- Public catalogs: `rpg_classes`, `rpg_races`, `elements`, `status_effects`, `spells`, `class_spells`, `items`, `enemies`, `enemy_spells`, `quests`, `quest_steps`.
- Active rule views: `active_progression_rules`, `active_mana_rules`, `active_combat_rules`, `active_rarity_rules`, `active_loot_rules`.
- Own data guarded by RLS: `profiles`, `character_spells`, `inventory`, `equipment`, `character_status_effects`, `character_quests`, `combat_sessions`, `combat_participants`, `combat_events`.

Allowed player writes:

- Player writes must remain inside RLS ownership policies.
- Future player/game-engine services must not mutate out-of-contract tables.
- Player/game-engine services consume active rule views and do not read or mutate draft/archive rule rows directly.

## Master Contract

`master` is a separate conceptual role from `admin`. A master can also be a player, mounts campaigns and directs narrative, but is not the platform administrator.

Phase 1 behavior:

- `master` is recognized by `is_master()` for future policies.
- `master` currently inherits player-level permissions only.
- `master` has no active campaign, narrative, permission or platform-operation policies in Phase 1.
- `master` never reads `admin_audit_logs` or any platform audit logs.
- Future master permissions must be scoped to campaign/narrative resources, not global platform administration.

## Forbidden Client Behavior

Client/browser code is forbidden from:

- Using `service_role`.
- Storing Supabase secrets.
- Attempting bypass of RLS.
- Performing direct mutations outside the documented tables/views/RPCs in this contract.
- Making authorization decisions based only on frontend state.
- Treating `master` as equivalent to `admin`.
- Reading or mutating draft/archive rule tables from player/game-engine flows.

`service_role` is allowed only in scripts, seed and maintenance contexts outside the browser/client runtime.

## Tables

### Public Catalog Tables

Readable by everyone; writable by `admin` through RLS:

- `rpg_classes`
- `rpg_races`
- `elements`
- `status_effects`
- `spells`
- `class_spells`
- `items`
- `enemies`
- `enemy_spells`
- `quests`
- `quest_steps`

### Player-Owned Tables

Owned access for players; broad operational access for `admin`:

- `profiles`
- `character_spells`
- `inventory`
- `equipment`
- `character_status_effects`
- `character_quests`
- `combat_sessions`
- `combat_participants`
- `combat_events`

### Versioned Rule Tables

Managed by `admin`; active rows readable through active views:

- `progression_rules`
- `mana_rules`
- `combat_rules`
- `rarity_rules`
- `loot_rules`

Each rule table supports `draft`, `active` and `archived` status, `name`, `version`, JSONB domain data and a single active row constraint.

### Audit Table

- `admin_audit_logs`

Readable only by `admin`. Trigger audit rows keep full before/after data for catalog and rule-table mutations. RPC-generated audit rows for permission/support actions are redacted.

## Views

Player/game-engine services should use these views instead of reading rule tables directly:

- `active_progression_rules`
- `active_mana_rules`
- `active_combat_rules`
- `active_rarity_rules`
- `active_loot_rules`

The active views are `security_invoker` views, so table RLS remains the enforcement boundary.

## RPCs

### `log_admin_permission_action(target_user_id uuid, action text, metadata jsonb default '{}'::jsonb)`

Use when future admin services grant, revoke or otherwise operate permissions. Requires `is_admin()`. Inserts a redacted row into `admin_audit_logs` and returns the audit log id.

### `log_admin_support_action(target_profile_id uuid, action text, summary jsonb default '{}'::jsonb)`

Use when future admin services perform sensitive support operations on a player profile. Requires `is_admin()`. Inserts a redacted row into `admin_audit_logs` and returns the audit log id.

## Shape Examples

### Admin Rule Version Mutation

```ts
await supabase.from('progression_rules').insert({
  name: 'mvp-default-progression',
  version: 2,
  status: 'draft',
  xp_curve: {
    base_xp: 100,
    growth_factor: 1.25
  },
  level_caps: {
    max_level: 20
  }
})
```

### Admin Audit Log Read

```ts
const { data } = await supabase
  .from('admin_audit_logs')
  .select('id, actor_user_id, actor_role, action, entity_table, entity_id, redacted, metadata, created_at')
  .order('created_at', { ascending: false })
```

### Admin Permission Action Logging

```ts
const { data: auditLogId } = await supabase.rpc('log_admin_permission_action', {
  target_user_id: userId,
  action: 'revoke_admin_role',
  metadata: {
    reason: 'manual_admin_review',
    source: 'admin_console'
  }
})
```

### Player Profile Read

```ts
const { data } = await supabase
  .from('profiles')
  .select('id, user_id, display_name, class_id, race_id, level, experience, current_hp, max_hp, current_mana, max_mana')
  .eq('user_id', user.id)
  .single()
```

### Player/Game-Engine Active Rule Read

```ts
const { data } = await supabase
  .from('active_combat_rules')
  .select('id, name, version, turn_rules, damage_rules, status_rules')
  .single()
```

## Verification Notes

- Plans 01-01 and 01-02 established the SQL helpers, RLS policies, rule tables, active views, audit triggers, audit table, RPCs and seed rows referenced by this contract.
- Admin services must use RLS with signed admin claims; they do not bypass RLS.
- Player/game-engine services consume `active_*_rules` views rather than draft/archive rule tables.
- Master is recognized but reserved for campaign/narrative permissions in future phases.
- No JS service stubs are created in Phase 1.
