import { describe, it, expect } from 'vitest'
import { groupByWindow, windowLabel } from '../group-by-window'
import type { DisplayableItem } from '../../types'

const items: DisplayableItem[] = [
  {
    id: 'afb-tech', name: 'Destroyer II', description: 'anti-fighter barrage upgrade',
    sourceType: 'tech',
    playTimings: [{ wording: 'During AFB', window: 'tactical.space_combat.anti_fighter_barrage', timing: 'during', mustBeActivePlayer: true }],
  },
  {
    id: 'retreat-card', name: 'Skilled Retreat', description: 'move after retreating',
    sourceType: 'action_card',
    playTimings: [{ wording: 'After announcing retreat', window: 'tactical.space_combat.announce_retreat', timing: 'after', mustBeActivePlayer: true }],
  },
  {
    id: 'plasma', name: 'Plasma Scoring', description: 'extra die',
    sourceType: 'tech',
    playTimings: [{ wording: 'During combat', window: 'tactical.space_combat.combat_rolls', timing: 'during', mustBeActivePlayer: true }],
  },
]

describe('groupByWindow', () => {
  it('groups items by their play timing windows in chronological order', () => {
    const groups = groupByWindow(items, 'tactical.space_combat')

    expect(groups).toHaveLength(3)
    expect(groups[0]!.window).toBe('tactical.space_combat.anti_fighter_barrage')
    expect(groups[0]!.items.map(i => i.id)).toEqual(['afb-tech'])
    expect(groups[1]!.window).toBe('tactical.space_combat.announce_retreat')
    expect(groups[1]!.items.map(i => i.id)).toEqual(['retreat-card'])
    expect(groups[2]!.window).toBe('tactical.space_combat.combat_rolls')
    expect(groups[2]!.items.map(i => i.id)).toEqual(['plasma'])
  })

  it('omits empty groups — only returns windows that have items', () => {
    const groups = groupByWindow(items, 'tactical.space_combat')
    const windows = groups.map(g => g.window)

    // These windows should NOT appear since no items reference them
    expect(windows).not.toContain('tactical.space_combat.space_cannon_offense')
    expect(windows).not.toContain('tactical.space_combat.assign_hits')
    expect(windows).not.toContain('tactical.space_combat.retreat')
  })

  it('provides human-readable labels for each group', () => {
    const groups = groupByWindow(items, 'tactical.space_combat')

    expect(groups[0]!.label).toBe('Anti-Fighter Barrage')
    expect(groups[1]!.label).toBe('Announce Retreat')
    expect(groups[2]!.label).toBe('Combat Rolls')
  })

  it('handles an item with multiple play timings across windows', () => {
    const multiItem: DisplayableItem = {
      id: 'multi', name: 'Multi', description: 'appears in two windows',
      sourceType: 'tech',
      playTimings: [
        { wording: 'During AFB', window: 'tactical.space_combat.anti_fighter_barrage', timing: 'during', mustBeActivePlayer: true },
        { wording: 'During combat', window: 'tactical.space_combat.combat_rolls', timing: 'during', mustBeActivePlayer: true },
      ],
    }

    const groups = groupByWindow([multiItem], 'tactical.space_combat')
    expect(groups).toHaveLength(2)
    expect(groups[0]!.window).toBe('tactical.space_combat.anti_fighter_barrage')
    expect(groups[0]!.items.map(i => i.id)).toEqual(['multi'])
    expect(groups[1]!.window).toBe('tactical.space_combat.combat_rolls')
    expect(groups[1]!.items.map(i => i.id)).toEqual(['multi'])
  })

  it('excludes out-of-context windows for a multi-phase item', () => {
    // Plasma Scoring triggers in BOTH space combat and invasion.
    const plasmaScoring: DisplayableItem = {
      id: 'plasma-scoring', name: 'Plasma Scoring', description: 'extra die',
      sourceType: 'tech',
      playTimings: [
        { wording: 'BOMBARDMENT die', window: 'tactical.invasion.bombardment', timing: 'during', mustBeActivePlayer: true },
        { wording: 'SPACE CANNON die', window: 'tactical.space_combat.space_cannon_offense', timing: 'during', mustBeActivePlayer: false },
        { wording: 'SPACE CANNON die', window: 'tactical.invasion.space_cannon_defense', timing: 'during', mustBeActivePlayer: false },
      ],
    }

    const groups = groupByWindow([plasmaScoring], 'tactical.space_combat')
    const windows = groups.map(g => g.window)

    // Only the in-context space combat window — no invasion groups.
    expect(windows).toEqual(['tactical.space_combat.space_cannon_offense'])
    expect(windows).not.toContain('tactical.invasion.bombardment')
    expect(windows).not.toContain('tactical.invasion.space_cannon_defense')
    // Item appears exactly once.
    expect(groups[0]!.items.map(i => i.id)).toEqual(['plasma-scoring'])
  })

  it('matches the bare prefix window plus its sub-steps', () => {
    // A top-level prefix should keep both the exact window and deeper ones.
    const item: DisplayableItem = {
      id: 'bare', name: 'Bare', description: 'top-level + sub-step',
      sourceType: 'tech',
      playTimings: [
        { wording: 'whole space combat', window: 'tactical.space_combat', timing: 'during', mustBeActivePlayer: true },
        { wording: 'combat rolls', window: 'tactical.space_combat.combat_rolls', timing: 'during', mustBeActivePlayer: true },
      ],
    }

    const groups = groupByWindow([item], 'tactical.space_combat')
    expect(groups.map(g => g.window)).toEqual(['tactical.space_combat', 'tactical.space_combat.combat_rolls'])
  })

  it('returns empty array for no items', () => {
    expect(groupByWindow([], 'tactical.space_combat')).toEqual([])
  })
})

describe('windowLabel', () => {
  it('returns human-readable label for known windows', () => {
    expect(windowLabel('tactical.production')).toBe('Production')
    expect(windowLabel('agenda')).toBe('Agenda Phase')
  })

  it('falls back to raw window string for unknown windows', () => {
    expect(windowLabel('unknown.window')).toBe('unknown.window')
  })
})
