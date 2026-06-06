import { describe, it, expect } from 'vitest'
import { resolveDisplayableItems } from '../resolve-displayable-items'
import type { Game } from '../../types'
import type { Technology, ActionCard, Faction, PromissoryNote, Relic, Agenda } from '../../types'
import type { AllItems } from '../resolve-displayable-items'

const combatTiming = {
  wording: 'During combat',
  window: 'tactical.space_combat.combat_rolls',
  timing: 'during' as const,
  mustBeActivePlayer: true,
}

const productionTiming = {
  wording: 'When producing',
  window: 'tactical.production',
  timing: 'during' as const,
  mustBeActivePlayer: true,
}

const mockTech: Technology = {
  id: 'plasma-scoring',
  name: 'Plasma Scoring',
  type: 'color',
  color: 'red',
  prerequisites: [],
  description: 'extra die during combat',
  source: 'base',
  playTimings: [combatTiming],
}

const mockTechNoTimings: Technology = {
  id: 'neural-motivator',
  name: 'Neural Motivator',
  type: 'color',
  color: 'green',
  prerequisites: [],
  description: 'draw extra action card',
  source: 'base',
}

const mockActionCard: ActionCard = {
  id: 'direct-hit',
  name: 'Direct Hit',
  description: 'destroy a ship',
  playTiming: 'After a ship uses SUSTAIN DAMAGE',
  count: 4,
  source: 'base',
  playTimings: [combatTiming],
}

const mockFaction: Faction = {
  id: 'sol',
  name: 'Federation of Sol',
  abilities: [
    { name: 'Orbital Drop', description: 'deploy infantry', playTimings: [productionTiming] },
  ],
  startingTech: [],
  startingUnits: {},
  commodities: 4,
  leaders: [
    {
      type: 'agent',
      name: 'Evelyn Delouis',
      title: 'Sol Agent',
      ability: 'reroll a die',
      unlockCondition: 'always',
      playTimings: [combatTiming],
    },
    {
      type: 'commander',
      name: 'Claire Gibson',
      title: 'Sol Commander',
      ability: 'extra ground forces',
      unlockCondition: 'control 3 planets',
      playTimings: [productionTiming],
    },
  ],
  mech: {
    name: 'ZS Thunderbolt M2',
    description: 'sustain damage in ground combat',
    playTimings: [combatTiming],
  },
  promissoryNote: {
    id: 'sol-pn',
    name: 'Political Favor',
    description: 'remove riders',
    source: 'base',
  },
  source: 'base',
}

const mockPromissoryNote: PromissoryNote = {
  id: 'trade-agreement',
  name: 'Trade Agreement',
  description: 'gain commodities',
  source: 'base',
  playTimings: [productionTiming],
}

const mockRelic: Relic = {
  id: 'maw-of-worlds',
  name: 'Maw of Worlds',
  description: 'gain a technology',
  source: 'pok',
  playTimings: [productionTiming],
}

const mockLaw: Agenda = {
  id: 'prophecy-of-ixth',
  name: 'Prophecy of Ixth',
  type: 'law',
  electionType: 'player',
  description: '+1 to fighter combat rolls',
  source: 'base',
  playTimings: [combatTiming],
}

const mockLawNoTimings: Agenda = {
  id: 'executive-sanctions',
  name: 'Executive Sanctions',
  type: 'law',
  electionType: 'for-or-against',
  for: 'Max 3 action cards in hand',
  source: 'base',
}

function makeGame(overrides: Partial<Game> = {}): Game {
  return {
    id: 'test-game',
    name: 'Test Game',
    createdAt: new Date(),
    expansions: ['base', 'pok'],
    factionId: 'sol',
    ownedTechIds: ['plasma-scoring'],
    ownedActionCards: [{ id: 'direct-hit', quantity: 1 }],
    ownedPromissoryNoteIds: ['trade-agreement'],
    ownedRelicIds: ['maw-of-worlds'],
    enactedLawIds: [],
    leaderStates: {
      'Evelyn Delouis': 'unlocked',
      'Claire Gibson': 'locked',
    },
    ...overrides,
  }
}

function makeAllItems(overrides: Partial<AllItems> = {}): AllItems {
  return {
    technologies: [mockTech, mockTechNoTimings],
    actionCards: [mockActionCard],
    promissoryNotes: [mockPromissoryNote],
    relics: [mockRelic],
    factions: [mockFaction],
    laws: [mockLaw, mockLawNoTimings],
    ...overrides,
  }
}

