# TI4 Turn Helper — Design Spec

## Overview

Solo companion PWA for Twilight Imperium 4th Edition. Solves the core problem: forgetting passive abilities, tech effects, and action card timing during gameplay. User tracks what they own, app shows what's relevant per context.

## Tech Stack

- React + TypeScript (strict)
- Vite + PWA plugin
- CSS Modules
- IndexedDB (Dexie.js or idb)
- Vitest + React Testing Library
- Deploy: GitHub Pages
- No backend

## Core Loop

1. **New game** — pick expansions → pick faction
2. **During game** — add/remove techs, action cards, promissory notes, relics; toggle leader unlocks
3. **Context buttons** — tap to see filtered reminders grouped by timing
4. **Production calculator** — unit picker with cost/production summary

## Game Terminology & Hierarchy

Official TI4 terminology used throughout the app and data. These map to strict TypeScript enums.

### Phases

`strategy` | `action` | `status` | `agenda`

### Action Types (within action phase)

`tactical` | `strategic` | `component`

- **tactical** — activate system, then steps in order
- **strategic** — use primary or secondary of a strategy card
- **component** — play action cards, use tech abilities, purge relics, etc.

### Steps (within tactical action, in order)

`activation` → `movement` → `space_combat` → `invasion` → `production`

### Sub-steps

**space_combat sub-steps (in order):**
`space_cannon_offense` → `anti_fighter_barrage` → `announce_retreat` → `combat_rolls` → `assign_hits` → `retreat`

**invasion sub-steps (in order):**
`bombardment` → `commit_ground_forces` → `space_cannon_defense` → `ground_combat` → `establish_control`

**status phase steps (in order):**
`score_objectives` → `reveal_public_objective` → `draw_action_cards` → `remove_command_tokens` → `gain_redistribute_command_tokens` → `ready_cards` → `repair_units` → `return_strategy_cards`

### Timing (when within a step/sub-step)

`before` | `after` | `when` | `start` | `end` | `during`

### Misc Windows / Triggers

Some abilities trigger on specific game events outside the step hierarchy:
`refresh_commodities` | `trade` | `produce_unit` | `research_technology` | ... (TBD — defined fully in task 1)

## Data Model

### Unified PlayTiming

All displayable items (techs, action cards, faction abilities, promissory notes, leaders, unit abilities, mech abilities, relics) share this structure:

```typescript
// Phases
type Phase = "strategy" | "action" | "status" | "agenda"

// Action types
type ActionType = "tactical" | "strategic" | "component"

// Steps within tactical action
type TacticalStep = "activation" | "movement" | "space_combat" | "invasion" | "production"

// Sub-steps
type SpaceCombatSubStep = "space_cannon_offense" | "anti_fighter_barrage" | "announce_retreat" | "combat_rolls" | "assign_hits" | "retreat"
type InvasionSubStep = "bombardment" | "commit_ground_forces" | "space_cannon_defense" | "ground_combat" | "establish_control"
type StatusStep = "score_objectives" | "reveal_public_objective" | "draw_action_cards" | "remove_command_tokens" | "gain_redistribute_command_tokens" | "ready_cards" | "repair_units" | "return_strategy_cards"

// A window is a dot-path through the hierarchy
// e.g. "tactical.space_combat.anti_fighter_barrage"
// e.g. "tactical.production"
// e.g. "status.draw_action_cards"
// e.g. "agenda"
// Stored as a string but validated against the hierarchy
type Window = string

type Timing = "before" | "after" | "when" | "start" | "end" | "during"

// Misc triggers outside the hierarchy
type MiscTrigger = "refresh_commodities" | "trade" | string // TBD full list in task 1

interface PlayTiming {
  wording: string              // original card text for display
  window: Window               // dot-path: "tactical.space_combat.anti_fighter_barrage"
  timing: Timing
  mustBeActivePlayer: boolean
  miscTrigger?: MiscTrigger    // for events outside the step hierarchy
}
```

Items can have multiple `PlayTiming` entries (array). Passive effects (e.g. Sarween Tools) use `window: "tactical.production"` with `timing: "during"`.

All enums are strict TypeScript types — no arbitrary strings (except Window which is validated at build/test time against the hierarchy).

**Context buttons on the dashboard map to windows.** Tapping "Space Combat" shows everything with a window starting with `tactical.space_combat`. Tapping "Status Phase" shows everything under `status.*`. The dot-path hierarchy makes filtering a simple prefix match.

**Note:** existing `playTiming2` in action-cards.json uses different field names. This spec is canonical — existing data migrates to match.

### Omega / Replacement Cards

Codex expansions introduce omega versions of techs/cards that replace base versions. Data files use a `replaces` field. When an expansion is selected, omega versions automatically replace their base counterparts — user never sees both.

