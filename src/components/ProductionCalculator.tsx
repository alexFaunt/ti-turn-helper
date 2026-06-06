import { useState, useMemo } from 'react'
import { calculateProduction, resolveUnitsForPlayer, summarizeProductionTechs } from '../engine/production-calc'
import { loadUnits, loadTechnologies } from '../data'
import styles from './ProductionCalculator.module.css'

interface ProductionCalculatorProps {
  ownedTechIds: string[]
}

// PDS and space docks are placed via the Construction strategy card, not produced — excluded.
const PRODUCIBLE_TYPES = [
  'dreadnought', 'cruiser', 'carrier', 'destroyer', 'fighter', 'infantry', 'war-sun', 'mech',
]

export function ProductionCalculator({ ownedTechIds }: ProductionCalculatorProps) {
  const [selection, setSelection] = useState<Record<string, number>>({})
  const [applyAiDev, setApplyAiDev] = useState(false)
  const units = useMemo(() => loadUnits(), [])
  const techs = useMemo(() => loadTechnologies(), [])
  const resolvedUnits = useMemo(() => resolveUnitsForPlayer(units, ownedTechIds), [units, ownedTechIds])
  const techSummary = useMemo(() => summarizeProductionTechs(ownedTechIds, techs), [ownedTechIds, techs])

  function adjust(unitType: string, delta: number) {
    setSelection(prev => {
      const current = prev[unitType] ?? 0
      const next = Math.max(0, current + delta)
      if (next === 0) {
        const { [unitType]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [unitType]: next }
    })
  }

  const aiDevDiscount = techSummary.hasAiDevAlgorithm && applyAiDev ? techSummary.unitUpgradeCount : 0
  const result = calculateProduction(selection, units, {
    hasSarween: techSummary.hasSarween,
    ownedTechIds,
    aiDevDiscount,
  })

  return (
    <div className={styles.calculator}>
      <h3 className={styles.heading}>Production Calculator</h3>
      <div className={styles.unitGrid}>
        {PRODUCIBLE_TYPES.map(type => {
          const buildable = resolvedUnits.find(u => u.type === type)
          // Show every producible type; fall back to the base entry for display so a
          // tech-gated unit (e.g. War Sun) still appears — just locked — until owned.
          const unit = buildable ?? units.find(u => u.type === type && !u.upgradeOf)
          if (!unit) return null
          const locked = !buildable
          const qty = selection[type] ?? 0
          return (
            <div key={type} className={`${styles.unitRow} ${locked ? styles.locked : ''}`}>
              <span className={styles.unitName}>
                {unit.name} {unit.cost !== undefined && `(${unit.cost})`}
              </span>
              <div className={styles.controls}>
                <button onClick={() => adjust(type, -1)} disabled={locked || qty === 0}>-</button>
                <span className={styles.qty}>{qty}</span>
                <button onClick={() => adjust(type, 1)} disabled={locked}>+</button>
              </div>
            </div>
          )
        })}
      </div>
      {techSummary.hasAiDevAlgorithm && (
        <div className={styles.modifierRow}>
          <button
            type="button"
            className={`${styles.toggle} ${applyAiDev ? styles.toggleOn : ''}`}
            aria-pressed={applyAiDev}
            onClick={() => setApplyAiDev(v => !v)}
          >
            AI Dev Algorithm (-{techSummary.unitUpgradeCount})
          </button>
        </div>
      )}
      {result.productionUnits > 0 && (
        <div className={styles.summary}>
          <div className={styles.summaryRow}>
            <span>Cost</span>
            <span>
              {result.totalCost}
              {result.sarweenDiscount > 0 && (
                <span className={styles.discount}> -{result.sarweenDiscount} Sarween</span>
              )}
              {result.aiDevDiscount > 0 && (
                <span className={styles.discount}> -{result.aiDevDiscount} AI Dev</span>
              )}
            </span>
          </div>
          <div className={styles.summaryRow}>
            <span>Production</span>
            <span>{result.productionUnits} units</span>
          </div>
        </div>
      )}
    </div>
  )
}
