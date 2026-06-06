# Swipe-to-Delete Cards — Design Spec

## Problem

On `ContextViewScreen`, cards (`ItemCard`) use long-press-to-delete. Two consequences:

1. Long-press is the mobile text-selection gesture, and `.card` sets `user-select: none` — so **users can't select/copy card text**.
2. Deletion is hidden/undiscoverable.

**Goal:** let users copy text from cards, and replace long-press-delete with an iOS-Notes-style swipe-to-reveal Delete button.

## Scope

`ContextViewScreen` only — the sole non-manage screen with removable cards (`ItemCard` rendered via `WindowGroupDisplay`). Manage screen is untouched (it has its own add/remove UI).

## Interaction Design (iOS Notes pattern)

Touch only. Mouse events are left alone, so desktop mouse-drag remains native text-selection. (Per decision: app is phone-first; no desktop delete.)

- **Swipe either direction** on a card:
  - Swipe **left** → card slides left, revealing a red **Delete** button on the **right**.
  - Swipe **right** → card slides right, revealing a red **Delete** button on the **left**.
- **Release** decides snap:
  - Dragged past the open threshold (≈ half the button width) → snap **open** (button fully revealed, card rests offset by button width).
  - Otherwise → snap **closed**.
- **Tap Delete** → card animates fully off-screen, then item is removed.
- **Anything else snaps the card closed:**
  - Tap the card body
  - Swipe back the other way
  - Open a different card (only **one card open at a time**)
  - Tap empty space in the content area
- **Non-removable cards refuse:** faction ability / leader / mech / unit ability render **no** Delete button; a drag rubber-bands slightly and always snaps back to closed.
- `touch-action: pan-y` + axis-lock (engage horizontal drag only when the initial movement is horizontal-dominant) → vertical scroll is preserved.

### Affordance

Delete is **text** ("Delete"), styled to match the dark HUD theme (mono, uppercase, `--danger` red) — not an icon. Full row height, anchored to the revealed edge.

## Removability

`removable` is derived from `sourceType`, mirroring what `useGameContext.removeItem` already supports:

- **Removable:** `tech`, `action_card`, `promissory_note`, `relic`
- **Not removable (refuse):** `faction_ability`, `leader`, `mech`, `unit_ability`

Single source of truth — add to `src/types/play-timing.ts`:

```ts
export const REMOVABLE_SOURCE_TYPES = new Set<ItemSourceType>([
  'tech', 'action_card', 'promissory_note', 'relic',
])
export function isRemovableSourceType(t: ItemSourceType): boolean {
  return REMOVABLE_SOURCE_TYPES.has(t)
}
```

## Copy-Paste Fix

The actual blocker is independent of the gesture:

- Remove `user-select: none` from `.card`.
- Remove the long-press handlers/timer entirely.

Result: long-press now triggers the OS text-selection UI; a *tap* (not a long-press) is what closes an open row — so the close-on-tap behavior never conflicts with selecting/copying text.

## Row Structure

Each card becomes a swipeable row owned by `ItemCard`:

```
<div class="row">                         /* position: relative; overflow-x: hidden */
  <button class="deleteLeft">Delete</button>   /* absolute left:0,  full height, behind */
  <button class="deleteRight">Delete</button>  /* absolute right:0, full height, behind */
  <div class="card" style="translateX(dx)">…</div>  /* opaque bg, z above buttons */
</div>
```

- At rest the opaque card covers both buttons (`translateX(0)`).
- Card slid left (`translateX(-W)`) reveals the right button; slid right (`+W`) reveals the left button.
- Both buttons call the same `onDelete`.

`W` = reveal/button width ≈ 80px.

### State

- **Live drag** (`dx`) and **resolved open side** (`'left' | 'right' | null`) are internal to `ItemCard`.
- **`isOpen`** is controlled by the parent to enforce single-open. When `isOpen` flips to `false` (another card opened, or outside tap), `ItemCard` animates back to closed and clears its side.
- Resting transform: `right` side → `translateX(+W)`; `left` side → `translateX(-W)`; closed → `translateX(0)`.

### Animation

- During drag: no transition, `translateX` follows the finger (clamped, with light rubber-band past `W`).
- On snap (open/closed): `transition: transform .2s ease`.
- On delete: animate `translateX` fully off-screen in the open direction (+ fade), then call `onDelete`.

## Component Changes

### `ItemCard.tsx`
- Drop `onLongPress` and the press-timer logic.
- New props: `onDelete?: () => void` (absent ⇒ not removable ⇒ refuse), `isOpen: boolean`, `onOpenChange: (open: boolean) => void`.
- Add touch handlers (`onTouchStart/Move/End`) implementing drag, axis-lock, snap, and the rubber-band-refuse for non-removable.
- Render the row structure with left/right Delete buttons (only when removable).
- Tap on card body while open → `onOpenChange(false)`.

### `ItemCard.module.css`
- Remove `user-select: none`.
- Add `touch-action: pan-y` and `overflow-x: hidden` on the row.
- Add `.row`, `.deleteLeft`/`.deleteRight` (red, `--danger`), transform transition, and the off-screen exit state.

### `WindowGroupDisplay.tsx`
- Replace `onLongPressItem` with: `openId`, `onOpenChange(itemId, open)`, and `onDeleteItem(itemId)`.
- Pass `onDelete` to a card only when `isRemovableSourceType(item.sourceType)`.
- Pass `isOpen={openId === item.id}`.

### `ContextViewScreen.tsx`
- Hold `openId: string | null`.
- Swipe-delete calls `removeItem(itemId)` directly (the reveal is the confirmation step — no modal).
- Remove `ConfirmModal`, `pendingRemoval` state, and the `handleLongPress`/`handleConfirmRemove` flow.
- Tapping empty space in the content area clears `openId`.

### `types/play-timing.ts`
- Add `REMOVABLE_SOURCE_TYPES` + `isRemovableSourceType()`.

### Delete (now unused)
- `ConfirmModal.tsx`
- `ConfirmModal.module.css`

(Confirmed: `ConfirmModal` is referenced only by `ContextViewScreen`.)

## Edge Cases

- **Vertical scroll vs swipe:** axis-lock on first move + `touch-action: pan-y`.
- **Open then scroll/tap elsewhere:** outside tap clears `openId`; opening another card closes the previous.
- **Off-screen exit overflow:** row is `overflow-x: hidden` so the exiting card doesn't create a horizontal scrollbar.
- **Non-removable drag:** clamps + snaps back; never opens; no Delete button in the DOM.
- **Rapid re-swipe / list re-render after delete:** `removeItem` already recomputes groups; deleted item unmounts.

## Testing

`ItemCard.test.tsx` — replace the two long-press tests:

- renders name / description / source badge / timing (keep existing)
- swipe left past threshold on a removable card → `onOpenChange(true)`; Delete button present; clicking it → `onDelete` called
- swipe right past threshold → reveals (left) Delete button → `onDelete`
- short drag under threshold → snaps closed, `onOpenChange` not left open
- non-removable (no `onDelete`) → no Delete button rendered; swipe never opens
- tapping card body while open → `onOpenChange(false)`

Use `fireEvent.touchStart/Move/End` with `clientX` in `touches`/`changedTouches`. Core open/delete decision keyed on **distance threshold** (deterministic); flick-velocity is an optional enhancement not unit-tested.

## Verification

Playwright on the dev server (phone viewport):
- swipe a tech card → Delete reveals → tap → card removed
- swipe a faction ability → rubber-bands, refuses (no Delete)
- open card A, then card B → A closes
- tap empty space → open card closes
- long-press card text → selection works; copy succeeds
