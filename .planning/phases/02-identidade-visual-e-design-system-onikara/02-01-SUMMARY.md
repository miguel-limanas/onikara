---
phase: 02-identidade-visual-e-design-system-onikara
plan: 01
status: completed
completed_at: 2026-05-24
subsystem: design-system-brand
tags:
  - brand
  - logo
  - assets
  - design-system
provides:
  - Onikara brand guide
  - minimum asset kit inventory
  - official logo copy for design-system previews
requirements_completed:
  - identidade visual
---

# 02-01 Summary: Onikara Brand Foundation

## Completed

- Created `.planning/design-system/BRAND.md` with the official logo source, brand personality, color direction, typography direction, mode expression, logo usage rules, do/do-not guidance and out-of-scope boundaries.
- Created `.planning/design-system/assets/README.md` documenting the minimum asset kit and required future asset names.
- Copied `.planning/sketches/onikara-logotipo.png` into `.planning/design-system/assets/onikara-logotipo.png`.

## Key Decisions Captured

- The canonical logo source remains `.planning/sketches/onikara-logotipo.png`.
- The logo is treated as an institutional seal, not decorative wallpaper.
- The base palette is black, crimson and old gold; graphite is only a supporting technical neutral.
- Typography direction uses the brand serif for identity/authority and an operational sans for dense UI.
- Admin, player and master are all first-class visual modes for Phase 2.

## Verification

- `rg -n "Official Logo|onikara-logotipo.png|black|crimson|old gold|Admin|Player|Master|institutional seal" .planning/design-system/BRAND.md`
- `Test-Path .planning/design-system/assets/onikara-logotipo.png`
- `rg -n "onikara-symbol.png|onikara-logo-mono.png|favicon.png|app-icon.png|source of truth|monochrome|isolated symbol" .planning/design-system/assets/README.md`

All checks passed.
