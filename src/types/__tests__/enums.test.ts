import { describe, it, expect } from 'vitest'
import {
  PHASES, ACTION_TYPES, TACTICAL_STEPS,
  SPACE_COMBAT_SUB_STEPS, INVASION_SUB_STEPS, STATUS_STEPS,
  TIMINGS, VALID_WINDOWS, isValidWindow,
} from '../enums'

describe('enums', () => {
  it('phases are ordered', () => {
    expect(PHASES).toEqual(['strategy', 'action', 'status', 'agenda'])
  })

  it('tactical steps are ordered', () => {
    expect(TACTICAL_STEPS).toEqual([
      'activation', 'movement', 'space_combat', 'invasion', 'production',
    ])
  })

  it('space combat sub-steps are ordered', () => {
    expect(SPACE_COMBAT_SUB_STEPS).toEqual([
      'space_cannon_offense', 'anti_fighter_barrage', 'announce_retreat',
      'combat_rolls', 'assign_hits', 'retreat',
    ])
  })

  it('invasion sub-steps are ordered', () => {
    expect(INVASION_SUB_STEPS).toEqual([
      'bombardment', 'commit_ground_forces', 'space_cannon_defense',
      'ground_combat', 'establish_control',
    ])
  })

  it('status steps are ordered', () => {
    expect(STATUS_STEPS).toEqual([
      'score_objectives', 'reveal_public_objective', 'draw_action_cards',
      'remove_command_tokens', 'gain_redistribute_command_tokens',
      'ready_cards', 'repair_units', 'return_strategy_cards',
    ])
  })

  describe('isValidWindow', () => {
    it('accepts valid dot-paths', () => {
      expect(isValidWindow('tactical.space_combat.anti_fighter_barrage')).toBe(true)
      expect(isValidWindow('tactical.production')).toBe(true)
      expect(isValidWindow('tactical.movement')).toBe(true)
      expect(isValidWindow('status.draw_action_cards')).toBe(true)
      expect(isValidWindow('agenda')).toBe(true)
      expect(isValidWindow('tactical.invasion.bombardment')).toBe(true)
    })

    it('rejects invalid dot-paths', () => {
      expect(isValidWindow('tactical.combat')).toBe(false)
      expect(isValidWindow('banana')).toBe(false)
      expect(isValidWindow('tactical.space_combat.banana')).toBe(false)
      expect(isValidWindow('')).toBe(false)
    })
  })
})
