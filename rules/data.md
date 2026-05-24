# Data rules

> Source-of-truth per metric, naming conventions, what counts as evidence.

## Source of truth per metric

- MVP flow completion: not instrumented yet; future source should be app telemetry/Supabase events plus playtest notes.
- Character/combat/progression state: Supabase/Postgres once Phase 1 data contracts are implemented.
- Planning progress: `.planning/STATE.md` and `.planning/ROADMAP.md`.
- PM Brain synthesis: `knowledge/strategy.md`, `knowledge/product/metrics.md`, and linked hypotheses.

## Naming conventions

- Use domain-specific event names that preserve admin/player/master separation.
- Prefer stable slugs: `player_character_created`, `mission_viewed`, `combat_started`, `combat_completed`, `admin_catalog_updated`, `admin_rule_changed`.
- Segment tester feedback as `player`, `master-admin`, `collaborator`, or `clarity-tester` until real personas emerge.

## Evidence quality

What counts as evidence, by tier:

1. **Direct customer evidence** — quotes, interviews, support tickets, recorded behavior.
2. **Product analytics** — instrumented events, cohort behavior, funnel metrics.
3. **Stakeholder opinions** — internal but informed.
4. **Market / competitor signals** — directional, not definitive.
5. **Internal speculation** — lowest weight. Label as assumption.

## TODO

Define concrete event names during the first implemented player/admin slice.
