import { describe, it, expect } from 'vitest'
import { calculateProduction, resolveUnitsForPlayer, summarizeProductionTechs } from '../production-calc'
import type { Unit, Technology } from '../../types/items'

const baseUnits: Unit[] = [
  { id: 'fighter-1', name: 'Fighter I', type: 'fighter', cost: 0.5, combat: 9, source: 'base' },
  { id: 'infantry-1', name: 'Infantry I', type: 'infantry', cost: 0.5, combat: 8, source: 'base' },
  { id: 'carrier-1', name: 'Carrier I', type: 'carrier', cost: 3, combat: 9, move: 1, capacity: 4, source: 'base' },
  { id: 'dreadnought-1', name: 'Dreadnought I', type: 'dreadnought', cost: 4, combat: 5, move: 1, capacity: 1, source: 'base' },
]

function mkTech(id: string, type: 'color' | 'unit-upgrade'): Technology {
  return { id, name: id, type, prerequisites: [], description: '', source: 'base' }
}

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

describe('fighter/infantry pair costing', () => {
  it('charges a full pair cost for a single fighter', () => {
    const result = calculateProduction({ fighter: 1 }, baseUnits, { hasSarween: false, ownedTechIds: [] })
    expect(result.totalCost).toBe(1) // one fighter still costs the whole pair
  })

  it('rounds odd fighter counts up to whole pairs', () => {
    const result = calculateProduction({ fighter: 3 }, baseUnits, { hasSarween: false, ownedTechIds: [] })
    expect(result.totalCost).toBe(2) // 2 pairs (one wasted slot)
  })

  it('charges a full pair cost for a single infantry', () => {
    const result = calculateProduction({ infantry: 1 }, baseUnits, { hasSarween: false, ownedTechIds: [] })
    expect(result.totalCost).toBe(1)
  })

  it('keeps even fighter counts exact', () => {
    const result = calculateProduction({ fighter: 4 }, baseUnits, { hasSarween: false, ownedTechIds: [] })
    expect(result.totalCost).toBe(2)
  })

  it('reports the real per-line cost in the breakdown for odd counts', () => {
    const result = calculateProduction({ fighter: 3 }, baseUnits, { hasSarween: false, ownedTechIds: [] })
    expect(result.breakdown[0]!.lineCost).toBe(2)
  })
})

describe('resolveUnitsForPlayer tech-gated units', () => {
  const unitsWithWarSun: Unit[] = [
    { id: 'cruiser-1', name: 'Cruiser I', type: 'cruiser', cost: 2, source: 'base' },
    { id: 'war-sun', name: 'War Sun', type: 'war-sun', cost: 12, source: 'base', techId: 'war-sun' },
  ]

  it('excludes a tech-gated unit when its tech is not owned', () => {
    const units = resolveUnitsForPlayer(unitsWithWarSun, [])
    expect(units.find(u => u.type === 'war-sun')).toBeUndefined()
  })

  it('includes a tech-gated unit when its tech is owned', () => {
    const units = resolveUnitsForPlayer(unitsWithWarSun, ['war-sun'])
    expect(units.find(u => u.type === 'war-sun')).toBeDefined()
  })
})

describe('summarizeProductionTechs', () => {
  const techs: Technology[] = [
    mkTech('sarween-tools', 'color'),
    mkTech('sarween-tools-omega', 'color'),
    mkTech('ai-development-algorithm', 'color'),
    mkTech('cruiser-2', 'unit-upgrade'),
    mkTech('dreadnought-2', 'unit-upgrade'),
    mkTech('neural-motivator', 'color'),
  ]

  it('detects base Sarween Tools', () => {
    expect(summarizeProductionTechs(['sarween-tools'], techs).hasSarween).toBe(true)
  })

  it('detects Sarween Tools Omega', () => {
    expect(summarizeProductionTechs(['sarween-tools-omega'], techs).hasSarween).toBe(true)
  })

  it('reports no Sarween when neither variant owned', () => {
    expect(summarizeProductionTechs(['cruiser-2'], techs).hasSarween).toBe(false)
  })

  it('counts only owned unit-upgrade techs', () => {
    const summary = summarizeProductionTechs(['cruiser-2', 'dreadnought-2', 'neural-motivator'], techs)
    expect(summary.unitUpgradeCount).toBe(2)
  })

  it('flags AI Development Algorithm ownership', () => {
    expect(summarizeProductionTechs(['ai-development-algorithm'], techs).hasAiDevAlgorithm).toBe(true)
  })
})

describe('AI Development Algorithm discount', () => {
  it('subtracts the supplied aiDevDiscount from the total', () => {
    const result = calculateProduction({ carrier: 1 }, baseUnits, { hasSarween: false, ownedTechIds: [], aiDevDiscount: 2 })
    expect(result.totalCost).toBe(1) // 3 - 2
    expect(result.aiDevDiscount).toBe(2)
  })

  it('stacks with Sarween and floors at 0', () => {
    const result = calculateProduction({ carrier: 1 }, baseUnits, { hasSarween: true, ownedTechIds: [], aiDevDiscount: 5 })
    expect(result.totalCost).toBe(0) // 3 - 1 - 5, floored
  })

  it('defaults aiDevDiscount to 0 when omitted', () => {
    const result = calculateProduction({ carrier: 1 }, baseUnits, { hasSarween: false, ownedTechIds: [] })
    expect(result.aiDevDiscount).toBe(0)
  })
})
