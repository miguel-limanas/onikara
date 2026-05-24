---
phase: 01-n-cleo-supabase-pap-is-e-governan-a
plan: 01
subsystem: database-auth
tags: [supabase, postgres, rls, jwt, admin, roles]

requires: []
provides:
  - Claim-aware SQL helpers for Onikara roles
  - Admin write policies for public catalog tables
  - Admin operational policies for player-owned tables
  - Local seed contract for role claims
affects: [admin, player, master, supabase, phase-03, phase-04]

tech-stack:
  added: []
  patterns: [jwt-claim-rbac, rls-helper-functions, admin-via-rls, seed-documented-role-contract]

key-files:
  created: []
  modified:
    - supabase/migrations/20260524031051_initial_rpg_schema.sql
    - supabase/seed.sql

key-decisions:
  - "Use `app_role` JWT claim helpers as the RLS authority for `admin`, `player`, and recognized `master`."
  - "Keep catalog reads public while adding admin-only write policies."
  - "Keep `master` recognized but without special Phase 1 permissions."

patterns-established:
  - "Role helpers wrap `auth.jwt()` so policies do not repeat claim parsing."
  - "Admin platform authority is expressed through RLS policies, not browser secrets."

requirements-completed:
  - UIDB-02
  - ADMIN-01
  - governanca administrativa
  - autenticacao
  - RLS

duration: 21 min
completed: 2026-05-24
---

# Phase 01 Plan 01: Role and RLS Foundation Summary

**Supabase JWT role helpers with admin catalog writes, platform admin player-data policies, and a local role seed contract**

## Performance

- **Duration:** 21 min
- **Started:** 2026-05-24T03:50:00Z
- **Completed:** 2026-05-24T04:11:30Z
- **Tasks:** 4
- **Files modified:** 2

## Accomplishments

- Added `current_app_role()`, `has_app_role()`, `is_admin()`, and `is_master()` helpers based on the signed Supabase JWT `app_role` claim.
- Preserved public catalog read policies and added admin-only insert/update/delete policies for catalog tables.
- Added platform admin read/manage policies for player-owned operational tables while preserving existing player-owned RLS.
- Documented local role setup in `supabase/seed.sql`, including `admin`, `player`, recognized `master`, and no client promotion flow.
- Verified the migration and seed with `cmd /c npm run supabase:db:reset`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add role claim helper functions** - `f661aa0` (feat)
2. **Task 2: Add admin write policies for catalogs** - `c346e3f` (feat)
3. **Task 3: Add admin read/operate policies for player-owned operational data** - `aaf02bd` (feat)
4. **Task 4: Seed local role expectations without client promotion flow** - `c1e3431` (docs)

**Plan metadata:** pending in docs commit

## Files Created/Modified

- `supabase/migrations/20260524031051_initial_rpg_schema.sql` - Added JWT role helpers and admin RLS policies.
- `supabase/seed.sql` - Added the local role claim contract and promotion boundary.

## Decisions Made

- Used `app_role` as the claim key because the phase context and research centered on compact Supabase JWT role claims.
- Modeled `master` as a recognized helper without granting any special policy access in this plan.
- Kept service-role authority out of browser-facing patterns; all admin app behavior goes through normal RLS.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- PowerShell blocked `npm.ps1` due to execution policy. Re-ran the verification as `cmd /c npm run supabase:db:reset`, which completed successfully.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

The role/RLS foundation is ready for Plan 01-02 to add versioned gameplay rules and audit logging. Later admin/player contracts can rely on `is_admin()` and player-owned RLS boundaries.

## Self-Check: PASSED

---
*Phase: 01-n-cleo-supabase-pap-is-e-governan-a*
*Completed: 2026-05-24*
