# Strategy

> The north star. Loaded at the start of any prioritization, planning, or review task. Updated only deliberately; drift is surfaced, not silently absorbed.

## North-star metric

**Experiencia navegavel testavel do Onikara.**

Definition: percentage of critical MVP flows that a tester can complete end-to-end without agent/developer assistance: first viewport, player onboarding, admin/master entry point, mission view, and first combat-ready state.

Current value: 0 public users / 0 validated external playtests. Baseline still needs instrumentation.

## 1-2 quarter priorities

1. **Build the Supabase foundation for admin/player separation.** Why now: roles, RLS, auditability, config tables, and seeds are prerequisites for every real interface. Success: Phase 1 plans in the roadmap are implemented and verified. [source/planning/ROADMAP.md](../source/planning/ROADMAP.md)
2. **Turn Onikara identity into a usable design system.** Why now: the product must avoid feeling like a generic SaaS dashboard or a generic anime site. Success: tokens, components, first viewport, and admin/player visual distinction are validated for clarity. [source/planning/BRANDING_IDEAS.md](../source/planning/BRANDING_IDEAS.md)
3. **Create the first navigable admin/player experience.** Why now: the next learning step is whether the vision produces suspense, strategy, premium feel, and desire to explore. Success: a tester can navigate the first admin/master and player flows with clear state and intent. `(chat, no artifact)`

## Explicit non-goals

- Multiplayer online in the initial MVP. [source/planning/PROJECT.md](../source/planning/PROJECT.md)
- Realistic 3D graphics. [source/planning/PROJECT.md](../source/planning/PROJECT.md)
- Turning Onikara into a generic SaaS dashboard. `(chat, no artifact)`
- Over-indexing on anime intensity at the cost of strategic, premium, tactical clarity. `(chat, no artifact)`
- Adding complex systems before the MVP proves the core experience. `(chat, no artifact)`
- Blurring the separation between player, master/admin, and the operating system layer. `(chat, no artifact)`

## Bets vs. commitments

- **Bets** (testing): see [`hypotheses/`](../hypotheses/)
- **Commitments** (decided): see [`decisions/`](../decisions/)

## Last reviewed

2026-05-24

## Tensions

### T1: Admin density vs. fantasy identity

- **Signal:** Admin must be dense, operational, auditable, and efficient. [source/planning/ROADMAP.md](../source/planning/ROADMAP.md)
- **What it tensions:** The product must also feel unmistakably Onikara: dark fantasy, Oni, tactical, premium, not generic SaaS. `(chat, no artifact)`
- **Possible resolutions:** Keep admin layout restrained while using brand tokens, status language, iconography, and domain-specific information architecture.

### T2: Phase 1 foundation vs. desire for first viewport

- **Signal:** The roadmap starts with Supabase roles/RLS/governance before interfaces. [source/planning/ROADMAP.md](../source/planning/ROADMAP.md)
- **What it tensions:** The next desired learning is a navigable, testable first experience. `(chat, no artifact)`
- **Possible resolutions:** Let Phase 2 sketches continue in parallel, but gate persistent workflows behind Phase 1 security/data contracts.
