import type { DisplayableItem } from '../types'
import type { Game } from '../types'
import type { Technology, ActionCard, PromissoryNote, Relic, Faction, Agenda } from '../types'
import { lawEffectText } from '../data'

export interface AllItems {
  technologies: Technology[]
  actionCards: ActionCard[]
  promissoryNotes: PromissoryNote[]
  relics: Relic[]
  factions: Faction[]
  laws: Agenda[]
}

export function resolveDisplayableItems(game: Game, allItems: AllItems): DisplayableItem[] {
  const result: DisplayableItem[] = []

  // Owned techs with playTimings
  const techMap = new Map(allItems.technologies.map(t => [t.id, t]))
  for (const techId of game.ownedTechIds) {
    const tech = techMap.get(techId)
    if (tech?.playTimings?.length) {
      result.push({
        id: tech.id,
        name: tech.name,
        description: tech.description,
        sourceType: 'tech',
        playTimings: tech.playTimings,
      })
    }
  }

  // Owned action cards with playTimings
  const cardMap = new Map(allItems.actionCards.map(c => [c.id, c]))
  for (const owned of game.ownedActionCards) {
    const card = cardMap.get(owned.id)
    if (card?.playTimings?.length) {
      result.push({
        id: card.id,
        name: card.name,
        description: card.description,
        sourceType: 'action_card',
        playTimings: card.playTimings,
      })
    }
  }

  // Owned promissory notes with playTimings
  const noteMap = new Map(allItems.promissoryNotes.map(n => [n.id, n]))
  for (const noteId of game.ownedPromissoryNoteIds) {
    const note = noteMap.get(noteId)
    if (note?.playTimings?.length) {
      result.push({
        id: note.id,
        name: note.name,
        description: note.description,
        sourceType: 'promissory_note',
        playTimings: note.playTimings,
      })
    }
  }

  // Owned relics with playTimings
  const relicMap = new Map(allItems.relics.map(r => [r.id, r]))
  for (const relicId of game.ownedRelicIds) {
    const relic = relicMap.get(relicId)
    if (relic?.playTimings?.length) {
      result.push({
        id: relic.id,
        name: relic.name,
        description: relic.description,
        sourceType: 'relic',
        playTimings: relic.playTimings,
      })
    }
  }

  // Enacted laws with playTimings (passive laws have none → tab-only, never surface here)
  const lawMap = new Map(allItems.laws.map(l => [l.id, l]))
  for (const lawId of game.enactedLawIds ?? []) {
    const law = lawMap.get(lawId)
    if (law?.playTimings?.length) {
      result.push({
        id: law.id,
        name: law.name,
        description: lawEffectText(law),
        sourceType: 'law',
        playTimings: law.playTimings,
      })
    }
  }

  // Faction-specific items
  const faction = allItems.factions.find(f => f.id === game.factionId)
  if (faction) {
    // Faction abilities (always available)
    for (const ability of faction.abilities) {
      if (ability.playTimings?.length) {
        result.push({
          id: `${faction.id}.ability.${ability.name}`,
          name: ability.name,
          description: ability.description,
          sourceType: 'faction_ability',
          playTimings: ability.playTimings,
        })
      }
    }

    // Leaders — only unlocked ones
    for (const leader of faction.leaders) {
      const state = game.leaderStates[leader.name]
      if (state === 'unlocked' && leader.playTimings?.length) {
        result.push({
          id: `${faction.id}.leader.${leader.name}`,
          name: leader.name,
          description: leader.ability,
          sourceType: 'leader',
          playTimings: leader.playTimings,
        })
      }
    }

    // Mech (always available)
    if (faction.mech.playTimings?.length) {
      result.push({
        id: `${faction.id}.mech`,
        name: faction.mech.name,
        description: faction.mech.description,
        sourceType: 'mech',
        playTimings: faction.mech.playTimings,
      })
    }
  }

  return result
}
