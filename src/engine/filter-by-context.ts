import type { DisplayableItem } from '../types'

/**
 * A window belongs to a context if it IS the prefix or sits beneath it.
 * Shared by filterByContext (keep/drop items) and groupByWindow (which buckets
 * to place them under) so the two can never drift — drift was the cause of the
 * out-of-context grouping bug.
 */
export function isWindowInContext(window: string, windowPrefix: string): boolean {
  return window === windowPrefix || window.startsWith(windowPrefix + '.')
}

export function filterByContext(items: DisplayableItem[], windowPrefix: string): DisplayableItem[] {
  return items.filter(item =>
    item.playTimings.some(pt => isWindowInContext(pt.window, windowPrefix))
  )
}
