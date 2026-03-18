import { useState, useEffect, useCallback } from 'react'
import { getGame, updateGame } from '../db'
import {
  loadTechnologies, loadActionCards, loadFactions,
  loadPromissoryNotes, loadRelics, resolveOmegaReplacements,
  filterByExpansion,
} from '../data'
import type { Game, Technology, ActionCard, PromissoryNote, Relic, Faction } from '../types'

interface UseManageGameResult {
  game: Game | null
  faction: Faction | undefined
  techs: Technology[]
  actionCards: ActionCard[]
  promissoryNotes: PromissoryNote[]
  relics: Relic[]
  loading: boolean
  toggleTech: (techId: string) => Promise<void>
  adjustActionCard: (cardId: string, delta: number) => Promise<void>
  togglePromissoryNote: (noteId: string) => Promise<void>
  toggleRelic: (relicId: string) => Promise<void>
  toggleLeader: (leaderName: string) => Promise<void>
}

export function useManageGame(gameId: string | undefined): UseManageGameResult {
  const [game, setGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!gameId) return
    setLoading(true)
    const g = await getGame(gameId)
    if (g) setGame(g)
    setLoading(false)
  }, [gameId])

  useEffect(() => { load() }, [load])

  const faction = game
    ? loadFactions().find(f => f.id === game.factionId)
    : undefined

  const techs = game
    ? resolveOmegaReplacements(loadTechnologies(), game.expansions)
    : []

  const actionCards = game
    ? resolveOmegaReplacements(loadActionCards(), game.expansions)
    : []

  const promissoryNotes = game
    ? resolveOmegaReplacements(loadPromissoryNotes(), game.expansions)
    : []

  const relics = game
    ? filterByExpansion(loadRelics(), game.expansions)
    : []

  const persist = useCallback(async (updated: Game) => {
    setGame(updated)
    await updateGame(updated.id, updated)
  }, [])

  const toggleTech = useCallback(async (techId: string) => {
    if (!game) return
    const owned = game.ownedTechIds.includes(techId)
    const ownedTechIds = owned
      ? game.ownedTechIds.filter(id => id !== techId)
      : [...game.ownedTechIds, techId]
    await persist({ ...game, ownedTechIds })
  }, [game, persist])

  const adjustActionCard = useCallback(async (cardId: string, delta: number) => {
    if (!game) return
    const cards = [...game.ownedActionCards]
    const idx = cards.findIndex(c => c.id === cardId)
    if (idx === -1) {
      if (delta > 0) {
        cards.push({ id: cardId, quantity: delta })
      }
    } else {
      const newQty = cards[idx]!.quantity + delta
      if (newQty <= 0) {
        cards.splice(idx, 1)
      } else {
        cards[idx] = { ...cards[idx]!, quantity: newQty }
      }
    }
    await persist({ ...game, ownedActionCards: cards })
  }, [game, persist])

  const togglePromissoryNote = useCallback(async (noteId: string) => {
    if (!game) return
    const owned = game.ownedPromissoryNoteIds.includes(noteId)
    const ownedPromissoryNoteIds = owned
      ? game.ownedPromissoryNoteIds.filter(id => id !== noteId)
      : [...game.ownedPromissoryNoteIds, noteId]
    await persist({ ...game, ownedPromissoryNoteIds })
  }, [game, persist])

  const toggleRelic = useCallback(async (relicId: string) => {
    if (!game) return
    const owned = game.ownedRelicIds.includes(relicId)
    const ownedRelicIds = owned
      ? game.ownedRelicIds.filter(id => id !== relicId)
      : [...game.ownedRelicIds, relicId]
    await persist({ ...game, ownedRelicIds })
  }, [game, persist])

  const toggleLeader = useCallback(async (leaderName: string) => {
    if (!game) return
    const current = game.leaderStates[leaderName] ?? 'locked'
    const leaderStates = {
      ...game.leaderStates,
      [leaderName]: current === 'locked' ? 'unlocked' as const : 'locked' as const,
    }
    await persist({ ...game, leaderStates })
  }, [game, persist])

  return {
    game, faction, techs, actionCards, promissoryNotes, relics, loading,
    toggleTech, adjustActionCard, togglePromissoryNote, toggleRelic, toggleLeader,
  }
}
