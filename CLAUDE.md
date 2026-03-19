# TI4 Turn Helper

Twilight Imperium 4 companion app — shows relevant abilities/cards at each game phase. PWA deployed to GitHub Pages.

## Commands

```bash
bun run dev          # Start dev server
bun run build        # tsc -b && vite build
bun run test         # vitest run
bunx tsc -b          # Type-check only
bun run deploy       # Build + push to gh-pages branch
```

## Tech Stack

- React 19, TypeScript (strict), Vite 8
- Dexie.js (IndexedDB) for game state
- CSS Modules for styling
- Vitest + React Testing Library + fake-indexeddb
- react-router-dom v7
- vite-plugin-pwa (auto-update service worker)
- bun (package manager — never npm)

## TypeScript

- `noUncheckedIndexedAccess: true` — array/record access returns `T | undefined`
- Separate `tsconfig.app.json` (src/) and `tsconfig.node.json` (vite/vitest configs)
- `vitest.config.ts` must be separate from `vite.config.ts` (mergeConfig pattern)

## Project Structure

```
src/
├── types/           # Enums, interfaces (Game, PlayTiming, items)
├── db/              # Dexie database, CRUD (game-store.ts)
├── data/            # JSON loaders, filterByExpansion, resolveOmegaReplacements
├── engine/          # Core logic: filterByContext, groupByWindow, resolveDisplayableItems, productionCalc
├── hooks/           # useGameContext (read), useManageGame (write)
├── components/      # ItemCard, TechList, ActionCardList, SearchBox, ProductionCalculator, etc.
├── screens/         # HomeScreen, SetupScreen, DashboardScreen, ContextViewScreen, ManageScreen
├── main.tsx         # Entry point
└── App.tsx          # Router
data/                # JSON game data (technologies, factions, action-cards, etc.)
docs/superpowers/
├── specs/           # Design spec (canonical feature reference)
└── plans/           # Implementation plan
```

## Routes

| Path | Screen | Purpose |
|------|--------|---------|
| `/` | HomeScreen | List/create games |
| `/setup` | SetupScreen | Pick expansions + faction |
| `/game/:gameId` | DashboardScreen | Context buttons grid |
| `/game/:gameId/context/:windowPrefix` | ContextViewScreen | Filtered items by phase |
| `/game/:gameId/manage` | ManageScreen | Add/remove owned items |

Base URL: `/ti-turn-helper/` (GitHub Pages subpath).

## Core Architecture

### PlayTiming System

Every item (tech, action card, faction ability, leader, mech, relic, promissory note) has `playTimings: PlayTiming[]`:

```typescript
interface PlayTiming {
  wording: string              // Display text
  window: string               // Dot-path like "tactical.space_combat.combat_rolls"
  timing: Timing               // "before" | "after" | "when" | "start" | "end" | "during"
  mustBeActivePlayer: boolean
  miscTrigger?: string
}
```

### Dot-Path Windows

Hierarchical game phase encoding. Examples:
- `status.draw_action_cards`
- `tactical.space_combat.anti_fighter_barrage`
- `tactical.invasion.ground_combat`

Full list in `src/types/enums.ts` → `VALID_WINDOWS` Set. ~40+ windows.

### Prefix Matching

`filterByContext(items, windowPrefix)` returns items where `window === prefix || window.startsWith(prefix + '.')`. Dashboard context buttons encode prefix as URL param. Tapping "Space Combat" shows all `tactical.space_combat.*` items.

### Data Pipeline

1. JSON files → loader functions (`src/data/load-*.ts`)
2. `filterByExpansion` → filter by game's expansion set
3. `resolveOmegaReplacements` → items with `replaces` field exclude predecessors
4. `resolveDisplayableItems` → merge all owned items into `DisplayableItem[]`
5. `filterByContext` → prefix-match by current window
6. `groupByWindow` → group + sort by `WINDOW_DISPLAY_ORDER`

### Game State (Dexie)

Single `games` table. Key fields:
- `expansions: Expansion[]` — base, pok, codex-1 through codex-4
- `factionId`, `ownedTechIds`, `ownedActionCards: {id, quantity}[]`
- `ownedPromissoryNoteIds`, `ownedRelicIds`
- `leaderStates: Record<string, "locked" | "unlocked">`

CRUD in `src/db/game-store.ts`. `createGame` auto-initializes faction starting techs + leader states.

### Key Patterns

- **Omega replacements**: Items with `replaces` auto-exclude predecessors. User never sees both.
- **Action card quantities**: `{id, quantity}` pairs — can hold multiple copies.
- **Leader lock/unlock**: Based on `unlockCondition`; "At Game Start" → unlocked, else locked. Togglable.
- **Faction implicit items**: Abilities + mech always shown (not add/removable like techs/cards).
- **Production calc**: Sarween Tools gives 1-unit discount. Unit stats upgrade when corresponding tech owned.

## Testing

- Tests in `__tests__/` subdirectories next to source
- `*.test.ts` / `*.test.tsx`
- `describe`/`it`/`expect` (globals enabled)
- `fake-indexeddb/auto` in setup for Dexie tests
- `@testing-library/jest-dom/vitest` for DOM matchers
