# Supabase governance foundation

- **Owner:** Founder/creator
- **Status:** scoping
- **Source:** Phase 1 in [source/planning/ROADMAP.md](../../../source/planning/ROADMAP.md)

## Problem / opportunity

Onikara needs a secure, traceable platform base before admin/player workflows can safely read/write persistent data.

## Users / segments

- Admin/master operators
- Players
- Future collaborators implementing data contracts

## Metrics expected to move

- Critical flow readiness: blocked until roles/RLS/contracts exist.
- Data safety readiness: not instrumented yet.

## Hypotheses

See [hypotheses/supabase-governance-foundation.md](../../../hypotheses/supabase-governance-foundation.md).

## Dependencies

- Existing Supabase schema and migrations.
- Phase 1 GSD plans for admin roles, RLS, config tables, audit logs, and Supabase JS contracts.

## Milestones

- 01-01: Admin role model, authorization helper, RLS policies.
- 01-02: Platform/config tables and seeds.
- 01-03: Shared Supabase JS access contracts.

## Evidence / artifacts

- [source/planning/ROADMAP.md](../../../source/planning/ROADMAP.md)
- [source/planning/REQUIREMENTS.md](../../../source/planning/REQUIREMENTS.md)

## Linked

- Hypotheses: [../../../hypotheses/supabase-governance-foundation.md](../../../hypotheses/supabase-governance-foundation.md)
- Decisions: TODO
- Stakeholders affected: [../../../stakeholders/futuros-mestres-admins.md](../../../stakeholders/futuros-mestres-admins.md), [../../../stakeholders/futuros-jogadores.md](../../../stakeholders/futuros-jogadores.md)

## Check-back

Verify after Phase 1 that seeds remain reproducible and RLS separates public catalog reads, admin writes, and private player data.
