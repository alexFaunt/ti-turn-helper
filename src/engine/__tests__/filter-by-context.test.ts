import { describe, it, expect } from 'vitest'
import { filterByContext } from '../filter-by-context'
import type { DisplayableItem } from '../../types'

const items: DisplayableItem[] = [
  {
    id: 'sarween', name: 'Sarween Tools', description: 'reduce cost by 1',
    sourceType: 'tech',
    playTimings: [{ wording: 'When producing', window: 'tactical.production', timing: 'during', mustBeActivePlayer: true }],
  },
  {
    id: 'plasma', name: 'Plasma Scoring', description: 'extra die',
    sourceType: 'tech',
    playTimings: [{ wording: 'During combat', window: 'tactical.space_combat.combat_rolls', timing: 'during', mustBeActivePlayer: true }],
  },
  {
    id: 'bunker', name: 'Bunker', description: '-4 bombardment',
    sourceType: 'action_card',
    playTimings: [{ wording: 'At the start of an invasion', window: 'tactical.invasion', timing: 'start', mustBeActivePlayer: false }],
  },
]

describe('filterByContext', () => {
  it('filters by window prefix — production', () => {
    const result = filterByContext(items, 'tactical.production')
    expect(result.map(i => i.id)).toEqual(['sarween'])
  })
  it('filters by window prefix — space combat includes sub-steps', () => {
    const result = filterByContext(items, 'tactical.space_combat')
    expect(result.map(i => i.id)).toEqual(['plasma'])
  })
  it('filters by window prefix — invasion', () => {
    const result = filterByContext(items, 'tactical.invasion')
    expect(result.map(i => i.id)).toEqual(['bunker'])
  })
  it('returns empty for no matches', () => {
    expect(filterByContext(items, 'agenda')).toEqual([])
  })
})
