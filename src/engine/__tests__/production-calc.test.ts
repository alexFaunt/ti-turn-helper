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
      { hasSarween: false, ownedTechIds: [] },
    )
    expect(result.totalCost).toBe(4) // 0.5 + 0.5 + 3
    expect(result.productionUnits).toBe(3)
  })

  it('applies sarween discount', () => {
    const result = calculateProduction(
      { fighter: 2, carrier: 1 },
      baseUnits,
      { hasSarween: true, ownedTechIds: [] },
    )
    expect(result.totalCost).toBe(3) // 4 - 1
  })

  it('sarween never reduces below 0', () => {
    const result = calculateProduction(
      { fighter: 1 },
      baseUnits,
      { hasSarween: true, ownedTechIds: [] },
    )
    expect(result.totalCost).toBe(0) // 0.5 - 1, floored at 0
  })

  it('counts production units (each unit = 1 production)', () => {
    const result = calculateProduction(
      { fighter: 3, infantry: 2 },
      baseUnits,
      { hasSarween: false, ownedTechIds: [] },
    )
    expect(result.productionUnits).toBe(5)
  })

  it('returns per-type cost breakdown', () => {
    const result = calculateProduction(
      { fighter: 2, carrier: 1 },
      baseUnits,
      { hasSarween: false, ownedTechIds: [] },
    )
    expect(result.breakdown).toEqual([
      { unitType: 'fighter', quantity: 2, unitCost: 0.5, lineCost: 1 },
      { unitType: 'carrier', quantity: 1, unitCost: 3, lineCost: 3 },
    ])
  })

  it('uses upgraded unit cost when tech owned', () => {
    const allUnits: Unit[] = [
      { id: 'carrier-1', name: 'Carrier I', type: 'carrier', cost: 3, source: 'base' },
      { id: 'carrier-2', name: 'Carrier II', type: 'carrier', cost: 3, source: 'base', upgradeOf: 'carrier-1', techId: 'carrier-2' },
      { id: 'cruiser-1', name: 'Cruiser I', type: 'cruiser', cost: 2, source: 'base' },
      { id: 'cruiser-2', name: 'Cruiser II', type: 'cruiser', cost: 2, source: 'base', upgradeOf: 'cruiser-1', techId: 'cruiser-2' },
    ]
    // With carrier-2 tech, cost is same (3) but name should be Carrier II
    const result = calculateProduction(
      { carrier: 1, cruiser: 1 },
      allUnits,
      { hasSarween: false, ownedTechIds: ['carrier-2'] },
    )
    expect(result.totalCost).toBe(5) // 3 + 2
    expect(result.productionUnits).toBe(2)
  })

  it('falls back to base unit when upgrade tech not owned', () => {
    const allUnits: Unit[] = [
      { id: 'cruiser-1', name: 'Cruiser I', type: 'cruiser', cost: 2, source: 'base' },
      { id: 'cruiser-2', name: 'Cruiser II', type: 'cruiser', cost: 2, source: 'base', upgradeOf: 'cruiser-1', techId: 'cruiser-2' },
    ]
    const result = calculateProduction(
      { cruiser: 1 },
      allUnits,
      { hasSarween: false, ownedTechIds: [] },
    )
    expect(result.totalCost).toBe(2)
  })
})
