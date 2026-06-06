import type { Timing } from './enums'

export interface PlayTiming {
  wording: string
  window: string
  timing: Timing
  mustBeActivePlayer: boolean
  miscTrigger?: string
}

export const ITEM_SOURCE_TYPES = [
  'tech', 'action_card', 'faction_ability', 'promissory_note',
  'leader', 'relic', 'mech', 'unit_ability', 'law',
] as const
export type ItemSourceType = (typeof ITEM_SOURCE_TYPES)[number]

/** Item types the user owns and can remove from their game (mirrors useGameContext.removeItem). */
const REMOVABLE_SOURCE_TYPES = new Set<ItemSourceType>([
  'tech', 'action_card', 'promissory_note', 'relic',
])

export function isRemovableSourceType(t: ItemSourceType): boolean {
  return REMOVABLE_SOURCE_TYPES.has(t)
}

export interface DisplayableItem {
  id: string
  name: string
  description: string
  sourceType: ItemSourceType
  playTimings: PlayTiming[]
}
