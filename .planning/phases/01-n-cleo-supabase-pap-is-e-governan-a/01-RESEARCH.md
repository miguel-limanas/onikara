# Phase 1: Nucleo Supabase, Papeis e Governanca - Research

**Researched:** 2026-05-24
**Domain:** Supabase Auth claims, Postgres RLS, admin audit, versioned game rules
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- `admin` is the platform administrator with broad authority over tables, configuration, permissions and operation.
- `player` and `admin` are active in the MVP, while the role model must allow future graduated roles.
- `master` is conceptually separate from admin and player, may also be a player, and must be recognized as a claim without special Phase 1 policies.
- Backend authorization uses Supabase Auth JWT claims. Frontend-only role logic is not trusted.
- Initial admin setup is local seed/migration only; no client promotion UI in Phase 1.
- Catalogs remain publicly readable; admin-only writes are added through RLS.
- `/admin` uses Supabase JS with normal RLS helpers; `service_role` is restricted to scripts, seed and maintenance.
- Audit covers all admin CRUD plus sensitive player/permission actions.
- Catalog/config audit stores complete before/after; player/permission audit stores redacted summaries.
- Gameplay settings use explicit versioned domain tables for progression, mana, combat, rarity and loot, with public active-rule views.
- Contracts are documented in Markdown before service code is created, with conceptual `admin`, `player` and `master` contracts.

### the agent's Discretion
- Exact SQL helper names, table names, constraints and indexes may be chosen by the implementer if they preserve the decisions above.
- Verification commands may use the local Supabase CLI, SQL introspection, and grep-style checks.

### Deferred Ideas (OUT OF SCOPE)
- Master campaign flows and special master permissions.
- Client UI for role promotion/revocation.
- Full mutable support tooling beyond auditable RPC foundations.
</user_constraints>

<architectural_responsibility_map>
## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Role claims | Database/Auth | Client | Supabase Auth issues JWTs; RLS reads claims. Client can display role-aware UI but never grants authority. |
| Admin catalog writes | Database | Browser/Client | RLS owns enforcement; `/admin` sends normal Supabase JS requests. |
| Player privacy | Database | Browser/Client | Row ownership and claim checks belong in policies, not view code. |
| Audit logs | Database | Browser/Client | Triggers/RPCs are the reliable place to capture changes and actor context. |
| Versioned rules | Database | Game engine | Postgres stores version history; client/game engine consumes active views. |
| Contracts | Documentation | Client | Markdown contracts guide later JS services without premature code stubs. |
</architectural_responsibility_map>

<research_summary>
## Summary

Supabase's current RBAC guidance centers on Custom Access Token Hooks for adding application role claims and using those claims in RLS policies. For Onikara, that maps cleanly to an `app_role` or equivalent claim with values such as `admin`, `player` and `master`, plus SQL helpers like `public.current_app_role()`, `public.is_admin()` and `public.is_master()`.

The existing schema already has useful RLS: catalog tables are public-readable, and player-owned data is protected through joins back to `profiles.user_id = auth.uid()`. Phase 1 should extend this rather than replace it: add claim-aware admin policies, preserve public reads, and keep service-role workflows outside the browser.

For reproducibility, Supabase local development applies migrations and then `supabase/seed.sql` during `supabase db reset`, which makes this phase a good place to add seedable local role setup and deterministic configuration rows. Versioned rule tables should use strict status constraints and active views so later clients never need to understand draft/archive history.

**Primary recommendation:** Implement claim-aware helpers and RLS first, then add versioned rules/audit, then document contracts and run a full local reset verification.
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library/Tool | Version | Purpose | Why Standard |
|--------------|---------|---------|--------------|
| Supabase CLI | package `supabase` 2.101.0 | Local stack, migrations, db reset, seed verification | Already installed and used by the repo scripts. |
| Supabase JS | `@supabase/supabase-js` 2.106.1 | Client access for future admin/player services | Existing project dependency and intended access layer. |
| Postgres RLS | Supabase Postgres | Authorization boundary for admin/player/master | Enforces security even when clients call tables directly. |
| PL/pgSQL | Built-in | Helpers, triggers, RPCs and auth hook | Native to Supabase/Postgres and appropriate for RLS. |

