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
  /** Laws (persistent agendas) currently in play that affect this player. */
  enactedLawIds: string[]
  leaderStates: Record<string, LeaderState>
  notes?: string
}
