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

## Data Model

### Unified PlayTiming

All displayable items (techs, action cards, faction abilities, promissory notes, leaders, unit abilities, mech abilities, relics) share this structure:

```typescript
type Context = "produce" | "space-combat" | "ground-combat" | "bombardment" | "invasion" | "space-cannon" | "movement" | "agenda" | "status-phase" | "action"

// "window" = the specific step (e.g. anti-fighter barrage, bombardment step)
// "timing" = when within that window (start, during, end, after)
// Exact enum values TBD — defining these is implementation task 1

type Window = string   // TBD: e.g. "anti-fighter-barrage" | "assign-hits" | ...
type Timing = "start" | "during" | "end" | "after" | "when" | "instead"

interface PlayTiming {
  wording: string              // original card text for display
  context: Context[]
  window?: Window[]            // specific step within context
  timing?: Timing[]            // when within the window
  mustBeActivePlayer: boolean
}
```

Every displayable item carries one or more `PlayTiming` objects. Passive effects (e.g. Sarween Tools) use `timing: ["during"]` with no specific window.

All enums are strict TypeScript types — no arbitrary strings.

**Note:** existing `playTiming2` in action-cards.json uses different field names (`phase`/`window` instead of `context`/`timing`). This spec is canonical — existing data migrates to match.

### Omega / Replacement Cards

Codex expansions introduce omega versions of techs/cards that replace base versions. Data files use a `replaces` field. When an expansion is selected, omega versions automatically replace their base counterparts — user never sees both.

### Action Card Quantities

Action cards have a `count` field (copies in deck). Users can own multiple copies of the same card. The manage screen tracks quantity owned, not just presence.

### Faction Abilities & Mechs

Faction abilities and mech abilities are implicit — derived from `factionId`, always active, no separate tracking. They still carry `PlayTiming` and surface in context views. Mechs appear alongside other faction-specific reminders.

### Game State (IndexedDB)

```typescript
interface Game {
  id: string
  name: string
  createdAt: Date
  expansions: Expansion[]      // "base" | "pok" | "codex-1" | "codex-2" | "codex-3" | "codex-4"
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
- Grid of context buttons: Produce, Space Combat, Ground Combat, Invasion, Space Cannon, Bombardment, Movement, Agenda, Status Phase
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
- Reminders grouped by window in chronological order (top to bottom as phase progresses)
- Each item shows: name, source type (tech/action card/faction/promissory/leader/relic/mech), timing wording, effect summary
- Only shows items that are owned AND unlocked AND relevant to this context
- Faction abilities + mech abilities always included (implicit from faction)
- Long-press any item → confirmation modal → removes from owned

### Production Calculator (within Produce context view)
- Appears below reminders (consistent: reminders always first, tools below)
- Unit picker: tap to add/remove unit types
- Shows: total cost (with modifiers applied), production capacity required
- Uses upgraded unit stats when upgrade tech is owned (derived from ownedTechIds)

### Status Phase View
- Same grouped-reminder pattern but ordered by status phase steps:
  score objectives → draw action cards → gain CCs → ready cards → repair → return strategy cards
- Modifiers shown inline (e.g. Neural Motivator under "draw action cards")

## Data Enrichment

All existing JSON files need review and enrichment:

- Add `PlayTiming` objects to all item types
- Standardize structure across all item types
- Add generic promissory notes to data (currently missing)
- Unit data needs cost/production/combat values + upgraded variants for calculator
- Ensure `replaces` chains are correct for omega cards
- **Task 1 of implementation**: define exact enum values for Context/Window/Timing by systematically reviewing all items

Thunders Edge content: auto-filtered out, expansion option disabled in UI.

Exploration cards: out of scope for MVP (most are one-time effects, not persistent reminders).

## Testing

- Vitest + React Testing Library for unit/component tests
- Manual browser testing for integration/UX
- No Playwright/E2E for MVP

## Out of Scope (MVP)

- Round/turn tracking
- Planet tracking / exhaustion
- Score/objective tracking
- Multi-user / multiplayer
- Backend / accounts
- Thunders Edge content
- Exploration cards
- Rule engine / conditional logic (future extension — data structure supports it)
- Strategy phase reminders
