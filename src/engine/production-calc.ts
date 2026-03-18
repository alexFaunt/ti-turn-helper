import type { Unit } from '../types/items'

export interface ProductionModifiers {
  hasSarween: boolean
  ownedTechIds: string[]
}

export interface CostBreakdown {
  unitType: string
  quantity: number
  unitCost: number
  lineCost: number
}

export interface ProductionResult {
  totalCost: number
  productionUnits: number
  breakdown: CostBreakdown[]
  sarweenDiscount: number
}

export function resolveUnitsForPlayer(allUnits: Unit[], ownedTechIds: string[]): Unit[] {
  const techSet = new Set(ownedTechIds)
  const typeToUnit = new Map<string, Unit>()

  // Start with base units (no upgradeOf)
  for (const unit of allUnits) {
    if (!unit.upgradeOf) {
      typeToUnit.set(unit.type, unit)
    }
  }

  // Override with upgraded versions if tech owned
  for (const unit of allUnits) {
    if (unit.techId && techSet.has(unit.techId)) {
      typeToUnit.set(unit.type, unit)
    }
  }

  return [...typeToUnit.values()]
}

export function calculateProduction(
  selection: Record<string, number>,
  allUnits: Unit[],
  modifiers: ProductionModifiers,
): ProductionResult {
  const units = resolveUnitsForPlayer(allUnits, modifiers.ownedTechIds)
  const breakdown: CostBreakdown[] = []
  let rawCost = 0
  let productionUnits = 0

  for (const [unitType, quantity] of Object.entries(selection)) {
    if (quantity <= 0) continue
    const unit = units.find(u => u.type === unitType)
    const unitCost = unit?.cost ?? 0
    const lineCost = unitCost * quantity
    rawCost += lineCost
    productionUnits += quantity
    breakdown.push({ unitType, quantity, unitCost, lineCost })
  }

  const sarweenDiscount = modifiers.hasSarween ? 1 : 0
  const totalCost = Math.max(0, rawCost - sarweenDiscount)

  return { totalCost, productionUnits, breakdown, sarweenDiscount }
}
