# Missing: Agendas / Laws category in Manage

**Status:** RESOLVED (522a52c) — Laws tab added; enacted laws w/ playTimings surface in
context views; `removedByPok` now respected. See
`docs/superpowers/specs/2026-06-05-agenda-laws-manage-tab-design.md`.
**Severity:** medium — whole item category can't be tracked

## Symptom

Manage tabs are: **Techs · Action Cards · Promissory · Relics · Leaders**. There is no tab for
**Agendas** — specifically **Laws** (agendas that stay in play and have ongoing play timings).
No way to mark which laws are in play, so they never surface in the phase context views.

(The Manage tabs were just switched to wrap onto two lines partly to leave room for this.)

## Context

- Data already exists: `data/agendas.json` (~63 entries).
- TI4 agendas split into:
  - **Laws** — persistent, remain in play, affect the game continuously (these are the ones worth
    surfacing as ongoing context; many have play timings).
  - **Directives** — one-shot, resolve immediately and are discarded (no ongoing state).
- Only **Laws in play** are meaningful to track per game. This is *table* state, not "owned" like
  techs/cards — any player can be affected.

## What's needed (sketch)

1. `src/types/game.ts` — add a field, e.g. `enactedLawIds: string[]` (laws currently in play).
2. Data loader for agendas (mirror `src/data/load-*.ts`); expose laws (filter directives out).
3. `src/hooks/use-manage-game.ts` — load agendas, expose `toggleLaw` + enacted state.
4. `src/screens/ManageScreen.tsx` — add `'Laws'` (or `'Agendas'`) to `TABS` + a tab body
   (reuse the `TechList` grid/toggle style).
5. `src/engine/resolve-displayable-items.ts` — include enacted laws (they have `playTimings`) so
   they appear in the relevant context windows.

## Files

- `src/screens/ManageScreen.tsx`
- `src/hooks/use-manage-game.ts`
- `src/engine/resolve-displayable-items.ts`
- `src/types/game.ts`
- `src/data/` (new agendas loader)
- `data/agendas.json` (exists)

## Decisions to make

- Tab label: "Laws" vs "Agendas" (include directives or laws-only?). Recommend **Laws-only**,
  since directives have no persistent state.
- Naming of the game field + whether it's truly per-game table state.
