# New game — expansion selection should be cumulative / hierarchical

**Status:** open · needs rules verification before implementing
**Severity:** medium — lets you build invalid expansion combos

## Symptom

On **New Game → Select Expansions**, each expansion is an independent toggle. You can enable
**Codex II** without **Codex I** (or without PoK). Expansions are layered content tiers — selecting
a higher tier should imply all lower tiers.

Expected: selecting **Codex II** auto-selects Base + PoK + Codex I + Codex II. Deselecting a lower
tier should clear the higher tiers above it. (Base is already locked/required.)

Assumed tier order: `base → pok → codex-1 → codex-2 → codex-3 → codex-4`.

## ⚠️ VERIFY ON INTERNET FIRST

Confirm the real dependency rule before coding — do **not** assume. Check official TI4 sources:

- Do all codices require **Prophecy of Kings**, or only some? (Codex I "Ordinian" predates PoK;
  Codex III "Vigil" and IV "Liberation" are PoK-era.)
- Are codices strictly **ordered** (does Codex II require Codex I), or are they independent free
  packs each only requiring base/PoK? i.e. is it truly linear "everything up to X", or a DAG of
  prerequisites?
- Is **Base + PoK** the only hard pairing, with codices as optional add-ons on top?

The fix shape (linear cascade vs prerequisite graph) depends on the answer.

## Suggested fix (pending verification)

If linear: treat expansions as an ordered list; selecting index `i` enables all `≤ i`, deselecting
`i` disables all `≥ i`. If it's a DAG: encode `requires: Expansion[]` per expansion and
enable/disable transitively.

## Files

- `src/screens/SetupScreen.tsx` — `toggleExpansion` (independent add/remove, ~L26-31); selection UI
- `src/types/enums.ts` — `EXPANSIONS` order / add a prerequisite map
