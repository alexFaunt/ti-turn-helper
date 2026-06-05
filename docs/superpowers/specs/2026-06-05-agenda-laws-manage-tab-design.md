# Agenda Laws — Manage tab + contextual surfacing

**Date:** 2026-06-05 · **Branch:** `alexFaunt/agenda-laws-manage-tab`
**Source bug:** `bugs/missing-agendas.md`

## Goal

Track which **laws** (persistent agendas) are in play per game, and surface the
combat/movement/etc.-relevant ones inside the existing phase context views — e.g. an enacted
*Prophecy of Ixth* shows under **Space Combat → Combat Rolls** ("+1 to your fighters' combat rolls").

Two user-facing parts:
1. **Manage → Laws tab** — pick which laws are in play. The single home for all laws.
2. **Context views** — enacted laws that have `playTimings` flow through the *existing* pipeline,
   identical to techs/cards. Passive laws (no `playTimings`) live only in the tab.

Directives are excluded entirely (verified one-shot; none persist/attach per-player).

## Data verification (done — research gate)

Cross-checked `data/agendas.json` against AsyncTI4 bot data + Lazik10 compendium:
- 63 agendas = 40 laws + 23 directives — exact match. All law/directive types correct.
- The 13 `removedByPok` flags = exactly the 13 PoK-deprecated base agendas. Correct.
- Representative Government correctly has both base (flagged) + PoK entries.

Two data bugs to fix as part of this work:
- **`Minister of Antiques` → `Minister of Antiquities`** — fix `name` *and* `id`
  (`minister-of-antiques` → `minister-of-antiquities`). It's a PoK directive.
- **`removedByPok` is dead data** — never read in `src/`. Activate it (see below).

## `removedByPok` fix (general, not laws-only)

Currently `filterByExpansion` filters only by `source ∈ expansions`; `removedByPok` is ignored.
Fix it at the shared chokepoint so **every** category respects it (techs/cards/notes route through
`resolveOmegaReplacements` → `filterByExpansion`; relics use it directly):

```ts
// src/data/filter-by-expansion.ts
interface HasSource { id: string; source: string; replaces?: string; removedByPok?: boolean }

export function filterByExpansion<T extends HasSource>(items: T[], expansions: Expansion[]): T[] {
  const set = new Set<string>(expansions)
  const pok = set.has('pok')
  return items.filter(item => set.has(item.source) && !(pok && item.removedByPok))
}
```

Rule: base-only game → removed laws still available; base+PoK game → dropped. Matches TI4.
Also switch `use-game-context.ts`'s inline relic filter to `filterByExpansion` for consistency.

## Types

```ts
// src/types/game.ts — add to Game
enactedLawIds: string[]

// src/types/items.ts — new
export interface Agenda {
  id: string
  name: string
  type: 'law' | 'directive'
  electionType: string
  for?: string
  against?: string
  description?: string
  source: string
  removedByPok?: boolean
  replaces?: string
  playTimings?: PlayTiming[]
}

// src/types/play-timing.ts — add 'law' to ITEM_SOURCE_TYPES
```

**Law effect text** (display): `description ?? for ?? ''` — for For/Against laws show the **"For"**
outcome (the lasting law). Export a helper `lawEffectText(law)` from the loader; used by both the
Manage list and `resolveDisplayableItems`.

## Data loader

```ts
// src/data/load-agendas.ts
export function loadAgendas(): Agenda[]                  // raw agendas.json
export function loadLaws(expansions: Expansion[]): Agenda[]  // type==='law', then filterByExpansion
export function lawEffectText(law: Agenda): string
```
Export both from `src/data/index.ts`. Directives never loaded for UI.

## Engine

