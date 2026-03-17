import { db } from './database'
import type { Game } from '../types/game'
import type { Expansion } from '../types'
import { loadFactions } from '../data'

interface CreateGameInput {
  name: string
  expansions: Expansion[]
  factionId: string
}

export async function createGame(input: CreateGameInput): Promise<string> {
  const id = crypto.randomUUID()
  const factions = loadFactions()
  const faction = factions.find((f) => f.id === input.factionId)
  const startingTech = faction?.startingTech ?? []

  const game: Game = {
    id,
    name: input.name,
    createdAt: new Date(),
    expansions: input.expansions,
    factionId: input.factionId,
    ownedTechIds: [...startingTech],
    ownedActionCards: [],
    ownedPromissoryNoteIds: [],
    ownedRelicIds: [],
    leaderStates: buildInitialLeaderStates(faction),
  }

  await db.games.add(game)
  return id
}

function buildInitialLeaderStates(
  faction: { leaders: { name: string; unlockCondition: string }[] } | undefined,
): Record<string, 'locked' | 'unlocked'> {
  const states: Record<string, 'locked' | 'unlocked'> = {}
  if (!faction) return states
  for (const leader of faction.leaders) {
    states[leader.name] = leader.unlockCondition === 'At Game Start' ? 'unlocked' : 'locked'
  }
  return states
}

export async function getGame(id: string): Promise<Game | undefined> {
  return db.games.get(id)
}

export async function listGames(): Promise<Game[]> {
  return db.games.orderBy('createdAt').reverse().toArray()
}

export async function updateGame(id: string, updates: Partial<Game>): Promise<void> {
  await db.games.update(id, updates)
}

export async function deleteGame(id: string): Promise<void> {
  await db.games.delete(id)
}
