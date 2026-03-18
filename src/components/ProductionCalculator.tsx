import { useState, useMemo } from 'react'
import { calculateProduction, resolveUnitsForPlayer } from '../engine/production-calc'
import { loadUnits } from '../data'
import styles from './ProductionCalculator.module.css'

interface ProductionCalculatorProps {
  hasSarween: boolean
  ownedTechIds: string[]
}

const PRODUCIBLE_TYPES = [
  'dreadnought', 'cruiser', 'carrier', 'destroyer', 'fighter', 'infantry', 'pds', 'war-sun', 'mech',
]

export function ProductionCalculator({ hasSarween, ownedTechIds }: ProductionCalculatorProps) {
  const [selection, setSelection] = useState<Record<string, number>>({})
  const units = useMemo(() => loadUnits(), [])
  const resolvedUnits = useMemo(() => resolveUnitsForPlayer(units, ownedTechIds), [units, ownedTechIds])

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

  const result = calculateProduction(selection, units, { hasSarween, ownedTechIds })

  return (
    <div className={styles.calculator}>
      <h3 className={styles.heading}>Production Calculator</h3>
      <div className={styles.unitGrid}>
        {PRODUCIBLE_TYPES.map(type => {
          const unit = resolvedUnits.find(u => u.type === type)
          if (!unit) return null
          const qty = selection[type] ?? 0
          return (
            <div key={type} className={styles.unitRow}>
              <span className={styles.unitName}>
                {unit.name} {unit.cost !== undefined && `(${unit.cost})`}
              </span>
              <div className={styles.controls}>
                <button onClick={() => adjust(type, -1)} disabled={qty === 0}>-</button>
                <span className={styles.qty}>{qty}</span>
                <button onClick={() => adjust(type, 1)}>+</button>
              </div>
            </div>
          )
        })}
      </div>
      {result.productionUnits > 0 && (
        <div className={styles.summary}>
          <div className={styles.summaryRow}>
            <span>Cost</span>
            <span>
              {result.totalCost}
              {result.sarweenDiscount > 0 && (
                <span className={styles.discount}>
                  {' '}({result.totalCost + result.sarweenDiscount} - {result.sarweenDiscount} Sarween)
                </span>
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
