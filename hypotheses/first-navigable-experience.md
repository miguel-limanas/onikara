# Hypotheses — First navigable experience

## Meta

- **Feature:** [knowledge/product/features/first-navigable-experience.md](../knowledge/product/features/first-navigable-experience.md)
- **Status:** active
- **Owner:** Founder/creator
- **Last updated:** 2026-05-24

## Value

### H-V1: A navigable admin/player slice is the next best validation step

- **Origin:** proactive
- **Confidence:** high
- **Evidence for:**
  - The founder identified the next big bet as turning the vision into a navigable, testable experience with player flow, admin/master flow, missions, hunter/Oni registration, and first real platform experience. `(chat, no artifact)`
  - The roadmap's product areas already define admin and player experiences as the two main surfaces. [source/planning/ROADMAP.md](../source/planning/ROADMAP.md)
- **Evidence against:**
  - No external users have validated the sequence yet. `(chat, no artifact)`
- **Open questions / caveats:**
  - Need to decide the smallest flow that proves value without requiring all combat/content systems.
- **Test:** Build a thin navigable slice and run task-based playtests.
- **Decision trigger:** Promote if testers can complete the slice and articulate why they would continue exploring.
- **Resolution:** Pending.

## Usability

### H-U1: Player and admin/master entry points must be understandable without explanation

- **Origin:** proactive
- **Confidence:** medium
- **Evidence for:**
  - The product explicitly separates administration from player interaction. [source/planning/PROJECT.md](../source/planning/PROJECT.md)
- **Evidence against:**
  - The "master/admin" framing may be novel and needs validation. `(chat, no artifact)`
- **Open questions / caveats:**
  - Is "master" a product role, narrative title, or future feature?
- **Test:** First-click test for each entry point.
- **Decision trigger:** Promote if testers understand their role and next action in under one minute.
- **Resolution:** Pending.

## Feasibility

### H-F1: The first navigable slice can be built as a vertical MVP across Supabase, UI, and domain state

- **Origin:** proactive
- **Confidence:** low
- **Evidence for:**
  - The implementation flow prefers vertical slices and avoiding generic infrastructure before a real flow uses it. [source/planning/IMPLEMENTATION_FLOW.md](../source/planning/IMPLEMENTATION_FLOW.md)
- **Evidence against:**
  - The slice depends on multiple phase areas: Supabase foundation, identity/design system, admin/player UI, and mission/player state. [source/planning/ROADMAP.md](../source/planning/ROADMAP.md)
- **Open questions / caveats:**
  - Needs careful slicing to avoid accidentally starting Phase 3/4/5 all at once.
- **Test:** Define one journey with explicit in-scope/out-of-scope boundaries before implementation.
- **Decision trigger:** Promote if one journey ships without expanding into full platform scope.
- **Resolution:** Pending.

## Viability

### H-Vi1: Early playtests can validate direction before scale, revenue, or public launch

- **Origin:** proactive
- **Confidence:** medium
- **Evidence for:**
  - Current scale is zero public users, no revenue, solo/small team, and prototype-to-MVP stage. `(chat, no artifact)`
- **Evidence against:**
  - Early friendly playtests may overestimate broader appeal. `(chat, no artifact)`
- **Open questions / caveats:**
  - Label early evidence as directional until it includes repeated independent testers.
- **Test:** Run small playtests with participant-type tags and preserve notes in `source/interviews/`.
- **Decision trigger:** Promote only after repeated signals from target-like testers.
- **Resolution:** Pending.

## Other risks

### H-O1: MVP scope may expand faster than validation

- **Origin:** proactive
- **Confidence:** high
- **Evidence for:**
  - Founder explicitly listed avoiding systems too complex before MVP as off-limits. `(chat, no artifact)`
  - Roadmap contains many rich systems across admin, player, combat, support, and identity. [source/planning/ROADMAP.md](../source/planning/ROADMAP.md)
- **Evidence against:**
  - The implementation flow includes gates for small increments, acceptance criteria, and verification. [source/planning/IMPLEMENTATION_FLOW.md](../source/planning/IMPLEMENTATION_FLOW.md)
- **Open questions / caveats:**
  - Each slice should name what is not being built.
- **Test:** Require out-of-scope list before implementation plans.
- **Decision trigger:** Promote if the first navigable slice remains small and testable.
- **Resolution:** Pending.
