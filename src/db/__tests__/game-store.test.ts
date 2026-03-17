import { describe, it, expect, beforeEach } from 'vitest'
import { createGame, getGame, listGames, updateGame, deleteGame } from '../game-store'
import { db } from '../database'

beforeEach(async () => {
  await db.games.clear()
})

describe('game-store', () => {
  it('creates and retrieves a game', async () => {
    const id = await createGame({
      name: 'Test Game',
      expansions: ['base', 'pok'],
      factionId: 'arborec',
    })
    const game = await getGame(id)
    expect(game).toBeDefined()
    expect(game!.name).toBe('Test Game')
    expect(game!.factionId).toBe('arborec')
    // Arborec starts with magen-defense-grid
    expect(game!.ownedTechIds).toEqual(['magen-defense-grid'])
  })

  it('lists all games', async () => {
    await createGame({ name: 'Game 1', expansions: ['base'], factionId: 'arborec' })
    await createGame({ name: 'Game 2', expansions: ['base'], factionId: 'arborec' })
    const games = await listGames()
    expect(games).toHaveLength(2)
  })

  it('updates a game', async () => {
    const id = await createGame({ name: 'Test', expansions: ['base'], factionId: 'arborec' })
    await updateGame(id, { ownedTechIds: ['magen-defense-grid', 'sarween-tools'] })
    const game = await getGame(id)
    expect(game!.ownedTechIds).toContain('sarween-tools')
  })

  it('deletes a game', async () => {
    const id = await createGame({ name: 'Test', expansions: ['base'], factionId: 'arborec' })
    await deleteGame(id)
    const game = await getGame(id)
    expect(game).toBeUndefined()
  })

  it('sets agent leader to unlocked at game start', async () => {
    const id = await createGame({ name: 'Test', expansions: ['base', 'pok'], factionId: 'arborec' })
    const game = await getGame(id)
    // Arborec agent "Letani Ospha" has unlockCondition "At Game Start"
    expect(game!.leaderStates['Letani Ospha']).toBe('unlocked')
    // Commander should be locked
    expect(game!.leaderStates['Dirzuga Rophal']).toBe('locked')
  })
})