describe('resolveDisplayableItems', () => {
  it('includes owned tech with playTimings', () => {
    const result = resolveDisplayableItems(makeGame(), makeAllItems())
    const techItems = result.filter(i => i.sourceType === 'tech')
    expect(techItems).toHaveLength(1)
    expect(techItems[0]!.id).toBe('plasma-scoring')
    expect(techItems[0]!.name).toBe('Plasma Scoring')
  })

  it('excludes tech without playTimings', () => {
    const game = makeGame({ ownedTechIds: ['plasma-scoring', 'neural-motivator'] })
    const result = resolveDisplayableItems(game, makeAllItems())
    const techItems = result.filter(i => i.sourceType === 'tech')
    expect(techItems).toHaveLength(1)
    expect(techItems[0]!.id).toBe('plasma-scoring')
  })

  it('includes owned action cards with playTimings', () => {
    const result = resolveDisplayableItems(makeGame(), makeAllItems())
    const cards = result.filter(i => i.sourceType === 'action_card')
    expect(cards).toHaveLength(1)
    expect(cards[0]!.id).toBe('direct-hit')
  })

  it('includes faction abilities with playTimings', () => {
    const result = resolveDisplayableItems(makeGame(), makeAllItems())
    const abilities = result.filter(i => i.sourceType === 'faction_ability')
    expect(abilities).toHaveLength(1)
    expect(abilities[0]!.name).toBe('Orbital Drop')
  })

  it('includes unlocked leaders with playTimings', () => {
    const result = resolveDisplayableItems(makeGame(), makeAllItems())
    const leaders = result.filter(i => i.sourceType === 'leader')
    expect(leaders).toHaveLength(1)
    expect(leaders[0]!.name).toBe('Evelyn Delouis')
  })

  it('excludes locked leaders', () => {
    const result = resolveDisplayableItems(makeGame(), makeAllItems())
    const leaders = result.filter(i => i.sourceType === 'leader')
    const names = leaders.map(l => l.name)
    expect(names).not.toContain('Claire Gibson')
  })

  it('includes faction mech with playTimings', () => {
    const result = resolveDisplayableItems(makeGame(), makeAllItems())
    const mechs = result.filter(i => i.sourceType === 'mech')
    expect(mechs).toHaveLength(1)
    expect(mechs[0]!.name).toBe('ZS Thunderbolt M2')
  })

  it('includes owned promissory notes with playTimings', () => {
    const result = resolveDisplayableItems(makeGame(), makeAllItems())
    const notes = result.filter(i => i.sourceType === 'promissory_note')
    expect(notes).toHaveLength(1)
    expect(notes[0]!.id).toBe('trade-agreement')
  })

  it('includes owned relics with playTimings', () => {
    const result = resolveDisplayableItems(makeGame(), makeAllItems())
    const relics = result.filter(i => i.sourceType === 'relic')
    expect(relics).toHaveLength(1)
    expect(relics[0]!.id).toBe('maw-of-worlds')
  })

  it('includes enacted laws with playTimings', () => {
    const game = makeGame({ enactedLawIds: ['prophecy-of-ixth'] })
    const result = resolveDisplayableItems(game, makeAllItems())
    const lawItems = result.filter(i => i.sourceType === 'law')
    expect(lawItems).toHaveLength(1)
    expect(lawItems[0]!.id).toBe('prophecy-of-ixth')
    expect(lawItems[0]!.description).toBe('+1 to fighter combat rolls')
  })

  it('excludes enacted laws without playTimings', () => {
    const game = makeGame({ enactedLawIds: ['prophecy-of-ixth', 'executive-sanctions'] })
    const result = resolveDisplayableItems(game, makeAllItems())
    const lawItems = result.filter(i => i.sourceType === 'law')
    expect(lawItems.map(l => l.id)).toEqual(['prophecy-of-ixth'])
  })

  it('excludes laws that are not enacted', () => {
    const result = resolveDisplayableItems(makeGame(), makeAllItems())
    expect(result.filter(i => i.sourceType === 'law')).toHaveLength(0)
  })

  it('tolerates legacy games with no enactedLawIds field', () => {
    const game = makeGame()
    delete (game as Partial<Game>).enactedLawIds
    const result = resolveDisplayableItems(game, makeAllItems())
    expect(result.filter(i => i.sourceType === 'law')).toHaveLength(0)
  })

  it('returns empty when game owns nothing', () => {
    const game = makeGame({
      ownedTechIds: [],
      ownedActionCards: [],
      ownedPromissoryNoteIds: [],
      ownedRelicIds: [],
      enactedLawIds: [],
      factionId: 'nonexistent',
      leaderStates: {},
    })
    const result = resolveDisplayableItems(game, makeAllItems())
    expect(result).toEqual([])
  })
})
