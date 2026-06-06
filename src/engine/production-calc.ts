import type { Unit, Technology } from '../types/items'

const SARWEEN_TECH_IDS = ['sarween-tools', 'sarween-tools-omega']
const AI_DEVELOPMENT_ALGORITHM_ID = 'ai-development-algorithm'

export interface ProductionModifiers {
  hasSarween: boolean
  ownedTechIds: string[]
  /** Resolved AI Development Algorithm discount to apply (0 when unused). */
  aiDevDiscount?: number
}

export interface ProductionTechSummary {
  hasSarween: boolean
  hasAiDevAlgorithm: boolean
  /** Number of owned unit-upgrade techs (the AI Development Algorithm discount magnitude). */
  unitUpgradeCount: number
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
  aiDevDiscount: number
}

export function resolveUnitsForPlayer(allUnits: Unit[], ownedTechIds: string[]): Unit[] {
  const techSet = new Set(ownedTechIds)
  const typeToUnit = new Map<string, Unit>()

  // Base units are present by default — except those gated behind a tech (e.g. War Sun,
  // which has a techId but no base form and cannot be produced without the technology).
  for (const unit of allUnits) {
    if (!unit.upgradeOf && !unit.techId) {
      typeToUnit.set(unit.type, unit)
    }
  }

  // Tech-gated units (unit upgrades and unlock-only units) appear once their tech is owned.
  for (const unit of allUnits) {
    if (unit.techId && techSet.has(unit.techId)) {
      typeToUnit.set(unit.type, unit)
    }
  }

  return [...typeToUnit.values()]
}

/** Derive production-relevant modifiers from a player's owned techs. */
export function summarizeProductionTechs(
  ownedTechIds: string[],
  allTechs: Technology[],
): ProductionTechSummary {
  const owned = new Set(ownedTechIds)
  const unitUpgradeIds = new Set(
    allTechs.filter(t => t.type === 'unit-upgrade').map(t => t.id),
  )
  let unitUpgradeCount = 0
  for (const id of owned) {
    if (unitUpgradeIds.has(id)) unitUpgradeCount++
  }

  return {
    hasSarween: SARWEEN_TECH_IDS.some(id => owned.has(id)),
    hasAiDevAlgorithm: owned.has(AI_DEVELOPMENT_ALGORITHM_ID),
    unitUpgradeCount,
  }
}

/**
 * Cost of producing `quantity` of a unit. Fighters and infantry are produced two at a
 * time for a single cost (their unit cost is fractional); producing a lone one still
 * costs the whole pair, so odd counts round up to the next whole pair.
 */
function lineCostFor(unitCost: number, quantity: number): number {
  if (!Number.isInteger(unitCost)) {
    const pairCost = unitCost * 2
    return Math.ceil(quantity / 2) * pairCost
  }
  return unitCost * quantity
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
    const lineCost = lineCostFor(unitCost, quantity)
    rawCost += lineCost
    productionUnits += quantity
    breakdown.push({ unitType, quantity, unitCost, lineCost })
  }

  const sarweenDiscount = modifiers.hasSarween ? 1 : 0
  const aiDevDiscount = modifiers.aiDevDiscount ?? 0
  const totalCost = Math.max(0, rawCost - sarweenDiscount - aiDevDiscount)

  return { totalCost, productionUnits, breakdown, sarweenDiscount, aiDevDiscount }
}
