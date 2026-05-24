# Walking Skeleton - Onikara

**Phase:** 1
**Generated:** 2026-05-24

## Capability Proven End-to-End

A local Supabase reset produces a governed Onikara backend where public catalog reads, admin-only writes, private player data, active game rules and audit logs are all represented by executable database artifacts.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Vanilla HTML/CSS/ESM later; no UI scaffold in Phase 1 | The current phase is backend governance, and frontend code should wait for the admin/player UI phases. |
| Data layer | Supabase Postgres with RLS | Supabase is the project source of truth and already hosts the schema. |
| Auth | Supabase Auth JWT claims | Context locked role authorization to signed Auth claims rather than client logic. |
| Admin boundary | Supabase JS with RLS helpers; service role only scripts | Enables browser admin tooling later without exposing privileged secrets. |
| Deployment target | Local Supabase via CLI/Docker | MVP foundation must be reproducible through migrations and seed. |
| Directory layout | `supabase/migrations`, `supabase/seed.sql`, phase planning docs | Matches existing repo layout and GSD workflow. |

## Stack Touched in Phase 1

- [ ] Project scaffold (framework, build, lint, test runner) - deferred; existing package scripts are sufficient for this backend phase.
- [ ] Routing - deferred to UI phases.
- [ ] Database - real read/write boundaries are established through tables, RLS, views, triggers and RPCs.
- [ ] UI - deferred to Phase 2/3/4.
- [ ] Deployment - local full-stack run/reset remains `npm run supabase:start` and `npm run supabase:db:reset`.

## Out of Scope (Deferred to Later Slices)

- Admin UI screens.
- Player onboarding UI.
- Master campaign/narrative screens.
- Client role management interface.
- Combat HUD or realtime gameplay.

## Subsequent Slice Plan

- Phase 2: Apply Onikara identity and design system to admin/player surfaces.
- Phase 3: Build the first operational admin backoffice over the governed Supabase foundation.
- Phase 4: Build player profile, character and progression flows.
- Phase 5: Build interactive combat and realtime event flows.
- Phase 6: Add observability, support tooling and polish.
