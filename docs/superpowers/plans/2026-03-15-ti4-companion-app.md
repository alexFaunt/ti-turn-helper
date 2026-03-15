# TI4 Turn Helper Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a solo TI4 companion PWA that shows contextual reminders (techs, abilities, action cards, relics) filtered by game phase/step, with a production calculator.

**Architecture:** React SPA with client-side IndexedDB persistence. Static JSON game data bundled at build time, enriched with PlayTiming metadata. Context buttons filter owned items by dot-path window prefix and group by sub-step chronologically.

**Tech Stack:** React 19, TypeScript (strict), Vite, CSS Modules, Dexie.js (IndexedDB), Vitest, React Testing Library, React Router

**Spec:** `docs/superpowers/specs/2026-03-11-ti4-companion-app-design.md`

---

## Chunk 1: Project Foundation & Type System

### Task 1: Scaffold Vite + React + TypeScript project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/App.module.css`

- [ ] **Step 1: Scaffold project**

```bash
cd /Users/alexfaunt/dev/ti-turn-helper
npm create vite@latest . -- --template react-ts
```

If prompted about existing files, allow overwrite of config only (data/ dir should be preserved).

- [ ] **Step 2: Install dependencies**

```bash
npm install react-router-dom dexie
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 3: Configure vitest**

Add to `vite.config.ts`:

```typescript
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
  },
})
```

Create `src/test-setup.ts`:

```typescript
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 4: Configure strict TypeScript**

Ensure `tsconfig.app.json` has:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

- [ ] **Step 5: Verify it runs**

```bash
npm run dev
```

Open in browser, confirm React default page loads.

- [ ] **Step 6: Run tests**

```bash
npx vitest run
```

