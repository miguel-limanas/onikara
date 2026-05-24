# Hypotheses — First operational viewport

## Meta

- **Feature:** [knowledge/product/features/first-operational-viewport.md](../knowledge/product/features/first-operational-viewport.md)
- **Status:** active
- **Owner:** Founder/creator
- **Last updated:** 2026-05-24

## Value

### H-V1: The first viewport can communicate Onikara's premise before full gameplay exists

- **Origin:** proactive
- **Confidence:** low
- **Evidence for:**
  - Existing sketch work explores the first operational Oni viewport and admin/player/master modes. [source/planning/sketches/001-primeiro-viewport-operacional-oni/README.md](../source/planning/sketches/001-primeiro-viewport-operacional-oni/README.md)
  - The founder wants the direction to transmit suspense, strategy, premium identity, and desire to explore. `(chat, no artifact)`
- **Evidence against:**
  - No tester has validated the viewport yet. `(chat, no artifact)`
- **Open questions / caveats:**
  - A beautiful first viewport is not enough if users cannot infer what actions exist.
- **Test:** Ask testers what they think Onikara is, what role they are in, and what they would click next.
- **Decision trigger:** Promote if at least three target testers infer the core premise and next action without explanation.
- **Resolution:** Pending.

## Usability

### H-U1: Admin/player/master mode framing will reduce ambiguity

- **Origin:** proactive
- **Confidence:** low
- **Evidence for:**
  - The roadmap separates `/admin`, `/play`, `/auth`, and shared layers. [source/planning/ROADMAP.md](../source/planning/ROADMAP.md)
- **Evidence against:**
  - First viewport mode labels may add cognitive load if presented too early. `(chat, no artifact)`
- **Open questions / caveats:**
  - Need to decide whether "master" is a visible role, a flavor layer, or synonymous with admin.
- **Test:** Compare mode labels in sketch review.
- **Decision trigger:** Promote if users can explain the difference between player and admin/master.
- **Resolution:** Pending.

## Feasibility

### H-F1: A static sketch can be converted into a navigable prototype without waiting for full backend

- **Origin:** proactive
- **Confidence:** medium
- **Evidence for:**
  - Current sketch artifacts already exist as HTML/CSS under `.planning/sketches`. [source/planning/sketches/MANIFEST.md](../source/planning/sketches/MANIFEST.md)
- **Evidence against:**
  - Persistent flows still depend on Supabase governance and contracts. [source/planning/ROADMAP.md](../source/planning/ROADMAP.md)
- **Open questions / caveats:**
  - Use fake/demo state only where it does not imply shipped functionality.
- **Test:** Convert the winning sketch into a small navigable prototype with clear demo-state labels.
- **Decision trigger:** Promote if prototype can support review/playtest without backend coupling.
- **Resolution:** Pending.

## Viability

### H-Vi1: First-viewport validation should happen before large UI implementation

- **Origin:** proactive
- **Confidence:** medium
- **Evidence for:**
  - The implementation flow asks what problem/opportunity is being attacked and what the smallest testable increment is before coding large features. [source/planning/IMPLEMENTATION_FLOW.md](../source/planning/IMPLEMENTATION_FLOW.md)
- **Evidence against:**
  - Too much sketching could delay functional MVP work. `(chat, no artifact)`
- **Open questions / caveats:**
  - Timebox sketch review and route results back into Phase 2/3/4.
- **Test:** Run one structured review and make a decision.
- **Decision trigger:** Promote if review changes or confirms the first navigable experience scope.
- **Resolution:** Pending.

## Other risks

### H-O1: Storytelling may become decorative instead of operational

- **Origin:** proactive
- **Confidence:** medium
- **Evidence for:**
  - The founder wants storytelling, strategic tone, and a system-operating concept, not just surface styling. `(chat, no artifact)`
- **Evidence against:**
  - Roadmap ties UI direction to concrete admin/player flows. [source/planning/ROADMAP.md](../source/planning/ROADMAP.md)
- **Open questions / caveats:**
  - Every lore label should help the user understand role, state, or consequence.
- **Test:** During review, ask which text helps action vs. which is merely flavor.
- **Decision trigger:** Promote if the viewport's narrative framing improves orientation.
- **Resolution:** Pending.
