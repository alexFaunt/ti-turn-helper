import { describe, it, expect } from 'vitest'
import { calculateProduction } from '../production-calc'
import type { Unit } from '../../types/items'

const baseUnits: Unit[] = [
  { id: 'fighter-1', name: 'Fighter I', type: 'fighter', cost: 0.5, combat: 9, source: 'base' },
  { id: 'infantry-1', name: 'Infantry I', type: 'infantry', cost: 0.5, combat: 8, source: 'base' },
  { id: 'carrier-1', name: 'Carrier I', type: 'carrier', cost: 3, combat: 9, move: 1, capacity: 4, source: 'base' },
  { id: 'dreadnought-1', name: 'Dreadnought I', type: 'dreadnought', cost: 4, combat: 5, move: 1, capacity: 1, source: 'base' },
]

describe('calculateProduction', () => {
  it('sums costs correctly', () => {
    const result = calculateProduction(
      { fighter: 2, carrier: 1 },
      baseUnits,
      { hasSarween: false },
    )
    expect(result.totalCost).toBe(4) // 0.5 + 0.5 + 3
    expect(result.productionUnits).toBe(3)
  })

  it('applies sarween discount', () => {
    const result = calculateProduction(
      { fighter: 2, carrier: 1 },
      baseUnits,
      { hasSarween: true },
    )
    expect(result.totalCost).toBe(3) // 4 - 1
  })

  it('sarween never reduces below 0', () => {
    const result = calculateProduction(
      { fighter: 1 },
      baseUnits,
      { hasSarween: true },
    )
    expect(result.totalCost).toBe(0) // 0.5 - 1, floored at 0
  })

  it('counts production units (each unit = 1 production)', () => {
    const result = calculateProduction(
      { fighter: 3, infantry: 2 },
      baseUnits,
      { hasSarween: false },
    )
    expect(result.productionUnits).toBe(5)
  })

  it('returns per-type cost breakdown', () => {
    const result = calculateProduction(
      { fighter: 2, carrier: 1 },
      baseUnits,
      { hasSarween: false },
    )
    expect(result.breakdown).toEqual([
      { unitType: 'fighter', quantity: 2, unitCost: 0.5, lineCost: 1 },
      { unitType: 'carrier', quantity: 1, unitCost: 3, lineCost: 3 },
    ])
  })
})
