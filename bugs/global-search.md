# Manage search only searches the active category

**Status:** open · UX
**Severity:** medium — search misses items unless you're already on the right tab

## Symptom

On the Manage screen the search box only filters the **currently selected tab**. Typing a tech
name while the **Action Cards** tab is active shows nothing; you have to know which tab the item
lives in and switch to it first. Expected: search filters **all categories at once**.

## Root cause

`src/screens/ManageScreen.tsx` — `search` is global state, but `filterByName` is applied only to
the data of whichever tab is rendered:

```tsx
const query = search.toLowerCase()
function filterByName<T extends { name: string }>(items: T[]): T[] {
  if (!query) return items
  return items.filter(item => item.name.toLowerCase().includes(query))
}
// ...applied per-tab:
{activeTab === 'Techs' && <TechList techs={filterByName(techs)} .../>}
{activeTab === 'Action Cards' && <ActionCardList cards={filterByName(actionCards)} .../>}
// leaders use a separate inline filter (line ~90)
```

So only the active tab's list narrows; other categories are never consulted.

## Desired behaviour

When the query is non-empty, search across **techs + action cards + promissory + relics +
leaders** simultaneously. Options (pick one):

- **Combined results view:** when searching, ignore the active tab and render one results list
  grouped by category (each group shows its matches + the normal toggle control). Clearing the
  search returns to the tabbed view.
- **Match counts on tabs:** badge each tab with its number of matches so the user sees where hits
  are, then switches.

Recommend the **combined results view** — fewest taps, matches the "global search" intent.

## Files

- `src/screens/ManageScreen.tsx` (search render logic; unify the leaders inline filter at ~L90)
- possibly a small `SearchResults` component to render the grouped cross-category matches

## Notes

- Every category item already has a `name`, so the generic `filterByName` works across all of them.
- Keep per-category toggle handlers wired through when rendering combined results.