`resolveDisplayableItems` — `AllItems` gains `laws: Agenda[]`. Append each enacted law that has
`playTimings`:
```ts
for (const lawId of game.enactedLawIds ?? []) {
  const law = lawMap.get(lawId)
  if (law?.playTimings?.length) result.push({
    id: law.id, name: law.name, description: lawEffectText(law),
    sourceType: 'law', playTimings: law.playTimings,
  })
}
```
`filterByContext` / `groupByWindow` need no change — laws ride the window machinery like everything else.

## Hooks

- **`use-manage-game.ts`**: load `laws = loadLaws(game.expansions)`; expose `laws`,
  `enactedLawIds = game.enactedLawIds ?? []`, and `toggleLaw(lawId)` (mirror `toggleTech`).
- **`use-game-context.ts`**: `computeGroups` loads laws + passes to `resolveDisplayableItems`;
  switch relic load to `filterByExpansion`. **`removeItem`: no change** — law ids fall through the
  existing `else { return }` (no-op). Laws are managed only via the tab (per decision: that
  long-press-remove feature is being retired; zero work here).

## DB

- `createGame` sets `enactedLawIds: []`.
- Legacy games: no Dexie version bump (field is non-indexed); default `?? []` on read (hooks do this).

## Components / Screens

- **`src/components/LawList.tsx`** (+ module css, or reuse `TechList.module.css`): grid of laws,
  each row = name + effect text (`lawEffectText`) + enacted toggle. Mirror `TechList` structure
  (`ownedTechIds`/`onToggle` → `enactedLawIds`/`onToggle`).
- **`ManageScreen.tsx`**: add `'Laws'` to `TABS`; add to the cross-category search block
  (`matches.laws`, `matchCount.Laws`, a results section) and the non-search tab body.
- **`ItemCard.tsx`**: `SOURCE_TYPE_LABELS.law = 'Law'`.

## playTimings authoring (canonical text-verified)

Add `playTimings` to these 16 laws (17 entries — Representative Government is two cards). All other
laws stay `playTimings`-free → tab-only.

| Law id | window(s) |
|---|---|
| prophecy-of-ixth | `tactical.space_combat.combat_rolls`, `tactical.production` |
| conventions-of-war | `tactical.invasion.bombardment` |
| regulated-conscription | `tactical.production` |
| minister-of-industry | `tactical.production` |
| enforced-travel-ban | `tactical.movement` |
| nexus-sovereignty | `tactical.movement` |
| shared-research | `tactical.movement` |
| wormhole-reconstruction | `tactical.movement` |
| publicize-weapon-schematics | `tactical.space_combat.assign_hits` |
| articles-of-war | `tactical.invasion.ground_combat` |
| minister-of-policy | `status.draw_action_cards` |
| representative-government | `agenda` |
| representative-government-pok | `agenda` |
| committee-formation | `agenda` |
| checks-and-balances | `strategy` |
| imperial-arbiter | `strategy` |
| minister-of-sciences | `strategy` |

Each `PlayTiming` = `{ wording, window, timing, mustBeActivePlayer }`. `wording` is a concise effect
line (e.g. Prophecy of Ixth combat: `"+1 to your fighters' combat rolls"`; production:
`"Discard unless you produce 2+ fighters"`). `mustBeActivePlayer: false` for global/defensive
effects (combat rolls apply attacking or defending); `true` only for owner-on-their-action effects
(e.g. Minister of Industry placing a space dock). All `window` values are in `VALID_WINDOWS`.

## Testing

- `filter-by-expansion`: `removedByPok` dropped when `pok` present, kept base-only.
- `load-agendas`: `loadLaws` excludes directives + respects `removedByPok`; Minister of Antiquities
  id/name correct.
- `resolve-displayable-items`: enacted law w/ playTimings surfaces (right window); enacted law w/o
  playTimings does not; non-enacted law does not.
- `use-manage-game`: `toggleLaw` adds/removes from `enactedLawIds`.

## Out of scope

- Directives (one-shot — verified none persist).
- Modeling election/ownership (owner vs global). Single flat `enactedLawIds` = "in play & affects
  me" — user curates.
- Law removal from context view (feature being retired).
