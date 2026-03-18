import { useState, useEffect, useCallback } from 'react'
import { getGame, updateGame } from '../db'
import {
  loadTechnologies, loadActionCards, loadFactions,
  loadPromissoryNotes, loadRelics, resolveOmegaReplacements,
} from '../data'
import {
  resolveDisplayableItems, filterByContext, groupByWindow,
} from '../engine'
import type { WindowGroup } from '../engine'
import type { Game } from '../types'

interface UseGameContextResult {
  game: Game | null
  groups: WindowGroup[]
  loading: boolean
  removeItem: (itemId: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useGameContext(gameId: string | undefined, windowPrefix: string): UseGameContextResult {
  const [game, setGame] = useState<Game | null>(null)
  const [groups, setGroups] = useState<WindowGroup[]>([])
  const [loading, setLoading] = useState(true)

  const computeGroups = useCallback((g: Game) => {
    const technologies = resolveOmegaReplacements(loadTechnologies(), g.expansions)
    const actionCards = resolveOmegaReplacements(loadActionCards(), g.expansions)
    const promissoryNotes = resolveOmegaReplacements(loadPromissoryNotes(), g.expansions)
    const relics = loadRelics().filter(r => g.expansions.includes(r.source as never))
    const factions = loadFactions().filter(f => g.expansions.includes(f.source as never))

    const allDisplayable = resolveDisplayableItems(g, {
      technologies, actionCards, promissoryNotes, relics, factions,
    })
    const filtered = filterByContext(allDisplayable, windowPrefix)
    return groupByWindow(filtered)
  }, [windowPrefix])

  const load = useCallback(async () => {
    if (!gameId) return
    setLoading(true)
    const g = await getGame(gameId)
    if (g) {
      setGame(g)
      setGroups(computeGroups(g))
    }
    setLoading(false)
  }, [gameId, computeGroups])

  useEffect(() => { load() }, [load])

  const removeItem = useCallback(async (itemId: string) => {
    if (!game) return

    const updatedGame = { ...game }

    // Try removing from owned techs
    if (updatedGame.ownedTechIds.includes(itemId)) {
      updatedGame.ownedTechIds = updatedGame.ownedTechIds.filter(id => id !== itemId)
    }
    // Try removing from action cards (decrement quantity, remove if 0)
    else {
      const cardIndex = updatedGame.ownedActionCards.findIndex(c => c.id === itemId)
      if (cardIndex !== -1) {
        const cards = [...updatedGame.ownedActionCards]
        const card = { ...cards[cardIndex]! }
        card.quantity -= 1
        if (card.quantity <= 0) {
          cards.splice(cardIndex, 1)
        } else {
          cards[cardIndex] = card
        }
        updatedGame.ownedActionCards = cards
      }
      // Try removing from promissory notes
      else if (updatedGame.ownedPromissoryNoteIds.includes(itemId)) {
        updatedGame.ownedPromissoryNoteIds = updatedGame.ownedPromissoryNoteIds.filter(id => id !== itemId)
      }
      // Try removing from relics
      else if (updatedGame.ownedRelicIds.includes(itemId)) {
        updatedGame.ownedRelicIds = updatedGame.ownedRelicIds.filter(id => id !== itemId)
      }
      // Faction items (abilities, leaders, mechs) are not removable
      else {
        return
      }
    }

    await updateGame(game.id, updatedGame)
    setGame(updatedGame)
    setGroups(computeGroups(updatedGame))
  }, [game, computeGroups])

  return { game, groups, loading, removeItem, refresh: load }
}