### Official References
| Topic | Source | Planning Impact |
|-------|--------|-----------------|
| Custom access token hook | https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook | Use an Auth hook to add/adjust claims before token issue. |
| Custom claims/RBAC | https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac | Model a role claim and reference it from RLS policies. |
| JWT claims | https://supabase.com/docs/guides/auth/jwt-fields | Keep custom claims compact and avoid relying on client-only session decoration. |
| Local migrations/seeding | https://supabase.com/docs/guides/cli/local-development | Validate with local migrations and seed reset. |
| CLI db reset | https://supabase.com/docs/reference/cli/supabase-secrets | `db reset` reapplies migrations and seed data locally. |
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### System Architecture Diagram

```text
Supabase Auth sign-in
  -> custom_access_token_hook
    -> reads seed/migration-defined role source or app metadata
    -> emits compact Onikara role claims
      -> Supabase JS request from /admin or /play
        -> PostgREST
          -> RLS policies call is_admin()/is_master()/auth.uid()
            -> allowed table/view/RPC result
            -> audit trigger/RPC writes admin_audit_logs when applicable
```

### Recommended Project Structure

```text
supabase/
  migrations/
    existing initial schema
    new governance migration: claims helpers, RLS, audit, rules, views
  seed.sql
    deterministic local catalog + admin/role setup + initial active rules
.planning/phases/01-.../
  01-CONTEXT.md
  01-RESEARCH.md
  01-01-PLAN.md
  01-02-PLAN.md
  01-03-PLAN.md
  SKELETON.md
docs or .planning/
  Supabase access contracts in Markdown
```

### Pattern 1: Claim Helper Functions
**What:** Wrap `auth.jwt()` access in stable SQL helpers.
**When to use:** Every RLS policy that checks role/claim state.
**Example target shape:**

```sql
create or replace function public.current_app_role()
returns text
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'app_role', 'player')
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select public.current_app_role() = 'admin'
$$;
```

### Pattern 2: Public Active Views Over Versioned Tables
**What:** Store rule versions in explicit tables; expose only active rows through views.
**When to use:** Player/game engine reads active rules, while admin manages draft/archive versions.

### Pattern 3: Audit by Mutation Type
**What:** Use triggers for regular admin CRUD on system-owned tables and RPCs for sensitive support/permission actions.
**When to use:** CRUD has enough context in row changes; sensitive operations need explicit operational context and redaction.
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Browser-side authorization | Role checks that unlock writes in JS | RLS policies using JWT claims | Browser code is inspectable and bypassable. |
| Admin secrets in frontend | `service_role` in local storage/env shipped to client | Normal anon key + RLS; service role only scripts | `service_role` bypasses RLS and must never reach the browser. |
| Draft/active rules in client filters | Client manually filters every rules table | Active views | Keeps game engine simple and consistent. |
| Audit only in UI actions | Logging in JavaScript handlers | DB triggers/RPCs | Direct table calls or future tools would skip UI logs. |
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Claim Drift
**What goes wrong:** Role changes are not reflected until a new token is issued.
**Why it happens:** JWTs are snapshots.
**How to avoid:** Phase 1 uses seed/migration setup only and documents refresh expectations; future role UI must force session refresh/re-login.
**Warning signs:** User was promoted but policies still behave as old role.

### Pitfall 2: Helper Recursion or RLS Lockout
**What goes wrong:** Role helper queries a table protected by policies that call the helper.
**Why it happens:** Circular RLS dependency.
**How to avoid:** Keep helper claim-based or ensure any role-source table/hook permissions are carefully separated.
**Warning signs:** Auth hook or policy fails with permission/recursion errors.

### Pitfall 3: Overexposed Admin Audit
**What goes wrong:** Logs capture full player state or sensitive personal data.
**Why it happens:** Generic before/after logging applied to player data.
**How to avoid:** Use full before/after only for catalog/config rows; use redacted payloads for player/permission actions.
**Warning signs:** Audit rows contain inventory/state snapshots unrelated to the support action.

### Pitfall 4: Generic JSON Rules Become Unvalidatable
**What goes wrong:** Rule data drifts into arbitrary shapes.
**Why it happens:** A single key/value settings table becomes the rules engine.
**How to avoid:** Use explicit domain tables with constraints and JSON only for domain-specific structured details.
**Warning signs:** Plans cannot write meaningful acceptance criteria for rule schema.
</common_pitfalls>

<open_questions>
## Open Questions

- Exact claim key name should be selected during implementation. Recommended: `app_role` plus possibly `app_roles` later if multi-role users become necessary.
- Whether self-hosted auth hook configuration requires a `config.toml` change in the current local stack should be verified by the executor against the installed Supabase CLI/config shape.
- Exact contract file location can be chosen by the executor; it should be canonical and linked from phase summary.
</open_questions>

## RESEARCH COMPLETE
