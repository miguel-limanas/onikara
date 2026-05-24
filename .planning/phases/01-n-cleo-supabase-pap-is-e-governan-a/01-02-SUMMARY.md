---
phase: 01-n-cleo-supabase-pap-is-e-governan-a
plan: 02
subsystem: database-governance
tags: [supabase, postgres, rls, audit, rules, seed]

requires:
  - phase: 01-01
    provides: Claim-aware admin helpers and RLS foundations
provides:
  - Versioned gameplay rule tables for progression, mana, combat, rarity, and loot
  - Public active-rule views for player/game-engine consumption
  - Admin audit log table with full before/after trigger audit for catalogs/configs
  - Redacted RPC audit foundations for sensitive permission/support actions
  - Seeded active MVP rule rows
affects: [admin, player, game-engine, balance, phase-03, phase-04, phase-05]

tech-stack:
  added: []
  patterns: [versioned-rule-tables, active-rule-views, trigger-audit, redacted-admin-rpc]

key-files:
  created: []
  modified:
    - supabase/migrations/20260524031051_initial_rpg_schema.sql
    - supabase/seed.sql

key-decisions:
  - "Use explicit rule tables instead of generic key/value settings."
  - "Expose only active rule versions through security-invoker views."
  - "Use full before/after audit for catalog/config changes and redacted RPC audit rows for sensitive operations."

patterns-established:
  - "Each rule domain has `draft`, `active`, and `archived` status with a single active version constraint."
  - "Active views are the contract for player/game-engine reads."
  - "Audit triggers ignore non-admin seed/player writes and log admin mutations only."

requirements-completed:
  - UIDB-02
  - ADMIN-02
  - ADMIN-03
  - governanca administrativa
  - RLS

duration: 5 min
completed: 2026-05-24
---

# Phase 01 Plan 02: Versioned Rules and Audit Summary

**Versioned gameplay rules with active Supabase views, admin audit triggers, redacted support RPCs, and seeded MVP balance defaults**

## Performance

- **Duration:** 5 min
- **Started:** 2026-05-24T04:11:30Z
- **Completed:** 2026-05-24T04:16:53Z
- **Tasks:** 5
- **Files modified:** 2

## Accomplishments

- Added explicit versioned tables: `progression_rules`, `mana_rules`, `combat_rules`, `rarity_rules`, and `loot_rules`.
- Added `active_progression_rules`, `active_mana_rules`, `active_combat_rules`, `active_rarity_rules`, and `active_loot_rules` security-invoker views.
- Added `admin_audit_logs`, full before/after admin audit trigger function, and triggers on catalog/config tables.
- Added `log_admin_permission_action()` and `log_admin_support_action()` with admin-only checks and redacted payloads.
- Seeded deterministic active rule rows for MVP progression, mana, combat, rarity, and loot.
- Verified everything with `cmd /c npm run supabase:db:reset`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create explicit versioned gameplay rule tables** - `c15a4c5` (feat)
2. **Task 2: Add active-rule views and RLS policies** - `ca7342a` (feat)
3. **Task 3: Create admin audit log table and trigger function** - `0697259` (feat)
4. **Task 4: Add RPC foundations for sensitive administrative actions** - `c5d2f50` (feat)
5. **Task 5: Seed initial active rules** - `bac9274` (feat)

**Plan metadata:** pending in docs commit

## Files Created/Modified

- `supabase/migrations/20260524031051_initial_rpg_schema.sql` - Added rule tables, active views, audit logs, audit triggers, and sensitive admin RPCs.
- `supabase/seed.sql` - Added active seed data for all five rule domains.

## Decisions Made

- Used one active version per rule table through partial unique indexes.
- Used `security_invoker = true` on active views so table RLS remains the enforcement boundary.
- Made audit trigger writes conditional on `is_admin()` so local seed/reset does not create misleading platform audit rows.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. Supabase reset completed successfully after the migration and seed changes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Contracts in Plan 01-03 can now point admin services to rule tables/RPCs and player/game-engine services to active views.

## Self-Check: PASSED

---
*Phase: 01-n-cleo-supabase-pap-is-e-governan-a*
*Completed: 2026-05-24*
