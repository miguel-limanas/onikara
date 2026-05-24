---
phase: 01-n-cleo-supabase-pap-is-e-governan-a
plan: 03
subsystem: supabase-contracts
tags: [supabase, contracts, rls, admin, player, master]

requires:
  - phase: 01-01
    provides: Claim-aware admin helpers and RLS foundations
  - phase: 01-02
    provides: Versioned rules, active views, audit logs and admin RPCs
provides:
  - Canonical Supabase access contracts for admin, player and master
  - Explicit forbidden client behavior boundaries
  - Future-service data shapes for rule mutation, audit reads, player reads and active-rule reads
affects: [admin, player, master, game-engine, phase-03, phase-04, phase-05]

tech-stack:
  added: []
  patterns: [contract-first-supabase-access, rls-as-boundary, reserved-master-role]

key-files:
  created:
    - .planning/phases/01-n-cleo-supabase-pap-is-e-governan-a/01-SUPABASE-CONTRACTS.md
  modified: []

key-decisions:
  - "Document admin as platform administrator, not master."
  - "Document master as recognized and reserved for campaign/narrative flows, with player-level permissions only in Phase 1."
  - "Forbid service_role, secrets, RLS bypass and out-of-contract client mutations."

patterns-established:
  - "Future admin services use anon/client Supabase access with signed admin claims and RLS."
  - "Future player/game-engine services consume active rule views instead of draft/archive rule tables."
  - "Future master services must be campaign/narrative scoped, not platform-admin scoped."

requirements-completed:
  - UIDB-02
  - ADMIN-01
  - ADMIN-02
  - ADMIN-03
  - governanca administrativa
  - autenticacao
  - RLS

duration: 4 min
completed: 2026-05-24
---

# Phase 01 Plan 03: Supabase Contracts Summary

**Canonical access contracts now separate platform admin, player ownership and the future master narrative role.**

## Performance

- **Duration:** 4 min
- **Completed:** 2026-05-24
- **Tasks:** 6
- **Files created:** 1

## Accomplishments

- Created `01-SUPABASE-CONTRACTS.md` with sections for role claims, admin/player/master contracts, forbidden client behavior, tables, views, RPCs, shape examples and verification notes.
- Documented `admin` as platform administrator with RLS-mediated access to catalogs, rules, player operational tables, audit logs and sensitive logging RPCs.
- Documented `player` as owner of profile/game state with public catalog reads, active rule views and RLS-owned data access.
- Documented `master` as a recognized but reserved campaign/narrative role that currently inherits player-level permissions only and never reads platform audit logs.
- Explicitly forbade browser/client `service_role`, secrets, RLS bypass, out-of-contract mutations and role authorization based only on frontend state.
- Verified migration, seed and contract alignment with structural `rg` checks and a successful local Supabase reset.

## Task Commits

1. **Tasks 1-4: Create and define Supabase contracts** - `174b7d9` (docs)

**Plan metadata:** pending in docs commit

## Files Created/Modified

- `.planning/phases/01-n-cleo-supabase-pap-is-e-governan-a/01-SUPABASE-CONTRACTS.md` - Canonical Phase 1 Supabase access contracts.

## Verification

- `Test-Path .planning/phases/01-n-cleo-supabase-pap-is-e-governan-a/01-SUPABASE-CONTRACTS.md` returned `True`.
- `rg -n "Admin Contract|Player Contract|Master Contract|Forbidden Client Behavior|service_role|active_progression_rules" ...` passed.
- `rg -n "service_role|bypass of RLS|outside the documented" ...` passed.
- `rg -n "current_app_role|is_admin|admin_audit_logs|active_progression_rules|progression_rules" supabase/migrations/20260524031051_initial_rpg_schema.sql` passed.
- `rg -n "progression_rules|mana_rules|combat_rules|rarity_rules|loot_rules" supabase/seed.sql` passed.
- `cmd /c npm run supabase:db:reset` passed and finished with `Finished supabase db reset on branch master.`

## Deviations from Plan

None - no JS service stubs were created, and the plan stayed in contract/documentation scope.

## Issues Encountered

None. The role divergence was resolved in the contract by making `admin` the platform administrator and `master` a separate narrative/campaign role.

## User Setup Required

None.

## Next Phase Readiness

Future admin, player and master UI/service phases can now use the contracts as the canonical data boundary before implementing Supabase JS service modules.

## Self-Check: PASSED

---
*Phase: 01-n-cleo-supabase-pap-is-e-governan-a*
*Completed: 2026-05-24*
