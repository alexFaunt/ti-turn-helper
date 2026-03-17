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
  const available = filterByExpansion(items, expansions)
  const replacedIds = new Set<string>()
  for (const item of available) {
    if (item.replaces) {
      replacedIds.add(item.replaces)
    }
  }
  return available.filter(item => !replacedIds.has(item.id))
}
