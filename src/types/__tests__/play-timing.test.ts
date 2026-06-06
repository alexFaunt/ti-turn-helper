import { describe, it, expect } from 'vitest'
import { isRemovableSourceType } from '../play-timing'

describe('isRemovableSourceType', () => {
  it('returns true for owned, removable item types', () => {
    expect(isRemovableSourceType('tech')).toBe(true)
    expect(isRemovableSourceType('action_card')).toBe(true)
    expect(isRemovableSourceType('promissory_note')).toBe(true)
    expect(isRemovableSourceType('relic')).toBe(true)
  })

  it('returns false for inherent faction item types', () => {
    expect(isRemovableSourceType('faction_ability')).toBe(false)
    expect(isRemovableSourceType('leader')).toBe(false)
    expect(isRemovableSourceType('mech')).toBe(false)
    expect(isRemovableSourceType('unit_ability')).toBe(false)
  })
})