Should pass (or no tests found yet — that's fine).

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "scaffold vite react ts project"
```

---

### Task 2: Define game terminology enums & PlayTiming types

**Files:**
- Create: `src/types/enums.ts`
- Create: `src/types/play-timing.ts`
- Create: `src/types/index.ts`
- Test: `src/types/__tests__/enums.test.ts`

- [ ] **Step 1: Write enum validation tests**

Create `src/types/__tests__/enums.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import {
  PHASES,
  ACTION_TYPES,
  TACTICAL_STEPS,
  SPACE_COMBAT_SUB_STEPS,
  INVASION_SUB_STEPS,
  STATUS_STEPS,
  TIMINGS,
  VALID_WINDOWS,
  isValidWindow,
} from '../enums'

describe('enums', () => {
  it('phases are ordered', () => {
    expect(PHASES).toEqual(['strategy', 'action', 'status', 'agenda'])
  })

  it('tactical steps are ordered', () => {
    expect(TACTICAL_STEPS).toEqual([
      'activation', 'movement', 'space_combat', 'invasion', 'production',
    ])
  })

  it('space combat sub-steps are ordered', () => {
    expect(SPACE_COMBAT_SUB_STEPS).toEqual([
      'space_cannon_offense', 'anti_fighter_barrage', 'announce_retreat',
      'combat_rolls', 'assign_hits', 'retreat',
    ])
  })

  it('invasion sub-steps are ordered', () => {
    expect(INVASION_SUB_STEPS).toEqual([
      'bombardment', 'commit_ground_forces', 'space_cannon_defense',
      'ground_combat', 'establish_control',
    ])
  })

  it('status steps are ordered', () => {
    expect(STATUS_STEPS).toEqual([
      'score_objectives', 'reveal_public_objective', 'draw_action_cards',
      'remove_command_tokens', 'gain_redistribute_command_tokens',
      'ready_cards', 'repair_units', 'return_strategy_cards',
    ])
  })

  describe('isValidWindow', () => {
    it('accepts valid dot-paths', () => {
      expect(isValidWindow('tactical.space_combat.anti_fighter_barrage')).toBe(true)
      expect(isValidWindow('tactical.production')).toBe(true)
      expect(isValidWindow('tactical.movement')).toBe(true)
      expect(isValidWindow('status.draw_action_cards')).toBe(true)
      expect(isValidWindow('agenda')).toBe(true)
      expect(isValidWindow('tactical.invasion.bombardment')).toBe(true)
    })

    it('rejects invalid dot-paths', () => {
      expect(isValidWindow('tactical.combat')).toBe(false)
      expect(isValidWindow('banana')).toBe(false)
      expect(isValidWindow('tactical.space_combat.banana')).toBe(false)
      expect(isValidWindow('')).toBe(false)
    })
  })
})
```

- [ ] **Step 2: Run test — confirm it fails**

```bash
npx vitest run src/types/__tests__/enums.test.ts
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Implement enums**

Create `src/types/enums.ts`:

```typescript
export const PHASES = ['strategy', 'action', 'status', 'agenda'] as const
export type Phase = (typeof PHASES)[number]

export const ACTION_TYPES = ['tactical', 'strategic', 'component'] as const
export type ActionType = (typeof ACTION_TYPES)[number]

export const TACTICAL_STEPS = [
  'activation', 'movement', 'space_combat', 'invasion', 'production',
] as const
export type TacticalStep = (typeof TACTICAL_STEPS)[number]

export const SPACE_COMBAT_SUB_STEPS = [
  'space_cannon_offense', 'anti_fighter_barrage', 'announce_retreat',
  'combat_rolls', 'assign_hits', 'retreat',
] as const
export type SpaceCombatSubStep = (typeof SPACE_COMBAT_SUB_STEPS)[number]

export const INVASION_SUB_STEPS = [
  'bombardment', 'commit_ground_forces', 'space_cannon_defense',
  'ground_combat', 'establish_control',
] as const
export type InvasionSubStep = (typeof INVASION_SUB_STEPS)[number]

export const STATUS_STEPS = [
  'score_objectives', 'reveal_public_objective', 'draw_action_cards',
  'remove_command_tokens', 'gain_redistribute_command_tokens',
  'ready_cards', 'repair_units', 'return_strategy_cards',
] as const
export type StatusStep = (typeof STATUS_STEPS)[number]

export const TIMINGS = ['before', 'after', 'when', 'start', 'end', 'during'] as const
export type Timing = (typeof TIMINGS)[number]

export const EXPANSIONS = ['base', 'pok', 'codex-1', 'codex-2', 'codex-3', 'codex-4'] as const
export type Expansion = (typeof EXPANSIONS)[number]

// Valid window dot-paths — built from the hierarchy
const TOP_LEVEL_WINDOWS = ['strategy', 'agenda'] as const

function buildValidWindows(): Set<string> {
  const windows = new Set<string>()

  // Top-level phases that are windows
  for (const w of TOP_LEVEL_WINDOWS) windows.add(w)

  // Status steps
  for (const step of STATUS_STEPS) windows.add(`status.${step}`)
  windows.add('status')

  // Tactical action steps
  for (const step of TACTICAL_STEPS) {
    windows.add(`tactical.${step}`)
  }
  windows.add('tactical')

  // Space combat sub-steps
  for (const sub of SPACE_COMBAT_SUB_STEPS) {
    windows.add(`tactical.space_combat.${sub}`)
  }

  // Invasion sub-steps
  for (const sub of INVASION_SUB_STEPS) {
    windows.add(`tactical.invasion.${sub}`)
  }

  // Component action
  windows.add('component')

  // Strategic action
  windows.add('strategic')

  return windows
}

export const VALID_WINDOWS = buildValidWindows()

export function isValidWindow(window: string): boolean {
  return VALID_WINDOWS.has(window)
}

// Ordered list for display — sub-steps in chronological order within their parent
export const WINDOW_DISPLAY_ORDER: readonly string[] = [
  'tactical',
  'tactical.activation',
  'tactical.movement',
  'tactical.space_combat',
  'tactical.space_combat.space_cannon_offense',
  'tactical.space_combat.anti_fighter_barrage',
  'tactical.space_combat.announce_retreat',
  'tactical.space_combat.combat_rolls',
  'tactical.space_combat.assign_hits',
  'tactical.space_combat.retreat',
  'tactical.invasion',
  'tactical.invasion.bombardment',
  'tactical.invasion.commit_ground_forces',
  'tactical.invasion.space_cannon_defense',
  'tactical.invasion.ground_combat',
  'tactical.invasion.establish_control',
  'tactical.production',
  'strategy',
  'agenda',
  'status',
  'status.score_objectives',
  'status.reveal_public_objective',
  'status.draw_action_cards',
  'status.remove_command_tokens',
  'status.gain_redistribute_command_tokens',
  'status.ready_cards',
  'status.repair_units',
  'status.return_strategy_cards',
  'component',
  'strategic',
] as const
```

- [ ] **Step 4: Run tests — confirm pass**

```bash
npx vitest run src/types/__tests__/enums.test.ts
```

Expected: PASS

- [ ] **Step 5: Implement PlayTiming and item types**

Create `src/types/play-timing.ts`:

```typescript
import type { Timing } from './enums'

export interface PlayTiming {
  wording: string
  window: string        // validated dot-path
  timing: Timing
  mustBeActivePlayer: boolean
  miscTrigger?: string  // for events outside the step hierarchy
}

// Source type labels for display
export const ITEM_SOURCE_TYPES = [
  'tech', 'action_card', 'faction_ability', 'promissory_note',
  'leader', 'relic', 'mech', 'unit_ability',
] as const
export type ItemSourceType = (typeof ITEM_SOURCE_TYPES)[number]

// Unified interface for anything displayable in context views
export interface DisplayableItem {
  id: string
  name: string
  description: string
  sourceType: ItemSourceType
  playTimings: PlayTiming[]
}
```

- [ ] **Step 6: Create barrel export**

Create `src/types/index.ts`:

```typescript
export * from './enums'
export * from './play-timing'
```

- [ ] **Step 7: Commit**

```bash
git add src/types/ && git commit -m "add game terminology enums and PlayTiming types"
```

---

### Task 3: Game state types & data item interfaces

**Files:**
- Create: `src/types/game.ts`
- Create: `src/types/items.ts`

- [ ] **Step 1: Define item interfaces**

Create `src/types/items.ts`:

```typescript
import type { Expansion } from './enums'
import type { PlayTiming } from './play-timing'

export interface Technology {
  id: string
  name: string
  type: 'color' | 'unit-upgrade'
  color?: 'green' | 'blue' | 'red' | 'yellow'
  prerequisites: string[]
  description: string
  source: Expansion | string
  replaces?: string
  faction?: string
  playTimings?: PlayTiming[]
  // Unit upgrade fields (when type === 'unit-upgrade')
  unitType?: string
  upgradedStats?: {
    cost?: number
    combat?: number
    move?: number
    capacity?: number
    abilities?: string[]
  }
}

export interface ActionCard {
  id: string
  name: string
  description: string
  playTiming: string      // legacy string
  count: number
  source: Expansion | string
  playTimings?: PlayTiming[]
}

export interface Faction {
  id: string
  name: string
  abilities: FactionAbility[]
  startingTech: string[]
  startingUnits: Record<string, number>
  commodities: number
  leaders: FactionLeader[]
  mech: FactionMech
  promissoryNote: PromissoryNote
  source: Expansion | string
}

export interface FactionAbility {
  name: string
  description: string
  playTimings?: PlayTiming[]
}

export interface FactionLeader {
  type: 'agent' | 'commander' | 'hero'
  name: string
  title: string
  ability: string
  unlockCondition: string
  playTimings?: PlayTiming[]
}

export interface FactionMech {
  name: string
  description: string
  playTimings?: PlayTiming[]
}

export interface PromissoryNote {
  id: string
  name: string
  description: string
  faction?: string
  source: Expansion | string
  replaces?: string
  playTimings?: PlayTiming[]
}

export interface Relic {
  id: string
  name: string
  description: string
  source: Expansion | string
  playTimings?: PlayTiming[]
}

export interface Unit {
  id: string
  name: string
  type: string
  cost?: number
  combat?: number
  move?: number
  capacity?: number
  abilities?: string[]
  source: Expansion | string
}
```

- [ ] **Step 2: Define game state interface**

Create `src/types/game.ts`:

```typescript
import type { Expansion } from './enums'

export interface OwnedActionCard {
  id: string
  quantity: number
}

export type LeaderState = 'locked' | 'unlocked'

export interface Game {
  id: string
  name: string
  createdAt: Date
  expansions: Expansion[]
  factionId: string
  ownedTechIds: string[]
  ownedActionCards: OwnedActionCard[]
  ownedPromissoryNoteIds: string[]
  ownedRelicIds: string[]
  leaderStates: Record<string, LeaderState>
}
```

- [ ] **Step 3: Update barrel export**

Update `src/types/index.ts` to also export from `./game` and `./items`.

- [ ] **Step 4: Commit**

```bash
git add src/types/ && git commit -m "add game state and item type interfaces"
```

---

### Task 4: Data loading layer

**Files:**
- Create: `src/data/load-technologies.ts`
- Create: `src/data/load-action-cards.ts`
- Create: `src/data/load-factions.ts`
- Create: `src/data/load-promissory-notes.ts`
- Create: `src/data/load-relics.ts`
- Create: `src/data/load-units.ts`
- Create: `src/data/filter-by-expansion.ts`
- Create: `src/data/index.ts`
- Test: `src/data/__tests__/filter-by-expansion.test.ts`

- [ ] **Step 1: Write filter tests**

Create `src/data/__tests__/filter-by-expansion.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { filterByExpansion, resolveOmegaReplacements } from '../filter-by-expansion'
import type { Expansion } from '../../types'

const mockItems = [
  { id: 'base-item', name: 'Base', source: 'base' },
  { id: 'pok-item', name: 'PoK', source: 'pok' },
  { id: 'codex-1-item', name: 'Codex', source: 'codex-1' },
  { id: 'thunders-edge-item', name: 'TE', source: 'thunders-edge' },
]

const mockOmegaItems = [
  { id: 'tech-base', name: 'Tech', source: 'base' },
  { id: 'tech-omega', name: 'Tech Ω', source: 'codex-1', replaces: 'tech-base' },
  { id: 'tech-omega-omega', name: 'Tech ΩΩ', source: 'codex-4', replaces: 'tech-omega' },
]

describe('filterByExpansion', () => {
  it('filters to selected expansions only', () => {
    const result = filterByExpansion(mockItems, ['base'])
    expect(result.map(i => i.id)).toEqual(['base-item'])
  })

  it('includes multiple expansions', () => {
    const result = filterByExpansion(mockItems, ['base', 'pok'])
    expect(result.map(i => i.id)).toEqual(['base-item', 'pok-item'])
  })

  it('always excludes thunders-edge', () => {
    const all: Expansion[] = ['base', 'pok', 'codex-1', 'codex-2', 'codex-3', 'codex-4']
    const result = filterByExpansion(mockItems, all)
    expect(result.find(i => i.id === 'thunders-edge-item')).toBeUndefined()
  })
})

describe('resolveOmegaReplacements', () => {
  it('replaces base with omega when codex selected', () => {
    const result = resolveOmegaReplacements(mockOmegaItems, ['base', 'codex-1'])
    expect(result.map(i => i.id)).toEqual(['tech-omega'])
  })

  it('keeps base when no codex selected', () => {
    const result = resolveOmegaReplacements(mockOmegaItems, ['base'])
    expect(result.map(i => i.id)).toEqual(['tech-base'])
  })

  it('chains omega replacements', () => {
    const result = resolveOmegaReplacements(mockOmegaItems, ['base', 'codex-1', 'codex-4'])
    expect(result.map(i => i.id)).toEqual(['tech-omega-omega'])
  })
})
```

- [ ] **Step 2: Run test — confirm fail**

```bash
npx vitest run src/data/__tests__/filter-by-expansion.test.ts
```

- [ ] **Step 3: Implement filter-by-expansion**

Create `src/data/filter-by-expansion.ts`:

```typescript
import type { Expansion } from '../types'

interface HasSource {
  id: string
  source: string
  replaces?: string
}

export function filterByExpansion<T extends HasSource>(
  items: T[],
  expansions: Expansion[],
): T[] {
  const expansionSet = new Set<string>(expansions)
  return items.filter(item => expansionSet.has(item.source))
}

export function resolveOmegaReplacements<T extends HasSource>(
  items: T[],
  expansions: Expansion[],
): T[] {
  // First filter to selected expansions
  const available = filterByExpansion(items, expansions)

  // Build a set of IDs that are replaced by something in the available set
  const replacedIds = new Set<string>()
  for (const item of available) {
    if (item.replaces) {
      replacedIds.add(item.replaces)
    }
  }

  // Remove replaced items
  return available.filter(item => !replacedIds.has(item.id))
}
```

- [ ] **Step 4: Run test — confirm pass**

```bash
npx vitest run src/data/__tests__/filter-by-expansion.test.ts
```

- [ ] **Step 5: Create data loaders**

Create `src/data/load-technologies.ts`:

```typescript
import type { Technology } from '../types'
import rawTechnologies from '../../data/technologies.json'

export function loadTechnologies(): Technology[] {
  return rawTechnologies as Technology[]
}
```

Create similar files for each data type:
- `src/data/load-action-cards.ts` → imports from `../../data/action-cards.json`, returns `ActionCard[]`
- `src/data/load-factions.ts` → imports from `../../data/factions.json`, returns `Faction[]`
- `src/data/load-promissory-notes.ts` → imports from `../../data/promissory-notes.json`, returns `PromissoryNote[]`
- `src/data/load-relics.ts` → imports from `../../data/relics.json`, returns `Relic[]`
- `src/data/load-units.ts` → imports from `../../data/units.json`, returns `Unit[]`

Each follows the same pattern. Vite handles JSON imports natively.

- [ ] **Step 6: Create barrel export**

Create `src/data/index.ts`:

```typescript
export { loadTechnologies } from './load-technologies'
export { loadActionCards } from './load-action-cards'
export { loadFactions } from './load-factions'
export { loadPromissoryNotes } from './load-promissory-notes'
export { loadRelics } from './load-relics'
export { loadUnits } from './load-units'
export { filterByExpansion, resolveOmegaReplacements } from './filter-by-expansion'
```

- [ ] **Step 7: Verify JSON imports compile**

```bash
npx tsc --noEmit
```

Note: may need to add `"resolveJsonModule": true` to tsconfig if not already set.

- [ ] **Step 8: Commit**

```bash
git add src/data/ && git commit -m "add data loading layer with expansion filter and omega resolution"
```

---

### Task 5: Context filtering engine

**Files:**
- Create: `src/engine/filter-by-context.ts`
- Create: `src/engine/group-by-window.ts`
- Create: `src/engine/resolve-displayable-items.ts`
- Create: `src/engine/index.ts`
- Test: `src/engine/__tests__/filter-by-context.test.ts`
- Test: `src/engine/__tests__/group-by-window.test.ts`
- Test: `src/engine/__tests__/resolve-displayable-items.test.ts`

This is the core brain of the app — takes owned items + a context button press → returns grouped, ordered reminders.

- [ ] **Step 1: Write filter-by-context tests**

Create `src/engine/__tests__/filter-by-context.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { filterByContext } from '../filter-by-context'
import type { DisplayableItem } from '../../types'

const items: DisplayableItem[] = [
  {
    id: 'sarween',
    name: 'Sarween Tools',
    description: 'reduce cost by 1',
    sourceType: 'tech',
    playTimings: [{
      wording: 'When 1 or more of your units use Production',
      window: 'tactical.production',
      timing: 'during',
      mustBeActivePlayer: true,
    }],
  },
  {
    id: 'plasma',
    name: 'Plasma Scoring',
    description: 'extra die',
    sourceType: 'tech',
    playTimings: [{
      wording: 'During combat',
      window: 'tactical.space_combat.combat_rolls',
      timing: 'during',
      mustBeActivePlayer: true,
    }],
  },
  {
    id: 'bunker',
    name: 'Bunker',
    description: '-4 bombardment',
    sourceType: 'action_card',
    playTimings: [{
      wording: 'At the start of an invasion',
      window: 'tactical.invasion',
      timing: 'start',
      mustBeActivePlayer: false,
    }],
  },
]

describe('filterByContext', () => {
  it('filters by window prefix — production', () => {
    const result = filterByContext(items, 'tactical.production')
    expect(result.map(i => i.id)).toEqual(['sarween'])
  })

  it('filters by window prefix — space combat includes sub-steps', () => {
    const result = filterByContext(items, 'tactical.space_combat')
    expect(result.map(i => i.id)).toEqual(['plasma'])
  })

  it('filters by window prefix — invasion includes top-level invasion items', () => {
    const result = filterByContext(items, 'tactical.invasion')
    expect(result.map(i => i.id)).toEqual(['bunker'])
  })

  it('returns empty for no matches', () => {
    const result = filterByContext(items, 'agenda')
    expect(result).toEqual([])
  })
})
```

- [ ] **Step 2: Run test — confirm fail**

```bash
npx vitest run src/engine/__tests__/filter-by-context.test.ts
```

- [ ] **Step 3: Implement filter-by-context**

Create `src/engine/filter-by-context.ts`:

```typescript
import type { DisplayableItem } from '../types'

export function filterByContext(
  items: DisplayableItem[],
  windowPrefix: string,
): DisplayableItem[] {
  return items.filter(item =>
    item.playTimings.some(pt =>
      pt.window === windowPrefix || pt.window.startsWith(windowPrefix + '.')
    )
  )
}
```

- [ ] **Step 4: Run test — confirm pass**

```bash
npx vitest run src/engine/__tests__/filter-by-context.test.ts
```

- [ ] **Step 5: Write group-by-window tests**

Create `src/engine/__tests__/group-by-window.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { groupByWindow } from '../group-by-window'
import type { DisplayableItem } from '../../types'

const items: DisplayableItem[] = [
  {
    id: 'afb',
    name: 'Anti-Fighter Thing',
    description: 'afb effect',
    sourceType: 'tech',
    playTimings: [{
      wording: 'During anti-fighter barrage',
      window: 'tactical.space_combat.anti_fighter_barrage',
      timing: 'during',
      mustBeActivePlayer: true,
    }],
  },
  {
    id: 'retreat-card',
    name: 'Skilled Retreat',
    description: 'retreat',
    sourceType: 'action_card',
    playTimings: [{
      wording: 'After you announce retreat',
      window: 'tactical.space_combat.announce_retreat',
      timing: 'after',
      mustBeActivePlayer: true,
    }],
  },
  {
    id: 'combat-mod',
    name: 'Combat Mod',
    description: 'mod',
    sourceType: 'tech',
    playTimings: [{
      wording: 'During combat rolls',
      window: 'tactical.space_combat.combat_rolls',
      timing: 'during',
      mustBeActivePlayer: true,
    }],
  },
]

describe('groupByWindow', () => {
  it('groups and orders by window display order', () => {
    const groups = groupByWindow(items, 'tactical.space_combat')
    const windowKeys = groups.map(g => g.window)

    expect(windowKeys).toEqual([
      'tactical.space_combat.anti_fighter_barrage',
      'tactical.space_combat.announce_retreat',
      'tactical.space_combat.combat_rolls',
    ])
  })

  it('each group contains the right items', () => {
    const groups = groupByWindow(items, 'tactical.space_combat')
    expect(groups[0]!.items.map(i => i.id)).toEqual(['afb'])
    expect(groups[1]!.items.map(i => i.id)).toEqual(['retreat-card'])
    expect(groups[2]!.items.map(i => i.id)).toEqual(['combat-mod'])
  })

  it('omits empty groups', () => {
    const groups = groupByWindow(items, 'tactical.space_combat')
    // No items for space_cannon_offense, assign_hits, retreat
    expect(groups).toHaveLength(3)
  })
})
```

- [ ] **Step 6: Run test — confirm fail**

```bash
npx vitest run src/engine/__tests__/group-by-window.test.ts
```

- [ ] **Step 7: Implement group-by-window**

Create `src/engine/group-by-window.ts`:

```typescript
import type { DisplayableItem } from '../types'
import { WINDOW_DISPLAY_ORDER } from '../types'

export interface WindowGroup {
  window: string
  label: string
  items: DisplayableItem[]
}

// Human-readable labels for windows
const WINDOW_LABELS: Record<string, string> = {
  'tactical': 'Tactical Action',
  'tactical.activation': 'Activation',
  'tactical.movement': 'Movement',
  'tactical.space_combat': 'Space Combat',
  'tactical.space_combat.space_cannon_offense': 'Space Cannon Offense',
  'tactical.space_combat.anti_fighter_barrage': 'Anti-Fighter Barrage',
  'tactical.space_combat.announce_retreat': 'Announce Retreat',
  'tactical.space_combat.combat_rolls': 'Combat Rolls',
  'tactical.space_combat.assign_hits': 'Assign Hits',
  'tactical.space_combat.retreat': 'Retreat',
  'tactical.invasion': 'Invasion',
  'tactical.invasion.bombardment': 'Bombardment',
  'tactical.invasion.commit_ground_forces': 'Commit Ground Forces',
  'tactical.invasion.space_cannon_defense': 'Space Cannon Defense',
  'tactical.invasion.ground_combat': 'Ground Combat',
  'tactical.invasion.establish_control': 'Establish Control',
  'tactical.production': 'Production',
  'strategy': 'Strategy Phase',
  'agenda': 'Agenda Phase',
  'status': 'Status Phase',
  'status.score_objectives': 'Score Objectives',
  'status.reveal_public_objective': 'Reveal Public Objective',
  'status.draw_action_cards': 'Draw Action Cards',
  'status.remove_command_tokens': 'Remove Command Tokens',
  'status.gain_redistribute_command_tokens': 'Gain & Redistribute Command Tokens',
  'status.ready_cards': 'Ready Cards',
  'status.repair_units': 'Repair Units',
  'status.return_strategy_cards': 'Return Strategy Cards',
  'component': 'Component Actions',
  'strategic': 'Strategic Action',
}

export function windowLabel(window: string): string {
  return WINDOW_LABELS[window] ?? window
}

export function groupByWindow(
  items: DisplayableItem[],
  contextPrefix: string,
): WindowGroup[] {
  // Collect all windows that appear in these items' playTimings (matching the context)
  const windowToItems = new Map<string, DisplayableItem[]>()

  for (const item of items) {
    for (const pt of item.playTimings) {
      if (pt.window === contextPrefix || pt.window.startsWith(contextPrefix + '.')) {
        const existing = windowToItems.get(pt.window) ?? []
        existing.push(item)
        windowToItems.set(pt.window, existing)
      }
    }
  }

  // Also group items whose window matches the prefix exactly (parent-level items)
  // These are already handled above

  // Order groups by WINDOW_DISPLAY_ORDER
  const ordered: WindowGroup[] = []
  for (const window of WINDOW_DISPLAY_ORDER) {
    const groupItems = windowToItems.get(window)
    if (groupItems && groupItems.length > 0) {
      ordered.push({
        window,
        label: windowLabel(window),
        items: groupItems,
      })
    }
  }

  return ordered
}
```

- [ ] **Step 8: Run test — confirm pass**

```bash
npx vitest run src/engine/__tests__/group-by-window.test.ts
```

- [ ] **Step 9: Write resolve-displayable-items tests**

Create `src/engine/__tests__/resolve-displayable-items.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { resolveDisplayableItems } from '../resolve-displayable-items'
import type { Game } from '../../types/game'
import type { Technology, Faction, ActionCard, Relic, PromissoryNote } from '../../types/items'

const mockFaction: Faction = {
  id: 'test-faction',
  name: 'Test Faction',
  abilities: [{
    name: 'Test Ability',
    description: 'Does a thing',
    playTimings: [{
      wording: 'During production',
      window: 'tactical.production',
      timing: 'during',
      mustBeActivePlayer: true,
    }],
  }],
  startingTech: ['sarween-tools'],
  startingUnits: {},
  commodities: 3,
  leaders: [{
    type: 'agent',
    name: 'Test Agent',
    title: 'Agent',
    ability: 'Agent does stuff',
    unlockCondition: 'At Game Start',
    playTimings: [{
      wording: 'During combat',
      window: 'tactical.space_combat.combat_rolls',
      timing: 'during',
      mustBeActivePlayer: false,
    }],
  }],
  mech: {
    name: 'Test Mech',
    description: 'Mech desc',
    playTimings: [{
      wording: 'During ground combat',
      window: 'tactical.invasion.ground_combat',
      timing: 'during',
      mustBeActivePlayer: true,
    }],
  },
  promissoryNote: {
    id: 'test-pn', name: 'Test PN', description: 'PN desc',
    faction: 'test-faction', source: 'base',
  },
  source: 'base',
}

const mockTechs: Technology[] = [{
  id: 'sarween-tools',
  name: 'Sarween Tools',
  type: 'color',
  color: 'yellow',
  prerequisites: [],
  description: 'Reduce cost by 1',
  source: 'base',
  playTimings: [{
    wording: 'When producing',
    window: 'tactical.production',
    timing: 'during',
    mustBeActivePlayer: true,
  }],
}]

const mockGame: Game = {
  id: '1',
  name: 'Test',
  createdAt: new Date(),
  expansions: ['base'],
  factionId: 'test-faction',
  ownedTechIds: ['sarween-tools'],
  ownedActionCards: [],
  ownedPromissoryNoteIds: [],
  ownedRelicIds: [],
  leaderStates: { 'Test Agent': 'unlocked' },
}

describe('resolveDisplayableItems', () => {
  it('includes owned techs', () => {
    const result = resolveDisplayableItems(mockGame, mockFaction, mockTechs, [], [], [])
    const techItem = result.find(i => i.id === 'sarween-tools')
    expect(techItem).toBeDefined()
    expect(techItem!.sourceType).toBe('tech')
  })

  it('includes faction abilities', () => {
    const result = resolveDisplayableItems(mockGame, mockFaction, mockTechs, [], [], [])
    const ability = result.find(i => i.name === 'Test Ability')
    expect(ability).toBeDefined()
    expect(ability!.sourceType).toBe('faction_ability')
  })

  it('includes unlocked leaders', () => {
    const result = resolveDisplayableItems(mockGame, mockFaction, mockTechs, [], [], [])
    const agent = result.find(i => i.name === 'Test Agent')
    expect(agent).toBeDefined()
    expect(agent!.sourceType).toBe('leader')
  })

  it('excludes locked leaders', () => {
    const lockedGame = { ...mockGame, leaderStates: { 'Test Agent': 'locked' as const } }
    const result = resolveDisplayableItems(lockedGame, mockFaction, mockTechs, [], [], [])
    const agent = result.find(i => i.name === 'Test Agent')
    expect(agent).toBeUndefined()
  })

  it('includes mech abilities', () => {
    const result = resolveDisplayableItems(mockGame, mockFaction, mockTechs, [], [], [])
    const mech = result.find(i => i.name === 'Test Mech')
    expect(mech).toBeDefined()
    expect(mech!.sourceType).toBe('mech')
  })
})
```

- [ ] **Step 10: Run test — confirm fail**

```bash
npx vitest run src/engine/__tests__/resolve-displayable-items.test.ts
```

- [ ] **Step 11: Implement resolve-displayable-items**

Create `src/engine/resolve-displayable-items.ts`:

```typescript
import type { DisplayableItem } from '../types'
import type { Game } from '../types/game'
import type {
  Technology, Faction, ActionCard, PromissoryNote, Relic,
} from '../types/items'

export function resolveDisplayableItems(
  game: Game,
  faction: Faction,
  allTechs: Technology[],
  allActionCards: ActionCard[],
  allPromissoryNotes: PromissoryNote[],
  allRelics: Relic[],
): DisplayableItem[] {
  const items: DisplayableItem[] = []

  // Owned techs
  for (const techId of game.ownedTechIds) {
    const tech = allTechs.find(t => t.id === techId)
    if (tech?.playTimings?.length) {
      items.push({
        id: tech.id,
        name: tech.name,
        description: tech.description,
        sourceType: 'tech',
        playTimings: tech.playTimings,
      })
    }
  }

  // Owned action cards
  for (const owned of game.ownedActionCards) {
    const card = allActionCards.find(c => c.id === owned.id)
    if (card?.playTimings?.length) {
      items.push({
        id: card.id,
        name: card.name,
        description: card.description,
        sourceType: 'action_card',
        playTimings: card.playTimings,
      })
    }
  }

  // Owned promissory notes
  for (const pnId of game.ownedPromissoryNoteIds) {
    const pn = allPromissoryNotes.find(p => p.id === pnId)
    if (pn?.playTimings?.length) {
      items.push({
        id: pn.id,
        name: pn.name,
        description: pn.description,
        sourceType: 'promissory_note',
        playTimings: pn.playTimings,
      })
    }
  }

  // Owned relics
  for (const relicId of game.ownedRelicIds) {
    const relic = allRelics.find(r => r.id === relicId)
    if (relic?.playTimings?.length) {
      items.push({
        id: relic.id,
        name: relic.name,
        description: relic.description,
        sourceType: 'relic',
        playTimings: relic.playTimings,
      })
    }
  }

  // Faction abilities (always included)
  for (const ability of faction.abilities) {
    if (ability.playTimings?.length) {
      items.push({
        id: `${faction.id}-ability-${ability.name}`,
        name: ability.name,
        description: ability.description,
        sourceType: 'faction_ability',
        playTimings: ability.playTimings,
      })
    }
  }

  // Leaders (only if unlocked)
  for (const leader of faction.leaders) {
    const state = game.leaderStates[leader.name]
    if (state === 'unlocked' && leader.playTimings?.length) {
      items.push({
        id: `${faction.id}-leader-${leader.name}`,
        name: leader.name,
        description: leader.ability,
        sourceType: 'leader',
        playTimings: leader.playTimings,
      })
    }
  }

  // Mech (always included)
  if (faction.mech.playTimings?.length) {
    items.push({
      id: `${faction.id}-mech`,
      name: faction.mech.name,
      description: faction.mech.description,
      sourceType: 'mech',
      playTimings: faction.mech.playTimings,
    })
  }

  return items
}
```

- [ ] **Step 12: Run test — confirm pass**

```bash
npx vitest run src/engine/__tests__/resolve-displayable-items.test.ts
```

- [ ] **Step 13: Create barrel export**

Create `src/engine/index.ts`:

```typescript
export { filterByContext } from './filter-by-context'
export { groupByWindow, windowLabel } from './group-by-window'
export type { WindowGroup } from './group-by-window'
export { resolveDisplayableItems } from './resolve-displayable-items'
```

- [ ] **Step 14: Commit**

```bash
git add src/engine/ && git commit -m "add context filtering and grouping engine"
```

---

## Chunk 2: Database, Routing & Core Screens

### Task 6: IndexedDB with Dexie

**Files:**
- Create: `src/db/database.ts`
- Create: `src/db/game-store.ts`
- Create: `src/db/index.ts`
- Test: `src/db/__tests__/game-store.test.ts`

- [ ] **Step 1: Install fake-indexeddb for test environment**

```bash
npm install -D fake-indexeddb
```

Add to `src/test-setup.ts`:

```typescript
import 'fake-indexeddb/auto'
```

- [ ] **Step 2: Write game store tests**

Create `src/db/__tests__/game-store.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { createGame, getGame, listGames, updateGame, deleteGame } from '../game-store'
import { db } from '../database'

beforeEach(async () => {
  await db.games.clear()
})

describe('game-store', () => {
  it('creates and retrieves a game', async () => {
    const id = await createGame({
      name: 'Test Game',
      expansions: ['base', 'pok'],
      factionId: 'arborec',
    })
    const game = await getGame(id)
    expect(game).toBeDefined()
    expect(game!.name).toBe('Test Game')
    expect(game!.factionId).toBe('arborec')
    expect(game!.ownedTechIds).toEqual(['magen-defense-grid'])
  })

  it('lists all games', async () => {
    await createGame({ name: 'Game 1', expansions: ['base'], factionId: 'arborec' })
    await createGame({ name: 'Game 2', expansions: ['base'], factionId: 'sol' })
    const games = await listGames()
    expect(games).toHaveLength(2)
  })

  it('updates a game', async () => {
    const id = await createGame({ name: 'Test', expansions: ['base'], factionId: 'arborec' })
    await updateGame(id, { ownedTechIds: ['magen-defense-grid', 'sarween-tools'] })
    const game = await getGame(id)
    expect(game!.ownedTechIds).toContain('sarween-tools')
  })

  it('deletes a game', async () => {
    const id = await createGame({ name: 'Test', expansions: ['base'], factionId: 'arborec' })
    await deleteGame(id)
    const game = await getGame(id)
    expect(game).toBeUndefined()
  })
})
```

- [ ] **Step 3: Run test — confirm fail**

```bash
npx vitest run src/db/__tests__/game-store.test.ts
```

- [ ] **Step 4: Implement database schema**

Create `src/db/database.ts`:

```typescript
import Dexie from 'dexie'
import type { Game } from '../types/game'

class TI4Database extends Dexie {
  games!: Dexie.Table<Game, string>

  constructor() {
    super('ti4-turn-helper')
    this.version(1).stores({
      games: 'id, name, createdAt',
    })
  }
}

export const db = new TI4Database()
```

- [ ] **Step 5: Implement game store**

Create `src/db/game-store.ts`:

```typescript
import { db } from './database'
import type { Game, OwnedActionCard } from '../types/game'
import type { Expansion } from '../types'
import { loadFactions } from '../data'

interface CreateGameInput {
  name: string
  expansions: Expansion[]
  factionId: string
}

export async function createGame(input: CreateGameInput): Promise<string> {
  const id = crypto.randomUUID()
  const factions = loadFactions()
  const faction = factions.find(f => f.id === input.factionId)
  const startingTech = faction?.startingTech ?? []

  const game: Game = {
    id,
    name: input.name,
    createdAt: new Date(),
    expansions: input.expansions,
    factionId: input.factionId,
    ownedTechIds: [...startingTech],
    ownedActionCards: [],
    ownedPromissoryNoteIds: [],
    ownedRelicIds: [],
    leaderStates: buildInitialLeaderStates(faction),
  }

  await db.games.add(game)
  return id
}

function buildInitialLeaderStates(
  faction: { leaders: { name: string; unlockCondition: string }[] } | undefined,
): Record<string, 'locked' | 'unlocked'> {
  const states: Record<string, 'locked' | 'unlocked'> = {}
  if (!faction) return states
  for (const leader of faction.leaders) {
    states[leader.name] = leader.unlockCondition === 'At Game Start' ? 'unlocked' : 'locked'
  }
  return states
}

export async function getGame(id: string): Promise<Game | undefined> {
  return db.games.get(id)
}

export async function listGames(): Promise<Game[]> {
  return db.games.orderBy('createdAt').reverse().toArray()
}

export async function updateGame(id: string, updates: Partial<Game>): Promise<void> {
  await db.games.update(id, updates)
}

export async function deleteGame(id: string): Promise<void> {
  await db.games.delete(id)
}
```

- [ ] **Step 6: Create barrel export**

Create `src/db/index.ts`:

```typescript
export { db } from './database'
export { createGame, getGame, listGames, updateGame, deleteGame } from './game-store'
```

- [ ] **Step 7: Run test — confirm pass**

```bash
npx vitest run src/db/__tests__/game-store.test.ts
```

- [ ] **Step 8: Commit**

```bash
git add src/db/ src/test-setup.ts && git commit -m "add IndexedDB game store with Dexie"
```

---

### Task 7: React Router setup & App shell

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`
- Create: `src/screens/HomeScreen.tsx`
- Create: `src/screens/HomeScreen.module.css`

- [ ] **Step 1: Set up routing in App.tsx**

Replace `src/App.tsx`:

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HomeScreen } from './screens/HomeScreen'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
      </Routes>
    </BrowserRouter>
  )
}
```

Update `src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 2: Create HomeScreen placeholder**

Create `src/screens/HomeScreen.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listGames, createGame, deleteGame } from '../db'
import type { Game } from '../types/game'
import styles from './HomeScreen.module.css'

