# Bug: context view shows out-of-context window groups

**Status:** FIXED — `groupByWindow` now takes `windowPrefix` and skips out-of-context timings
(shared `isWindowInContext` predicate with `filterByContext`). Verified by unit test +
Playwright (Barony of Letnev → Space Combat shows only Space Cannon Offense + Combat Rolls,
no Invasion groups).
**Severity:** medium — confusing/incorrect grouping, no data loss

## Symptom

Open a context view (e.g. **Space Combat**) and you see group headers that belong to a
*different* context — e.g. under **Space Combat** you get **Bombardment**, **Ground Combat**,
**Space Cannon Defense** (those are `tactical.invasion.*` windows, i.e. the Invasion phase).

The same item also appears multiple times, once per window it can trigger in.

## Repro

1. New game, any faction (used Federation of Sol).
2. Own items that have play timings in *both* space combat and invasion windows, e.g.:
   - `plasma-scoring` (tech) → `tactical.space_combat.space_cannon_offense` **and** `tactical.invasion.bombardment`
   - `morale-boost` (action card) → `tactical.space_combat.combat_rolls` **and** `tactical.invasion.ground_combat`
   - `antimass-deflectors` (tech) → `space_cannon_offense` **and** `tactical.invasion.space_cannon_defense`
3. Dashboard → **Space Combat**.
4. Scroll: extra groups **Bombardment / Space Cannon Defense / Ground Combat** appear, with the
   above items duplicated into them.

## Root cause

`filterByContext` is correct — it keeps an item if **any** of its play timings matches the prefix:

`src/engine/filter-by-context.ts`
```ts
item.playTimings.some(pt => pt.window === windowPrefix || pt.window.startsWith(windowPrefix + '.'))
```

But `groupByWindow` then buckets each kept item under **every** one of its play-timing windows —
including windows outside the active context:

`src/engine/group-by-window.ts:51-63`
```ts
for (const item of items) {
  for (const pt of item.playTimings) {          // <-- no prefix check
    const existing = windowItems.get(pt.window)
    ...
  }
}
```

So a multi-timing item (space combat + invasion) creates Invasion groups while you're in the
Space Combat context. `groupByWindow` doesn't know the prefix, so it can't exclude them.

Call site (prefix IS available here):
`src/hooks/use-game-context.ts:36-37`
```ts
const filtered = filterByContext(allDisplayable, windowPrefix)
return groupByWindow(filtered)            // prefix not passed through
```

## Suggested fix

Thread `windowPrefix` into `groupByWindow` and skip play timings whose window is outside the
context (reuse the same predicate as `filterByContext` — consider extracting it to share):

```ts
// group-by-window.ts
export function groupByWindow(items: DisplayableItem[], windowPrefix: string): WindowGroup[] {
  const inContext = (w: string) => w === windowPrefix || w.startsWith(windowPrefix + '.')
  ...
  for (const item of items) {
    for (const pt of item.playTimings) {
      if (!inContext(pt.window)) continue   // <-- only group in-context windows
      ...
    }
  }
}
```
```ts
// use-game-context.ts
return groupByWindow(filtered, windowPrefix)
```

Edge case to keep: a top-level prefix like `tactical.space_combat` should still match the bare
`tactical.space_combat` window AND its `.sub_steps` (the predicate already does both).

## Affected files

- `src/engine/group-by-window.ts` — add `windowPrefix` param + in-context skip
- `src/hooks/use-game-context.ts` — pass `windowPrefix`
- `src/engine/__tests__/group-by-window.test.ts` — signature change; add a case asserting
  out-of-context windows are excluded (multi-timing item across two phases)
- check other `groupByWindow` callers (currently only the hook)

## Notes

- Pure engine/logic fix; independent of the Design A visual work.
- Worth also confirming desired behaviour for an item with the SAME window twice — current dedup
  by `id` within a group already handles that.