### Action Card Quantities

Action cards have a `count` field (copies in deck). Users can own multiple copies of the same card. The manage screen tracks quantity owned, not just presence.

### Faction Abilities & Mechs

Faction abilities and mech abilities are implicit — derived from `factionId`, always active, no separate tracking. They still carry `PlayTiming` and surface in context views. Mechs appear alongside other faction-specific reminders.

### Game State (IndexedDB)

```typescript
type Expansion = "base" | "pok" | "codex-1" | "codex-2" | "codex-3" | "codex-4"

interface Game {
  id: string
  name: string
  createdAt: Date
  expansions: Expansion[]
  factionId: string
  ownedTechIds: string[]
  ownedActionCards: { id: string, quantity: number }[]
  ownedPromissoryNoteIds: string[]
  ownedRelicIds: string[]
  leaderStates: Record<string, "locked" | "unlocked">
}
```

Multiple concurrent games supported.

## Screens

### Home
- List of games, create new, delete existing

### Game Setup
- Select expansions (Thunders Edge visible but greyed/disabled)
- Select faction

### Game Dashboard
- Grid of context buttons mapping to window prefixes:
  - **Movement** → `tactical.movement`
  - **Space Combat** → `tactical.space_combat` (shows all sub-steps grouped chronologically)
  - **Invasion** → `tactical.invasion` (shows all sub-steps grouped chronologically)
  - **Production** → `tactical.production`
  - **Agenda** → `agenda`
  - **Status Phase** → `status` (shows all steps grouped chronologically)
  - **Component Actions** → `component` (action cards, tech actions, relic purges)
- "Manage" button to add/remove items

### Manage Screen
- Global search box at top
- Category tabs: Techs, Action Cards, Promissory Notes, Relics, Leaders
- **Techs**: grouped by color, sorted by prerequisite count, toggleable. Unit upgrade techs included here — toggling them updates calculator unit stats.
- **Action Cards**: alphabetical list, tap to increment/decrement quantity owned
- **Promissory Notes**: includes both generic (Ceasefire, Support for the Throne, Trade Agreement, Political Secret) and faction-specific. Alphabetical, toggleable.
- **Relics**: alphabetical, toggleable
- **Leaders**: toggle lock/unlock state
- All items single-tap to toggle (except action cards: tap to adjust quantity)
- Faction starting techs pre-added at game creation

### Context View
- Reminders grouped by sub-step in chronological order (top to bottom as phase progresses)
- Each item shows: name, source type (tech/action card/faction/promissory/leader/relic/mech), timing wording, effect summary
- Only shows items that are owned AND unlocked AND relevant to this context
- Faction abilities + mech abilities always included (implicit from faction)
- Long-press any item → confirmation modal → removes from owned

### Production Calculator (within Production context view)
- Appears above the reminders (tool first, then the filtered reminder list)
- Unit picker: tap to add/remove producible unit types. Structures (PDS, space docks) are excluded — placed via Construction, not produced
- Tech-gated units (War Sun) are always listed but their stepper is disabled until the unlocking tech is owned
- Fighters/infantry are produced two-per-cost: a lone one still costs the whole pair, so odd counts round up
- Shows total cost with modifiers: Sarween Tools (−1, incl. the Ω variant) and AI Development Algorithm (optional toggle, −1 per owned unit-upgrade tech)
- Uses upgraded unit stats/name when the upgrade tech is owned (derived from ownedTechIds)

### Status Phase View
- Same grouped-reminder pattern, ordered by status phase steps:
  score_objectives → reveal_public_objective → draw_action_cards → remove_command_tokens → gain_redistribute_command_tokens → ready_cards → repair_units → return_strategy_cards
- Modifiers shown inline (e.g. Neural Motivator under draw_action_cards)

## Data Enrichment

All existing JSON files need review and enrichment:

- Add `PlayTiming` arrays to all item types
- Standardize structure across all item types
- Add generic promissory notes to data (currently missing)
- Unit data needs cost/production/combat values + upgraded variants for calculator
- Ensure `replaces` chains are correct for omega cards
- **Task 1 of implementation**: define full enum values for Window paths, Timing, and MiscTriggers by systematically reviewing all items and card text

Thunders Edge content: auto-filtered out, expansion option disabled in UI.

## Testing

- Vitest + React Testing Library for unit/component tests
- Manual browser testing for integration/UX
- No Playwright/E2E for MVP

## Out of Scope (MVP)

- Round/turn tracking
- Planet tracking / exhaustion
- Exploration cards (mostly planet value modifiers / one-time effects)
- Legendary planet abilities (requires planet tracking)
- Score/objective tracking
- Multi-user / multiplayer
- Backend / accounts
- Thunders Edge content
- Rule engine / conditional logic (future extension — data structure supports it)