export function HomeScreen() {
  const [games, setGames] = useState<Game[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    listGames().then(setGames)
  }, [])

  async function handleNewGame() {
    navigate('/setup')
  }

  async function handleDelete(id: string) {
    await deleteGame(id)
    setGames(await listGames())
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>TI4 Turn Helper</h1>
      <button className={styles.newGameBtn} onClick={handleNewGame}>
        New Game
      </button>
      <div className={styles.gameList}>
        {games.map(game => (
          <div key={game.id} className={styles.gameCard}>
            <button
              className={styles.gameLink}
              onClick={() => navigate(`/game/${game.id}`)}
            >
              <span className={styles.gameName}>{game.name}</span>
              <span className={styles.gameFaction}>{game.factionId}</span>
            </button>
            <button
              className={styles.deleteBtn}
              onClick={() => handleDelete(game.id)}
            >
              Delete
            </button>
          </div>
        ))}
        {games.length === 0 && (
          <p className={styles.empty}>No games yet. Start a new one!</p>
        )}
      </div>
    </div>
  )
}
```

Create `src/screens/HomeScreen.module.css`:

```css
.container {
  max-width: 480px;
  margin: 0 auto;
  padding: 1rem;
}

.title {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.newGameBtn {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  margin-bottom: 1rem;
  cursor: pointer;
}

.gameList {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.gameCard {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 0.5rem;
}

.gameLink {
  display: flex;
  flex-direction: column;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  flex: 1;
}

.gameName {
  font-weight: bold;
}

.gameFaction {
  font-size: 0.875rem;
  color: #666;
}

.deleteBtn {
  color: #c00;
  background: none;
  border: none;
  cursor: pointer;
}

.empty {
  color: #666;
  text-align: center;
}
```

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```

Open in browser. Should see "TI4 Turn Helper" heading, "New Game" button, "No games yet" message.

- [ ] **Step 4: Commit**

```bash
git add src/ && git commit -m "add router and home screen"
```

---

### Task 8: Game Setup screen

**Files:**
- Create: `src/screens/SetupScreen.tsx`
- Create: `src/screens/SetupScreen.module.css`
- Modify: `src/App.tsx` — add route

- [ ] **Step 1: Create SetupScreen**

Create `src/screens/SetupScreen.tsx`:

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createGame } from '../db'
import { loadFactions } from '../data'
import { EXPANSIONS, type Expansion } from '../types'
import styles from './SetupScreen.module.css'

const DISABLED_EXPANSIONS = new Set(['thunders-edge'])

const EXPANSION_LABELS: Record<string, string> = {
  base: 'Base Game',
  pok: 'Prophecy of Kings',
  'codex-1': 'Codex I',
  'codex-2': 'Codex II',
  'codex-3': 'Codex III',
  'codex-4': 'Codex IV',
  'thunders-edge': "Thunder's Edge",
}

export function SetupScreen() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'expansions' | 'faction'>('expansions')
  // base is always selected and non-toggleable
  const [selectedExpansions, setSelectedExpansions] = useState<Expansion[]>(['base', 'pok'])
  const [gameName, setGameName] = useState('')
  const factions = loadFactions()

  function toggleExpansion(exp: Expansion) {
    if (exp === 'base') return // base is always required
    setSelectedExpansions(prev =>
      prev.includes(exp) ? prev.filter(e => e !== exp) : [...prev, exp]
    )
  }

  async function handleSelectFaction(factionId: string) {
    const name = gameName.trim() || `Game ${new Date().toLocaleDateString()}`
    const id = await createGame({
      name,
      expansions: selectedExpansions,
      factionId,
    })
    navigate(`/game/${id}`)
  }

  if (step === 'expansions') {
    return (
      <div className={styles.container}>
        <h1>New Game</h1>
        <label className={styles.nameLabel}>
          Game Name
          <input
            className={styles.nameInput}
            value={gameName}
            onChange={e => setGameName(e.target.value)}
            placeholder="Optional"
          />
        </label>
        <h2>Select Expansions</h2>
        <div className={styles.expansionList}>
          {[...EXPANSIONS, 'thunders-edge' as const].map(exp => {
            const disabled = DISABLED_EXPANSIONS.has(exp)
            const isExpansion = EXPANSIONS.includes(exp as Expansion)
            return (
              <button
                key={exp}
                className={`${styles.expansionBtn} ${
                  selectedExpansions.includes(exp as Expansion) ? styles.selected : ''
                } ${disabled ? styles.disabled : ''}`}
                onClick={() => !disabled && isExpansion && toggleExpansion(exp as Expansion)}
                disabled={disabled}
              >
                {EXPANSION_LABELS[exp] ?? exp}
                {disabled && <span className={styles.comingSoon}>Coming Soon</span>}
              </button>
            )
          })}
        </div>
        <button className={styles.nextBtn} onClick={() => setStep('faction')}>
          Next: Choose Faction
        </button>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <h1>Choose Faction</h1>
      <button className={styles.backBtn} onClick={() => setStep('expansions')}>
        Back
      </button>
      <div className={styles.factionList}>
        {factions
          .filter(f => selectedExpansions.includes(f.source as Expansion))
          .map(faction => (
            <button
              key={faction.id}
              className={styles.factionBtn}
              onClick={() => handleSelectFaction(faction.id)}
            >
              {faction.name}
            </button>
          ))}
      </div>
    </div>
  )
}
```

Create `src/screens/SetupScreen.module.css`:

```css
.container {
  max-width: 480px;
  margin: 0 auto;
  padding: 1rem;
}

.nameLabel {
  display: block;
  margin-bottom: 1rem;
}

.nameInput {
  display: block;
  width: 100%;
  padding: 0.5rem;
  margin-top: 0.25rem;
  font-size: 1rem;
}

.expansionList {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.expansionBtn {
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 0.5rem;
  cursor: pointer;
  text-align: left;
  background: white;
}

.expansionBtn.selected {
  border-color: #0066cc;
  background: #e6f0ff;
}

.expansionBtn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.comingSoon {
  display: block;
  font-size: 0.75rem;
  color: #999;
}

.nextBtn, .backBtn {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  margin-bottom: 1rem;
  cursor: pointer;
}

.factionList {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.factionBtn {
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 0.5rem;
  cursor: pointer;
  text-align: left;
  background: white;
}
```

- [ ] **Step 2: Add route to App.tsx**

Add to `src/App.tsx` routes:

```tsx
import { SetupScreen } from './screens/SetupScreen'

// Inside Routes:
<Route path="/setup" element={<SetupScreen />} />
```

- [ ] **Step 3: Verify in browser**

Navigate to New Game → select expansions → choose faction → should redirect to `/game/:id`.

- [ ] **Step 4: Commit**

```bash
git add src/ && git commit -m "add game setup screen with expansion and faction picker"
```

---

### Task 9: Game Dashboard screen

**Files:**
- Create: `src/screens/DashboardScreen.tsx`
- Create: `src/screens/DashboardScreen.module.css`
- Modify: `src/App.tsx` — add route

The context buttons grid — the main screen during gameplay.

- [ ] **Step 1: Define context button config**

Create `src/screens/DashboardScreen.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getGame } from '../db'
import { loadFactions } from '../data'
import type { Game } from '../types/game'
import styles from './DashboardScreen.module.css'

const CONTEXT_BUTTONS = [
  { label: 'Activation', windowPrefix: 'tactical.activation' },
  { label: 'Movement', windowPrefix: 'tactical.movement' },
  { label: 'Space Combat', windowPrefix: 'tactical.space_combat' },
  { label: 'Invasion', windowPrefix: 'tactical.invasion' },
  { label: 'Production', windowPrefix: 'tactical.production' },
  { label: 'Agenda', windowPrefix: 'agenda' },
  { label: 'Status Phase', windowPrefix: 'status' },
  { label: 'Component Actions', windowPrefix: 'component' },
] as const

export function DashboardScreen() {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()
  const [game, setGame] = useState<Game | null>(null)

  useEffect(() => {
    if (gameId) getGame(gameId).then(g => setGame(g ?? null))
  }, [gameId])

  if (!game) return <div className={styles.loading}>Loading...</div>

  const factions = loadFactions()
  const faction = factions.find(f => f.id === game.factionId)

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.homeBtn} onClick={() => navigate('/')}>Home</button>
        <div>
          <h1 className={styles.gameName}>{game.name}</h1>
          <p className={styles.factionName}>{faction?.name ?? game.factionId}</p>
        </div>
        <button
          className={styles.manageBtn}
          onClick={() => navigate(`/game/${game.id}/manage`)}
        >
          Manage
        </button>
      </header>
      <div className={styles.buttonGrid}>
        {CONTEXT_BUTTONS.map(btn => (
          <button
            key={btn.windowPrefix}
            className={styles.contextBtn}
            onClick={() =>
              navigate(`/game/${game.id}/context/${encodeURIComponent(btn.windowPrefix)}`)
            }
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  )
}
```

Create `src/screens/DashboardScreen.module.css`:

```css
.container {
  max-width: 480px;
  margin: 0 auto;
  padding: 1rem;
}

.loading {
  text-align: center;
  padding: 2rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.homeBtn, .manageBtn {
  padding: 0.5rem 0.75rem;
  cursor: pointer;
}

.gameName {
  font-size: 1.25rem;
  margin: 0;
  text-align: center;
}

.factionName {
  font-size: 0.875rem;
  color: #666;
  margin: 0;
  text-align: center;
}

.buttonGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.contextBtn {
  padding: 1.5rem 1rem;
  font-size: 1rem;
  font-weight: bold;
  border: 1px solid #ccc;
  border-radius: 0.5rem;
  cursor: pointer;
  background: white;
}
```

- [ ] **Step 2: Add route**

In `src/App.tsx`:

```tsx
import { DashboardScreen } from './screens/DashboardScreen'

<Route path="/game/:gameId" element={<DashboardScreen />} />
```

- [ ] **Step 3: Verify in browser**

Create a game → should land on dashboard with context button grid.

- [ ] **Step 4: Commit**

```bash
git add src/ && git commit -m "add game dashboard with context buttons"
```

---

## Chunk 3: Context View & Manage Screen

### Task 10: Context View screen

**Files:**
- Create: `src/screens/ContextViewScreen.tsx`
- Create: `src/screens/ContextViewScreen.module.css`
- Create: `src/components/WindowGroupDisplay.tsx`
- Create: `src/components/WindowGroupDisplay.module.css`
- Create: `src/components/ItemCard.tsx`
- Create: `src/components/ItemCard.module.css`
- Create: `src/components/ConfirmModal.tsx`
- Create: `src/components/ConfirmModal.module.css`
- Create: `src/hooks/use-game-context.ts`
- Modify: `src/App.tsx` — add route
- Test: `src/components/__tests__/ItemCard.test.tsx`

- [ ] **Step 1: Write ItemCard test**

Create `src/components/__tests__/ItemCard.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ItemCard } from '../ItemCard'
import type { DisplayableItem } from '../../types'

const item: DisplayableItem = {
  id: 'sarween',
  name: 'Sarween Tools',
  description: 'Reduce cost by 1 during production',
  sourceType: 'tech',
  playTimings: [{
    wording: 'When producing',
    window: 'tactical.production',
    timing: 'during',
    mustBeActivePlayer: true,
  }],
}

describe('ItemCard', () => {
  it('renders item name and description', () => {
    render(<ItemCard item={item} />)
    expect(screen.getByText('Sarween Tools')).toBeInTheDocument()
    expect(screen.getByText('Reduce cost by 1 during production')).toBeInTheDocument()
  })

  it('renders source type badge', () => {
    render(<ItemCard item={item} />)
    expect(screen.getByText('tech')).toBeInTheDocument()
  })

  it('renders timing wording', () => {
    render(<ItemCard item={item} />)
    expect(screen.getByText('When producing')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test — confirm fail**

```bash
npx vitest run src/components/__tests__/ItemCard.test.tsx
```

- [ ] **Step 3: Implement ItemCard**

Create `src/components/ItemCard.tsx`:

```tsx
import type { DisplayableItem } from '../types'
import styles from './ItemCard.module.css'

interface ItemCardProps {
  item: DisplayableItem
  onLongPress?: () => void
}

const SOURCE_TYPE_LABELS: Record<string, string> = {
  tech: 'Tech',
  action_card: 'Action Card',
  faction_ability: 'Faction',
  promissory_note: 'Promissory',
  leader: 'Leader',
  relic: 'Relic',
  mech: 'Mech',
  unit_ability: 'Unit',
}

export function ItemCard({ item, onLongPress }: ItemCardProps) {
  let pressTimer: ReturnType<typeof setTimeout> | null = null

  function handleTouchStart() {
    pressTimer = setTimeout(() => {
      onLongPress?.()
    }, 500)
  }

  function handleTouchEnd() {
    if (pressTimer) clearTimeout(pressTimer)
  }

  return (
    <div
      className={styles.card}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
    >
      <div className={styles.header}>
        <span className={styles.name}>{item.name}</span>
        <span className={styles.sourceType}>
          {SOURCE_TYPE_LABELS[item.sourceType] ?? item.sourceType}
        </span>
      </div>
      {item.playTimings[0] && (
        <p className={styles.timing}>{item.playTimings[0].wording}</p>
      )}
      <p className={styles.description}>{item.description}</p>
    </div>
  )
}
```

Create `src/components/ItemCard.module.css`:

```css
.card {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 0.5rem;
  background: white;
  user-select: none;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.name {
  font-weight: bold;
}

.sourceType {
  font-size: 0.75rem;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  background: #eee;
  color: #666;
}

.timing {
  font-size: 0.8rem;
  color: #0066cc;
  margin: 0.25rem 0;
  font-style: italic;
}

.description {
  font-size: 0.875rem;
  margin: 0;
  color: #333;
}
```

- [ ] **Step 4: Run test — confirm pass**

```bash
npx vitest run src/components/__tests__/ItemCard.test.tsx
```

- [ ] **Step 5: Implement ConfirmModal**

Create `src/components/ConfirmModal.tsx`:

```tsx
import styles from './ConfirmModal.module.css'

interface ConfirmModalProps {
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({ message, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <p>{message}</p>
        <div className={styles.buttons}>
          <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
          <button className={styles.confirmBtn} onClick={onConfirm}>Remove</button>
        </div>
      </div>
    </div>
  )
}
```

Create `src/components/ConfirmModal.module.css`:

```css
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  max-width: 300px;
  width: 90%;
}

.buttons {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.cancelBtn, .confirmBtn {
  flex: 1;
  padding: 0.5rem;
  cursor: pointer;
}

.confirmBtn {
  background: #c00;
  color: white;
  border: none;
  border-radius: 0.25rem;
}

.cancelBtn {
  border: 1px solid #ccc;
  border-radius: 0.25rem;
  background: white;
}
```

- [ ] **Step 6: Implement WindowGroupDisplay**

Create `src/components/WindowGroupDisplay.tsx`:

```tsx
import type { WindowGroup } from '../engine'
import { ItemCard } from './ItemCard'
import styles from './WindowGroupDisplay.module.css'

interface WindowGroupDisplayProps {
  group: WindowGroup
  onRemoveItem?: (itemId: string) => void
}

export function WindowGroupDisplay({ group, onRemoveItem }: WindowGroupDisplayProps) {
  return (
    <section className={styles.group}>
      <h3 className={styles.groupLabel}>{group.label}</h3>
      <div className={styles.items}>
        {group.items.map(item => (
          <ItemCard
            key={item.id}
            item={item}
            onLongPress={() => onRemoveItem?.(item.id)}
          />
        ))}
      </div>
    </section>
  )
}
```

Create `src/components/WindowGroupDisplay.module.css`:

```css
.group {
  margin-bottom: 1rem;
}

.groupLabel {
  font-size: 0.875rem;
  text-transform: uppercase;
  color: #666;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.25rem;
  margin-bottom: 0.5rem;
}

.items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
```

- [ ] **Step 7: Create use-game-context hook**

Create `src/hooks/use-game-context.ts`:

```typescript
import { useEffect, useState, useCallback } from 'react'
import { getGame, updateGame } from '../db'
import { loadFactions, loadTechnologies, loadActionCards, loadPromissoryNotes, loadRelics, resolveOmegaReplacements } from '../data'
import { resolveDisplayableItems, filterByContext, groupByWindow } from '../engine'
import type { Game } from '../types/game'
import type { WindowGroup } from '../engine'

export function useGameContext(gameId: string | undefined, windowPrefix: string) {
  const [game, setGame] = useState<Game | null>(null)
  const [groups, setGroups] = useState<WindowGroup[]>([])

  const refresh = useCallback(async () => {
    if (!gameId) return
    const g = await getGame(gameId)
    if (!g) return
    setGame(g)

    const factions = loadFactions()
    const faction = factions.find(f => f.id === g.factionId)
    if (!faction) return

    const techs = resolveOmegaReplacements(loadTechnologies(), g.expansions)
    const actionCards = resolveOmegaReplacements(loadActionCards(), g.expansions)
    const promissoryNotes = resolveOmegaReplacements(loadPromissoryNotes(), g.expansions)
    const relics = loadRelics().filter(r => g.expansions.includes(r.source as any))

    const allItems = resolveDisplayableItems(g, faction, techs, actionCards, promissoryNotes, relics)
    const filtered = filterByContext(allItems, windowPrefix)
    const grouped = groupByWindow(filtered, windowPrefix)

    setGroups(grouped)
  }, [gameId, windowPrefix])

  useEffect(() => { refresh() }, [refresh])

  async function removeItem(itemId: string) {
    if (!game) return
    const updates: Partial<Game> = {}

    if (game.ownedTechIds.includes(itemId)) {
      updates.ownedTechIds = game.ownedTechIds.filter(id => id !== itemId)
    } else if (game.ownedActionCards.some(c => c.id === itemId)) {
      const card = game.ownedActionCards.find(c => c.id === itemId)!
      if (card.quantity <= 1) {
        updates.ownedActionCards = game.ownedActionCards.filter(c => c.id !== itemId)
      } else {
        updates.ownedActionCards = game.ownedActionCards.map(c =>
          c.id === itemId ? { ...c, quantity: c.quantity - 1 } : c
        )
      }
    } else if (game.ownedPromissoryNoteIds.includes(itemId)) {
      updates.ownedPromissoryNoteIds = game.ownedPromissoryNoteIds.filter(id => id !== itemId)
    } else if (game.ownedRelicIds.includes(itemId)) {
      updates.ownedRelicIds = game.ownedRelicIds.filter(id => id !== itemId)
    }

    await updateGame(game.id, updates)
    await refresh()
  }

  return { game, groups, removeItem, refresh }
}
```

- [ ] **Step 8: Implement ContextViewScreen**

Create `src/screens/ContextViewScreen.tsx`:

```tsx
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGameContext } from '../hooks/use-game-context'
import { WindowGroupDisplay } from '../components/WindowGroupDisplay'
import { ConfirmModal } from '../components/ConfirmModal'
import { windowLabel } from '../engine'
import styles from './ContextViewScreen.module.css'

export function ContextViewScreen() {
  const { gameId, windowPrefix } = useParams<{ gameId: string; windowPrefix: string }>()
  const navigate = useNavigate()
  const decodedPrefix = decodeURIComponent(windowPrefix ?? '')
  const { groups, removeItem } = useGameContext(gameId, decodedPrefix)
  const [pendingRemove, setPendingRemove] = useState<{ id: string; name: string } | null>(null)

  function handleRemoveRequest(itemId: string) {
    const item = groups.flatMap(g => g.items).find(i => i.id === itemId)
    if (item) setPendingRemove({ id: item.id, name: item.name })
  }

  async function handleConfirmRemove() {
    if (pendingRemove) {
      await removeItem(pendingRemove.id)
      setPendingRemove(null)
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          Back
        </button>
        <h1 className={styles.title}>{windowLabel(decodedPrefix)}</h1>
      </header>

      {groups.length === 0 && (
        <p className={styles.empty}>No relevant items. Add some via Manage.</p>
      )}

      {groups.map(group => (
        <WindowGroupDisplay
          key={group.window}
          group={group}
          onRemoveItem={handleRemoveRequest}
        />
      ))}

      {pendingRemove && (
        <ConfirmModal
          message={`Remove ${pendingRemove.name}?`}
          onConfirm={handleConfirmRemove}
          onCancel={() => setPendingRemove(null)}
        />
      )}
    </div>
  )
}
```

Create `src/screens/ContextViewScreen.module.css`:

```css
.container {
  max-width: 480px;
  margin: 0 auto;
  padding: 1rem;
}

.header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.backBtn {
  padding: 0.5rem 0.75rem;
  cursor: pointer;
}

.title {
  font-size: 1.25rem;
  margin: 0;
}

.empty {
  color: #666;
  text-align: center;
  padding: 2rem 0;
}
```

- [ ] **Step 9: Add route**

In `src/App.tsx`:

```tsx
import { ContextViewScreen } from './screens/ContextViewScreen'

<Route path="/game/:gameId/context/:windowPrefix" element={<ContextViewScreen />} />
```

- [ ] **Step 10: Verify in browser**

Create a game → dashboard → tap a context button → should see empty state (no enriched data yet). That's expected.

- [ ] **Step 11: Commit**

```bash
git add src/ && git commit -m "add context view screen with grouped reminders and long-press removal"
```

---

### Task 11: Manage Screen

**Files:**
- Create: `src/screens/ManageScreen.tsx`
- Create: `src/screens/ManageScreen.module.css`
- Create: `src/components/TechList.tsx`
- Create: `src/components/TechList.module.css`
- Create: `src/components/ActionCardList.tsx`
- Create: `src/components/ActionCardList.module.css`
- Create: `src/components/PromissoryNoteList.tsx`
- Create: `src/components/RelicList.tsx`
- Create: `src/components/LeaderList.tsx`
- Create: `src/components/LeaderList.module.css`
- Create: `src/components/SearchBox.tsx`
- Create: `src/hooks/use-manage-game.ts`
- Modify: `src/App.tsx` — add route
- Test: `src/components/__tests__/TechList.test.tsx`

- [ ] **Step 1: Write TechList test**

Create `src/components/__tests__/TechList.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TechList } from '../TechList'
import type { Technology } from '../../types/items'

const techs: Technology[] = [
  { id: 'neural', name: 'Neural Motivator', type: 'color', color: 'green', prerequisites: [], description: 'Draw 2 action cards', source: 'base' },
  { id: 'dacxive', name: 'Dacxive Animators', type: 'color', color: 'green', prerequisites: ['green'], description: 'Place infantry', source: 'base' },
  { id: 'plasma', name: 'Plasma Scoring', type: 'color', color: 'red', prerequisites: [], description: 'Extra die', source: 'base' },
]

describe('TechList', () => {
  it('groups techs by color', () => {
    render(<TechList techs={techs} ownedIds={[]} onToggle={vi.fn()} />)
    expect(screen.getByText('Green')).toBeInTheDocument()
    expect(screen.getByText('Red')).toBeInTheDocument()
  })

  it('sorts by prerequisite count within group', () => {
    render(<TechList techs={techs} ownedIds={[]} onToggle={vi.fn()} />)
    const greenItems = screen.getAllByTestId('tech-item')
    // Neural (0 prereqs) should be before Dacxive (1 prereq)
    expect(greenItems[0]).toHaveTextContent('Neural Motivator')
    expect(greenItems[1]).toHaveTextContent('Dacxive Animators')
  })

  it('highlights owned techs', () => {
    render(<TechList techs={techs} ownedIds={['neural']} onToggle={vi.fn()} />)
    const neuralItem = screen.getByTestId('tech-item-neural')
    expect(neuralItem).toHaveClass(/owned/)
  })

  it('calls onToggle when tapped', () => {
    const onToggle = vi.fn()
    render(<TechList techs={techs} ownedIds={[]} onToggle={onToggle} />)
    fireEvent.click(screen.getByText('Neural Motivator'))
    expect(onToggle).toHaveBeenCalledWith('neural')
  })
})
```

- [ ] **Step 2: Run test — confirm fail**

```bash
npx vitest run src/components/__tests__/TechList.test.tsx
```

- [ ] **Step 3: Implement TechList**

Create `src/components/TechList.tsx`:

```tsx
import type { Technology } from '../types/items'
import styles from './TechList.module.css'

interface TechListProps {
  techs: Technology[]
  ownedIds: string[]
  onToggle: (techId: string) => void
}

const COLOR_ORDER = ['blue', 'green', 'red', 'yellow'] as const
const COLOR_LABELS: Record<string, string> = {
  blue: 'Blue', green: 'Green', red: 'Red', yellow: 'Yellow',
}

export function TechList({ techs, ownedIds, onToggle }: TechListProps) {
  const ownedSet = new Set(ownedIds)

  const grouped = COLOR_ORDER.map(color => ({
    color,
    label: COLOR_LABELS[color] ?? color,
    techs: techs
      .filter(t => t.color === color)
      .sort((a, b) => a.prerequisites.length - b.prerequisites.length),
  })).filter(g => g.techs.length > 0)

  // Unit upgrades (no color)
  const unitUpgrades = techs.filter(t => t.type === 'unit-upgrade')
  if (unitUpgrades.length > 0) {
    grouped.push({ color: 'unit-upgrade' as any, label: 'Unit Upgrades', techs: unitUpgrades })
  }

  return (
    <div className={styles.container}>
      {grouped.map(group => (
        <div key={group.color}>
          <h3 className={styles.colorLabel}>{group.label}</h3>
          {group.techs.map(tech => (
            <button
              key={tech.id}
              data-testid={`tech-item-${tech.id}`}
              className={`${styles.techItem} ${ownedSet.has(tech.id) ? styles.owned : ''}`}
              onClick={() => onToggle(tech.id)}
              // Also use generic data-testid for ordering tests
              {...{ 'data-testid-generic': 'tech-item' }}
            >
              <span data-testid="tech-item">{tech.name}</span>
              {tech.prerequisites.length > 0 && (
                <span className={styles.prereqs}>
                  {tech.prerequisites.join(', ')}
                </span>
              )}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}
```

Create `src/components/TechList.module.css`:

```css
.container {
  display: flex;
  flex-direction: column;
}

.colorLabel {
  font-size: 0.875rem;
  text-transform: uppercase;
  color: #666;
  margin: 0.75rem 0 0.25rem;
}

.techItem {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 0.25rem;
  margin-bottom: 0.25rem;
  cursor: pointer;
  background: white;
  text-align: left;
}

.techItem.owned {
  background: #e6f0ff;
  border-color: #0066cc;
}

.prereqs {
  font-size: 0.75rem;
  color: #999;
}
```

- [ ] **Step 4: Run test — confirm pass**

```bash
npx vitest run src/components/__tests__/TechList.test.tsx
```

- [ ] **Step 5: Implement remaining list components**

Create `src/components/ActionCardList.tsx` — alphabetical list with quantity +/- buttons.

Create `src/components/PromissoryNoteList.tsx` — alphabetical toggle list (same pattern as TechList but flat).

Create `src/components/RelicList.tsx` — alphabetical toggle list.

Create `src/components/LeaderList.tsx` — shows agent/commander/hero with lock/unlock toggle and unlock condition text.

Create `src/components/SearchBox.tsx`:

```tsx
import styles from './SearchBox.module.css'

interface SearchBoxProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchBox({ value, onChange, placeholder = 'Search...' }: SearchBoxProps) {
  return (
    <input
      className={styles.input}
      type="search"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
    />
  )
}
```

- [ ] **Step 6: Implement use-manage-game hook**

Create `src/hooks/use-manage-game.ts`:

```typescript
import { useEffect, useState, useCallback } from 'react'
import { getGame, updateGame } from '../db'
import {
  loadTechnologies, loadActionCards, loadPromissoryNotes, loadRelics, loadFactions,
  resolveOmegaReplacements,
} from '../data'
import type { Game } from '../types/game'
import type { Technology, ActionCard, PromissoryNote, Relic, Faction } from '../types/items'

export function useManageGame(gameId: string | undefined) {
  const [game, setGame] = useState<Game | null>(null)
  const [faction, setFaction] = useState<Faction | null>(null)
  const [techs, setTechs] = useState<Technology[]>([])
  const [actionCards, setActionCards] = useState<ActionCard[]>([])
  const [promissoryNotes, setPromissoryNotes] = useState<PromissoryNote[]>([])
  const [relics, setRelics] = useState<Relic[]>([])

  const refresh = useCallback(async () => {
    if (!gameId) return
    const g = await getGame(gameId)
    if (!g) return
    setGame(g)

    const factions = loadFactions()
    setFaction(factions.find(f => f.id === g.factionId) ?? null)
    setTechs(resolveOmegaReplacements(loadTechnologies(), g.expansions))
    setActionCards(resolveOmegaReplacements(loadActionCards(), g.expansions))
    setPromissoryNotes(resolveOmegaReplacements(loadPromissoryNotes(), g.expansions))
    setRelics(loadRelics().filter(r => g.expansions.includes(r.source as any)))
  }, [gameId])

  useEffect(() => { refresh() }, [refresh])

  async function toggleTech(techId: string) {
    if (!game) return
    const owned = game.ownedTechIds.includes(techId)
    const ownedTechIds = owned
      ? game.ownedTechIds.filter(id => id !== techId)
      : [...game.ownedTechIds, techId]
    await updateGame(game.id, { ownedTechIds })
    await refresh()
  }

  async function adjustActionCard(cardId: string, delta: number) {
    if (!game) return
    const existing = game.ownedActionCards.find(c => c.id === cardId)
    let ownedActionCards = [...game.ownedActionCards]
    if (existing) {
      const newQty = existing.quantity + delta
      if (newQty <= 0) {
        ownedActionCards = ownedActionCards.filter(c => c.id !== cardId)
      } else {
        ownedActionCards = ownedActionCards.map(c =>
          c.id === cardId ? { ...c, quantity: newQty } : c
        )
      }
    } else if (delta > 0) {
      ownedActionCards.push({ id: cardId, quantity: 1 })
    }
    await updateGame(game.id, { ownedActionCards })
    await refresh()
  }

  async function togglePromissoryNote(noteId: string) {
    if (!game) return
    const owned = game.ownedPromissoryNoteIds.includes(noteId)
    const ownedPromissoryNoteIds = owned
      ? game.ownedPromissoryNoteIds.filter(id => id !== noteId)
      : [...game.ownedPromissoryNoteIds, noteId]
    await updateGame(game.id, { ownedPromissoryNoteIds })
    await refresh()
  }

  async function toggleRelic(relicId: string) {
    if (!game) return
    const owned = game.ownedRelicIds.includes(relicId)
    const ownedRelicIds = owned
      ? game.ownedRelicIds.filter(id => id !== relicId)
      : [...game.ownedRelicIds, relicId]
    await updateGame(game.id, { ownedRelicIds })
    await refresh()
  }

  async function toggleLeader(leaderName: string) {
    if (!game) return
    const current = game.leaderStates[leaderName] ?? 'locked'
    const leaderStates = {
      ...game.leaderStates,
      [leaderName]: current === 'locked' ? 'unlocked' as const : 'locked' as const,
    }
    await updateGame(game.id, { leaderStates })
    await refresh()
  }

  return {
    game, faction, techs, actionCards, promissoryNotes, relics,
    toggleTech, adjustActionCard, togglePromissoryNote, toggleRelic, toggleLeader,
  }
}
```

- [ ] **Step 7: Implement ManageScreen**

Create `src/screens/ManageScreen.tsx`:

```tsx
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useManageGame } from '../hooks/use-manage-game'
import { SearchBox } from '../components/SearchBox'
import { TechList } from '../components/TechList'
import { ActionCardList } from '../components/ActionCardList'
import { PromissoryNoteList } from '../components/PromissoryNoteList'
import { RelicList } from '../components/RelicList'
import { LeaderList } from '../components/LeaderList'
import styles from './ManageScreen.module.css'

type Tab = 'techs' | 'action-cards' | 'promissory' | 'relics' | 'leaders'

const TABS: { key: Tab; label: string }[] = [
  { key: 'techs', label: 'Techs' },
  { key: 'action-cards', label: 'Action Cards' },
  { key: 'promissory', label: 'Promissory' },
  { key: 'relics', label: 'Relics' },
  { key: 'leaders', label: 'Leaders' },
]

export function ManageScreen() {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('techs')
  const [search, setSearch] = useState('')

  const {
    game, faction, techs, actionCards, promissoryNotes, relics,
    toggleTech, adjustActionCard, togglePromissoryNote, toggleRelic, toggleLeader,
  } = useManageGame(gameId)

  if (!game || !faction) return <div>Loading...</div>

  const lowerSearch = search.toLowerCase()

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>Back</button>
        <h1 className={styles.title}>Manage</h1>
      </header>

      <SearchBox value={search} onChange={setSearch} />

      <div className={styles.tabs}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`${styles.tab} ${activeTab === tab.key ? styles.activeTab : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'techs' && (
        <TechList
          techs={search ? techs.filter(t => t.name.toLowerCase().includes(lowerSearch)) : techs}
          ownedIds={game.ownedTechIds}
          onToggle={toggleTech}
        />
      )}

      {activeTab === 'action-cards' && (
        <ActionCardList
          cards={search ? actionCards.filter(c => c.name.toLowerCase().includes(lowerSearch)) : actionCards}
          ownedCards={game.ownedActionCards}
          onAdjust={adjustActionCard}
        />
      )}

      {activeTab === 'promissory' && (
        <PromissoryNoteList
          notes={search ? promissoryNotes.filter(n => n.name.toLowerCase().includes(lowerSearch)) : promissoryNotes}
          ownedIds={game.ownedPromissoryNoteIds}
          onToggle={togglePromissoryNote}
        />
      )}

      {activeTab === 'relics' && (
        <RelicList
          relics={search ? relics.filter(r => r.name.toLowerCase().includes(lowerSearch)) : relics}
          ownedIds={game.ownedRelicIds}
          onToggle={toggleRelic}
        />
      )}

      {activeTab === 'leaders' && (
        <LeaderList
          leaders={faction.leaders}
          leaderStates={game.leaderStates}
          onToggle={toggleLeader}
        />
      )}
    </div>
  )
}
```

Create `src/screens/ManageScreen.module.css`:

```css
.container {
  max-width: 480px;
  margin: 0 auto;
  padding: 1rem;
}

.header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.backBtn {
  padding: 0.5rem 0.75rem;
  cursor: pointer;
}

.title {
  font-size: 1.25rem;
  margin: 0;
}

.tabs {
  display: flex;
  gap: 0.25rem;
  margin: 0.75rem 0;
  overflow-x: auto;
}

.tab {
  padding: 0.5rem 0.75rem;
  border: 1px solid #ccc;
  border-radius: 0.25rem;
  background: white;
  cursor: pointer;
  white-space: nowrap;
  font-size: 0.875rem;
}

.tab.activeTab {
  background: #0066cc;
  color: white;
  border-color: #0066cc;
}
```

- [ ] **Step 8: Add route**

In `src/App.tsx`:

```tsx
import { ManageScreen } from './screens/ManageScreen'

<Route path="/game/:gameId/manage" element={<ManageScreen />} />
```

- [ ] **Step 9: Verify in browser**

Dashboard → Manage → should see tabs, search, tech list grouped by color.

- [ ] **Step 10: Commit**

```bash
git add src/ && git commit -m "add manage screen with category tabs, search, and item toggles"
```

---

## Chunk 4: Production Calculator & PWA

### Task 12: Production Calculator

**Files:**
- Create: `src/components/ProductionCalculator.tsx`
- Create: `src/components/ProductionCalculator.module.css`
- Create: `src/engine/production-calc.ts`
- Modify: `src/screens/ContextViewScreen.tsx` — embed calculator in production context
- Test: `src/engine/__tests__/production-calc.test.ts`

- [ ] **Step 1: Write production calc tests**

Create `src/engine/__tests__/production-calc.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { calculateProduction } from '../production-calc'
import type { Unit } from '../../types/items'

const baseUnits: Unit[] = [
  { id: 'fighter-1', name: 'Fighter I', type: 'fighter', cost: 0.5, combat: 9, source: 'base' },
  { id: 'infantry-1', name: 'Infantry I', type: 'infantry', cost: 0.5, combat: 8, source: 'base' },
  { id: 'carrier-1', name: 'Carrier I', type: 'carrier', cost: 3, combat: 9, move: 1, capacity: 4, source: 'base' },
  { id: 'dreadnought-1', name: 'Dreadnought I', type: 'dreadnought', cost: 4, combat: 5, move: 1, capacity: 1, source: 'base' },
]

describe('calculateProduction', () => {
  it('sums costs correctly', () => {
    const result = calculateProduction(
      { fighter: 2, carrier: 1 },
      baseUnits,
      { hasSarween: false },
    )
    expect(result.totalCost).toBe(4) // 0.5 + 0.5 + 3
    expect(result.productionUnits).toBe(3)
  })

  it('applies sarween discount', () => {
    const result = calculateProduction(
      { fighter: 2, carrier: 1 },
      baseUnits,
      { hasSarween: true },
    )
    expect(result.totalCost).toBe(3) // 4 - 1
  })

  it('sarween never reduces below 0', () => {
    const result = calculateProduction(
      { fighter: 1 },
      baseUnits,
      { hasSarween: true },
    )
    expect(result.totalCost).toBe(0) // 0.5 - 1, floored at 0
  })

  it('counts production units (each unit = 1 production)', () => {
    const result = calculateProduction(
      { fighter: 3, infantry: 2 },
      baseUnits,
      { hasSarween: false },
    )
    expect(result.productionUnits).toBe(5)
  })

  it('returns per-type cost breakdown', () => {
    const result = calculateProduction(
      { fighter: 2, carrier: 1 },
      baseUnits,
      { hasSarween: false },
    )
    expect(result.breakdown).toEqual([
      { unitType: 'fighter', quantity: 2, unitCost: 0.5, lineCost: 1 },
      { unitType: 'carrier', quantity: 1, unitCost: 3, lineCost: 3 },
    ])
  })
})
```

- [ ] **Step 2: Run test — confirm fail**

```bash
npx vitest run src/engine/__tests__/production-calc.test.ts
```

- [ ] **Step 3: Implement production-calc**

Create `src/engine/production-calc.ts`:

```typescript
import type { Unit } from '../types/items'

interface ProductionModifiers {
  hasSarween: boolean
}

interface CostBreakdown {
  unitType: string
  quantity: number
  unitCost: number
  lineCost: number
}

interface ProductionResult {
  totalCost: number
  productionUnits: number
  breakdown: CostBreakdown[]
  sarweenDiscount: number
}

export function calculateProduction(
  selection: Record<string, number>,
  units: Unit[],
  modifiers: ProductionModifiers,
): ProductionResult {
  const breakdown: CostBreakdown[] = []
  let rawCost = 0
  let productionUnits = 0

  for (const [unitType, quantity] of Object.entries(selection)) {
    if (quantity <= 0) continue
    const unit = units.find(u => u.type === unitType)
    const unitCost = unit?.cost ?? 0
    const lineCost = unitCost * quantity
    rawCost += lineCost
    productionUnits += quantity
    breakdown.push({ unitType, quantity, unitCost, lineCost })
  }

  const sarweenDiscount = modifiers.hasSarween ? 1 : 0
  const totalCost = Math.max(0, rawCost - sarweenDiscount)

  return { totalCost, productionUnits, breakdown, sarweenDiscount }
}
```

- [ ] **Step 4: Run test — confirm pass**

```bash
npx vitest run src/engine/__tests__/production-calc.test.ts
```

- [ ] **Step 5: Implement ProductionCalculator component**

Create `src/components/ProductionCalculator.tsx`:

```tsx
import { useState, useMemo } from 'react'
import { calculateProduction } from '../engine/production-calc'
import { loadUnits } from '../data'
import styles from './ProductionCalculator.module.css'

interface ProductionCalculatorProps {
  hasSarween: boolean
}

const PRODUCIBLE_TYPES = [
  'dreadnought', 'cruiser', 'carrier', 'destroyer', 'fighter', 'infantry', 'pds', 'war-sun', 'mech',
]

export function ProductionCalculator({ hasSarween }: ProductionCalculatorProps) {
  const [selection, setSelection] = useState<Record<string, number>>({})
  const units = useMemo(() => loadUnits(), [])

  function adjust(unitType: string, delta: number) {
    setSelection(prev => {
      const current = prev[unitType] ?? 0
      const next = Math.max(0, current + delta)
      if (next === 0) {
        const { [unitType]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [unitType]: next }
    })
  }

  const result = calculateProduction(selection, units, { hasSarween })

  return (
    <div className={styles.calculator}>
      <h3 className={styles.heading}>Production Calculator</h3>
      <div className={styles.unitGrid}>
        {PRODUCIBLE_TYPES.map(type => {
          const unit = units.find(u => u.type === type)
          if (!unit) return null
          const qty = selection[type] ?? 0
          return (
            <div key={type} className={styles.unitRow}>
              <span className={styles.unitName}>
                {unit.name} {unit.cost !== undefined && `(${unit.cost})`}
              </span>
              <div className={styles.controls}>
                <button onClick={() => adjust(type, -1)} disabled={qty === 0}>-</button>
                <span className={styles.qty}>{qty}</span>
                <button onClick={() => adjust(type, 1)}>+</button>
              </div>
            </div>
          )
        })}
      </div>
      {result.productionUnits > 0 && (
        <div className={styles.summary}>
          <div className={styles.summaryRow}>
            <span>Cost</span>
            <span>
              {result.totalCost}
              {result.sarweenDiscount > 0 && (
                <span className={styles.discount}>
                  {' '}({result.totalCost + result.sarweenDiscount} - {result.sarweenDiscount} Sarween)
                </span>
              )}
            </span>
          </div>
          <div className={styles.summaryRow}>
            <span>Production</span>
            <span>{result.productionUnits} units</span>
          </div>
        </div>
      )}
    </div>
  )
}
```

Create `src/components/ProductionCalculator.module.css`:

```css
.calculator {
  margin-top: 1.5rem;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 0.5rem;
  background: #fafafa;
}

.heading {
  font-size: 1rem;
  margin: 0 0 0.75rem;
}

.unitGrid {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.unitRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.unitName {
  font-size: 0.875rem;
}

.controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.controls button {
  width: 2rem;
  height: 2rem;
  font-size: 1rem;
  cursor: pointer;
}

.qty {
  min-width: 1.5rem;
  text-align: center;
}

.summary {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #ddd;
}

.summaryRow {
  display: flex;
  justify-content: space-between;
  font-weight: bold;
  margin-bottom: 0.25rem;
}

.discount {
  font-weight: normal;
  font-size: 0.8rem;
  color: #666;
}
```

- [ ] **Step 6: Embed in ContextViewScreen**

Modify `src/screens/ContextViewScreen.tsx` — add below the groups when `windowPrefix === 'tactical.production'`:

```tsx
import { ProductionCalculator } from '../components/ProductionCalculator'

// Inside the return, after the groups map:
{decodedPrefix === 'tactical.production' && (
  <ProductionCalculator
    hasSarween={game?.ownedTechIds.includes('sarween-tools') ?? false}
  />
)}
```

- [ ] **Step 7: Verify in browser**

Dashboard → Production → should see calculator below (empty) reminders.

- [ ] **Step 8: Commit**

```bash
git add src/ && git commit -m "add production calculator with sarween support"
```

---

### Task 13: PWA setup & GitHub Pages config

**Files:**
- Modify: `vite.config.ts`
- Create: `public/manifest.json`
- Create: `public/icons/` (placeholder icons)
- Modify: `index.html` — add manifest link
- Modify: `package.json` — add deploy script

- [ ] **Step 1: Install PWA plugin**

```bash
npm install -D vite-plugin-pwa
```

- [ ] **Step 2: Configure PWA in vite.config.ts**

```typescript
import { VitePWA } from 'vite-plugin-pwa'

// Add to plugins array:
VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    name: 'TI4 Turn Helper',
    short_name: 'TI4 Helper',
    description: 'Twilight Imperium 4 companion app',
    theme_color: '#0066cc',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,json,png}'],
  },
})
```

- [ ] **Step 3: Add base path for GitHub Pages**

In `vite.config.ts`, add `base: '/ti-turn-helper/'` (or whatever the repo name is).

Also add to the `BrowserRouter` in `App.tsx`:

```tsx
<BrowserRouter basename="/ti-turn-helper">
```

- [ ] **Step 4: Add deploy script**

In `package.json` scripts:

```json
"predeploy": "npm run build",
"deploy": "npx gh-pages -d dist"
```

```bash
npm install -D gh-pages
```

- [ ] **Step 5: Build and verify**

```bash
npm run build
npx serve dist
```

Open in browser, verify app works from built output.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "add PWA config and GitHub Pages deploy"
```

---

## Chunk 5: Data Enrichment

### Task 14: Enrich technologies with PlayTiming

**Files:**
- Modify: `data/technologies.json`

This is the largest manual task. Each tech needs `playTimings` added based on its effect text. Approach:

- [ ] **Step 1: Define enrichment patterns**

Review all tech descriptions. Map each to the correct window + timing. Examples:

| Tech | Window | Timing |
|------|--------|--------|
| Sarween Tools | `tactical.production` | `during` |
| Plasma Scoring | `tactical.space_combat.combat_rolls` + `tactical.invasion.bombardment` | `during` |
| Neural Motivator | `status.draw_action_cards` | `during` |
| Hyper Metabolism | `status.gain_redistribute_command_tokens` | `during` |
| Gravity Drive | `tactical.movement` | `during` |
| Antimass Deflectors | `tactical.movement` | `during` |
| Dacxive Animators | `tactical.invasion.ground_combat` | `after` |
| Assault Cannon | `tactical.space_combat` | `start` |
| PDS II (upgrade) | `tactical.space_combat.space_cannon_offense` + `tactical.invasion.space_cannon_defense` | `during` |

- [ ] **Step 2: Add playTimings to each tech in technologies.json**

Work through systematically by color group. Each tech gets a `playTimings` array. Techs with no contextual trigger (e.g. unit stat upgrades only relevant for calculator) can have an empty array or be skipped.

- [ ] **Step 3: Validate with a script or test**

Write a quick validation test that imports all techs and checks all `playTimings` have valid windows:

```typescript
import { describe, it, expect } from 'vitest'
import { loadTechnologies } from '../../data'
import { isValidWindow } from '../../types'

describe('technology data', () => {
  it('all playTimings have valid windows', () => {
    const techs = loadTechnologies()
    for (const tech of techs) {
      for (const pt of tech.playTimings ?? []) {
        expect(isValidWindow(pt.window), `${tech.name}: invalid window "${pt.window}"`).toBe(true)
      }
    }
  })
})
```

- [ ] **Step 4: Commit**

```bash
git add data/technologies.json src/ && git commit -m "enrich technologies with playTiming data"
```

---

### Task 15: Enrich action cards with PlayTiming

**Files:**
- Modify: `data/action-cards.json`

- [ ] **Step 1: Migrate existing playTiming strings to playTimings arrays**

Parse each card's `playTiming` string → map to structured `PlayTiming` object. The existing `playTiming2` on the first card is a reference for the pattern.

- [ ] **Step 2: Add playTimings to all action cards**

Work through alphabetically. Each card's `playTiming` text maps to a window + timing.

- [ ] **Step 3: Validate**

Same pattern as Task 14 — test that all windows are valid.

- [ ] **Step 4: Commit**

```bash
git add data/action-cards.json && git commit -m "enrich action cards with playTiming data"
```

---

### Task 16: Enrich factions, leaders, mechs, promissory notes, relics

**Files:**
- Modify: `data/factions.json` — add `playTimings` to abilities, leaders, mechs
- Modify: `data/promissory-notes.json` — add `playTimings`, add generic promissory notes
- Modify: `data/relics.json` — add `playTimings`

- [ ] **Step 1: Enrich faction abilities**

Each faction ability → map to window + timing based on effect text.

- [ ] **Step 2: Enrich leaders**

Each leader (agent/commander/hero) → map to window + timing.

- [ ] **Step 3: Enrich mechs**

Each faction mech → map to window + timing.

- [ ] **Step 4: Add generic promissory notes**

Add these to `data/promissory-notes.json`:
- Ceasefire
- Support for the Throne
- Trade Agreement
- Political Secret

With appropriate `playTimings`.

- [ ] **Step 5: Enrich faction-specific promissory notes**

Map each to window + timing.

- [ ] **Step 6: Enrich relics**

Map each relic to window + timing.

- [ ] **Step 7: Validate all enriched data**

Run validation tests across all data files.

- [ ] **Step 8: Commit**

```bash
git add data/ && git commit -m "enrich factions, leaders, promissory notes, relics with playTiming data"
```

---

### Task 17: Enrich units data for calculator

**Files:**
- Modify: `data/units.json` — add upgraded unit variants

- [ ] **Step 1: Add upgraded unit stats**

Add to `units.json`:
- Dreadnought II (cost 4, combat 5, move 2, capacity 1, sustain + bombardment 5)
- Cruiser II (cost 2, combat 6, move 3, capacity 1)
- Carrier II (cost 3, combat 9, move 2, capacity 6)
- Destroyer II (cost 1, combat 8, move 2, AFB 6 x3)
- Fighter II (cost 0.5, combat 8, move 2)
- Infantry II (cost 0.5, combat 7)
- PDS II (space cannon 5, planetary shield)
- Space Dock II (production X+2)

Each should have a `upgradeOf` field linking to the base unit and a `techId` linking to the upgrade tech.

- [ ] **Step 2: Update production-calc to use upgraded stats**

Modify `calculateProduction` to accept `ownedTechIds` and swap base units for upgraded versions when the upgrade tech is owned.

- [ ] **Step 3: Update tests**

Add test case for upgraded unit costs.

- [ ] **Step 4: Commit**

```bash
git add data/units.json src/engine/ && git commit -m "add upgraded unit variants and update production calc"
```

---

## Unresolved Questions

- Exact misc triggers list? define as they come up during enrichment
- Some techs are pure passive stat boosts (e.g. +1 move) — show in context or skip?
- Search in manage screen: also search across all tabs, or just active tab? (currently active tab only)
- Action card `count` from deck vs quantity owned UX — +/- buttons capped at deck count?
- `base` path for GitHub Pages — confirm repo name for `basename`
