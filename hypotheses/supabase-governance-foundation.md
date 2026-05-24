# Hypotheses — Supabase governance foundation

## Meta

- **Feature:** [knowledge/product/features/supabase-governance-foundation.md](../knowledge/product/features/supabase-governance-foundation.md)
- **Status:** active
- **Owner:** Founder/creator
- **Last updated:** 2026-05-24

## Value

### H-V1: Secure Supabase governance is a prerequisite for a credible admin/player MVP

- **Origin:** proactive
- **Confidence:** medium
- **Evidence for:**
  - The roadmap requires roles, RLS, auditability, config tables, and seeds before admin/player workflows become safe to build. [source/planning/ROADMAP.md](../source/planning/ROADMAP.md)
  - Requirements include admin roles, audit logs, versioned configuration, and operational metrics. [source/planning/REQUIREMENTS.md](../source/planning/REQUIREMENTS.md)
- **Evidence against:**
  - No real admin/player users have validated that governance work is the highest-value first visible slice. `(chat, no artifact)`
- **Open questions / caveats:**
  - How much governance is enough before Phase 2/first viewport work can safely proceed in parallel?
- **Test:** Complete Phase 1 and verify a player/admin separation scenario with seed data.
- **Decision trigger:** Promote when RLS/audit/config can support a real admin/player slice without service-key leakage.
- **Resolution:** Pending.

## Usability

### H-U1: Data contracts will reduce confusion during UI implementation

- **Origin:** proactive
- **Confidence:** low
- **Evidence for:**
  - Phase 1 explicitly includes Supabase JS access contracts for shared admin/player modules. [source/planning/ROADMAP.md](../source/planning/ROADMAP.md)
- **Evidence against:**
  - No UI implementation has consumed the contracts yet. `(chat, no artifact)`
- **Open questions / caveats:**
  - Contract naming must preserve domain clarity for player, master/admin, and system layers.
- **Test:** Implement one admin catalog read/write and one player read flow through the contracts.
- **Decision trigger:** Promote if the same contract layer supports both flows cleanly.
- **Resolution:** Pending.

## Feasibility

### H-F1: Existing Supabase base can support the MVP without a custom API first

- **Origin:** proactive
- **Confidence:** medium
- **Evidence for:**
  - The roadmap directs the project to use Supabase Auth, Postgres, RLS, PostgREST, Realtime, Storage, migrations, and seed before creating custom services. [source/planning/ROADMAP.md](../source/planning/ROADMAP.md)
- **Evidence against:**
  - No completed Phase 1 verification exists yet. `(chat, no artifact)`
- **Open questions / caveats:**
  - Edge Functions may still be needed for sensitive game operations later.
- **Test:** Implement Phase 1 plans using Supabase primitives only unless a concrete blocker appears.
- **Decision trigger:** Promote if Phase 1 ships without needing a custom backend service.
- **Resolution:** Pending.

## Viability

### H-Vi1: Governance-first sequencing prevents expensive rework

- **Origin:** proactive
- **Confidence:** low
- **Evidence for:**
  - Admin/player separation, RLS, and audit are explicit roadmap success criteria before later admin/player UI phases. [source/planning/ROADMAP.md](../source/planning/ROADMAP.md)
- **Evidence against:**
  - The founder also needs visible/navigable progress to validate the product direction. `(chat, no artifact)`
- **Open questions / caveats:**
  - Over-investing in backend before a first visible slice could slow learning.
- **Test:** Timebox Phase 1 and allow Phase 2 sketch/design work in parallel after security boundaries are clear.
- **Decision trigger:** Promote if Phase 1 unlocks Phase 3/4 without substantial schema/security rework.
- **Resolution:** Pending.

## Other risks

### H-O1: Security decisions made too casually could compromise future trust

- **Origin:** proactive
- **Confidence:** medium
- **Evidence for:**
  - Admin role security and RLS are explicit requirements. [source/planning/REQUIREMENTS.md](../source/planning/REQUIREMENTS.md)
- **Evidence against:**
  - No production users/data exist yet. `(chat, no artifact)`
- **Open questions / caveats:**
  - Need verification scenarios for role escalation and private player data.
- **Test:** Add UAT/security checks for admin writes, public catalog reads, and private player reads.
- **Decision trigger:** Promote when verification catches these paths.
- **Resolution:** Pending.
