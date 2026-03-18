import type { Unit } from '../types/items'

export interface ProductionModifiers {
  hasSarween: boolean
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

export function calculateProduction(
  selection: Record<string, number>,
  units: Unit[],
  modifiers: ProductionModifiers,
): ProductionResult {
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
