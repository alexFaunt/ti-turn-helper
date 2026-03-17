import type { Expansion } from './enums'

export interface OwnedActionCard {
  id: string
  quantity: number
}

export type LeaderState = 'locked' | 'unlocked'

export interface Game {
  id: string
  name: string
  createdAt: Date
  expansions: Expansion[]
  factionId: string
  ownedTechIds: string[]
  ownedActionCards: OwnedActionCard[]
  ownedPromissoryNoteIds: string[]
  ownedRelicIds: string[]
  leaderStates: Record<string, LeaderState>
}
