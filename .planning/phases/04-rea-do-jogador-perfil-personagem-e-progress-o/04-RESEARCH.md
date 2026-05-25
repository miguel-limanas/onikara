# Phase 4: Área do Jogador - Perfil, Personagem e Progressão - Research

**Date:** 2026-05-25
**Status:** Completed

## Scope

Phase 4 builds the first player-facing MVP slice in `/play`: player session handling, one-screen character creation, persisted profile state, character dashboard, inventory/equipment actions, spell visibility and quest state display.

The phase should stay outside combat orchestration. Combat sessions, turn events, victory/defeat and Realtime belong to Phase 5.

## Existing Foundation

- `public/index.html` is the portal/login entry and already imports `signInAdmin` from `src/services/adminAuth.js`.
- `scripts/serve-static.js` maps clean routes, currently `/` and `/admin`; Phase 4 should add `/play` without exposing `public/play.html` as the user-facing URL.
- `src/services/supabaseClient.js` centralizes Supabase JS, session persistence and friendly error normalization.
- `src/services/adminAuth.js` already reads `app_role` from Supabase session metadata and defaults to `player`.
- `src/admin/adminApp.js` is the closest shell pattern: boot guard, blocked/anonymous states, navigation, modular renderers and logout.
- `src/ui/components.js` provides shared helpers: `html`, `escapeHtml`, badges, loading/empty/error blocks and confirm dialog.
- `src/ui/formValidation.js` provides small validation helpers but currently has some unaccented Portuguese copy; player UI should use corrected PT-BR copy where new text is added.

## Supabase Data Model

Relevant tables already exist in `supabase/migrations/20260524031051_initial_rpg_schema.sql`:

- `profiles`: one profile per `auth.users.id`, with `character_name`, `level`, `xp`, `class_id`, `race_id`, `base_stats`, `current_state` and `settings`.
- `rpg_classes`: public catalog with `base_stats` and `scaling`.
- `rpg_races`: public catalog with `modifiers`.
- `spells` and `class_spells`: public catalog for class spell unlock levels.
- `inventory`: player-owned items, unique by `profile_id` + `item_id`.
- `equipment`: equipped inventory rows by slot, unique by `profile_id` + `slot` and by `inventory_id`.
- `character_quests`: player-owned quest status/progress.
- `quests` and `quest_steps`: public quest catalog.

RLS already allows users to read/insert/update their own `profiles`, and manage their own `character_spells`, `inventory`, `equipment`, `character_quests` and combat tables through `profiles.user_id = auth.uid()`.

## Implementation Findings

### Routing

The static server can serve clean player routes by extending `routeMap` and redirects:

- `/play` -> `/public/play.html`
- `/play.html` and `/public/play.html` -> `/play`

This preserves the user's requirement that the site be dynamic and not expose raw HTML filenames in navigation.

### Player Auth

Player auth should not reuse `requireAdminSession` because non-admin sessions are valid for `/play`. Recommended module:

- `src/services/playerAuth.js`
  - `getCurrentPlayerSession()`
  - `requirePlayerSession()`
  - `resolvePlayerDestination()` or equivalent helper for portal routing
  - `signOutPlayer()`

`getAppRole()` can remain shared from `adminAuth.js` or be moved only if necessary; do not introduce broad refactors during Phase 4 unless implementation demands it.

### Character Creation

Recommended module:

- `src/services/playerProfile.js`
  - load public classes/races.
  - load current profile by `user_id`.
  - compute preview stats as `class.base_stats + race.modifiers`.
  - create `profiles` row with `user_id`, `character_name`, `class_id`, `race_id`, calculated `base_stats`, and `current_state` initialized from stats.

Initial `current_state` should include at least current/max HP and mana, using stable key names documented by the implementation.

### Dashboard and State

Recommended modules:

- `src/player/playerApp.js`: boot, routing inside shell, logout, render mode selection.
- `src/player/player.css`: Onikara player HUD styling, using existing tokens where practical.
- `src/player/dashboardView.js`: profile, XP, HP, mana, attributes and state.

The dashboard should use `.planning/design-system/onikara_dashboard.html` as a visual reference but adapt it from campaign cards into a character HUD.

### Inventory, Equipment, Spells and Quests

Recommended service functions:

- load inventory with joined item catalog data.
- load equipment and map equipped `inventory_id`.
- equip item by inserting/upserting into `equipment` with a derived slot.
- unequip item by deleting relevant `equipment` row.
- load class spells with joined spell data and show locked/unlocked by `profile.level >= unlock_level`.
- load available quests and current `character_quests`, merging status for clear display.

The first version should avoid consumable usage, item discard, rewards, combat writes and advanced filters.

## Risks and Mitigations

- **Schema assumptions:** Joined Supabase selects can fail if relationship names are ambiguous. Mitigate by falling back to separate queries and client-side joins.
- **Equipment slot mapping:** `items.item_type` is coarser than `equipment.slot`. Mitigate with deterministic MVP slot mapping: `weapon -> main_hand`, `armor -> body`, `accessory -> accessory_1`; other item types are non-equippable.
- **Admin/player role confusion:** Player shell must accept both `player` and `admin` sessions as authenticated users only when loading own profile, but must never render admin controls.
- **Existing dirty worktree:** Phase execution must avoid reverting current uncommitted admin/landing edits and should scope commits to player files plus necessary routing changes.
- **Visual density:** Player UI can be expressive, but must preserve contrast, labels, focus and mobile readability.

## Recommended Plan Shape

1. `04-01`: route, player auth service, `/play` shell, onboarding and one-screen profile creation.
2. `04-02`: dashboard, derived stats/progression/mana state and player HUD responsive layout.
3. `04-03`: inventory/equipment actions, spell lock states and quest status display.

## Research Complete

The current schema and client patterns are sufficient for Phase 4 without introducing a backend service or service-role access. Planning can proceed with three sequential waves because each slice depends on the previous one creating the route, session and profile-loading foundation.
