import type { DisplayableItem } from '../types'

export function filterByContext(items: DisplayableItem[], windowPrefix: string): DisplayableItem[] {
  return items.filter(item =>
    item.playTimings.some(pt =>
      pt.window === windowPrefix || pt.window.startsWith(windowPrefix + '.')
    )
  )
}
