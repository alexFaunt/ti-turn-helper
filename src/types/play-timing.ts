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
  'leader', 'relic', 'mech', 'unit_ability',
] as const
export type ItemSourceType = (typeof ITEM_SOURCE_TYPES)[number]

export interface DisplayableItem {
  id: string
  name: string
  description: string
  sourceType: ItemSourceType
  playTimings: PlayTiming[]
}
