import type { Relic } from '../types'
import styles from './TechList.module.css'

interface RelicListProps {
  relics: Relic[]
  ownedRelicIds: string[]
  onToggle: (relicId: string) => void
}

export function RelicList({ relics, ownedRelicIds, onToggle }: RelicListProps) {
  const ownedSet = new Set(ownedRelicIds)
  const sorted = [...relics].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className={styles.techGrid}>
      {sorted.map(relic => (
        <button
          key={relic.id}
          className={`${styles.techBtn} ${ownedSet.has(relic.id) ? styles.owned : ''}`}
          onClick={() => onToggle(relic.id)}
        >
          {relic.name}
        </button>
      ))}
    </div>
  )
}
