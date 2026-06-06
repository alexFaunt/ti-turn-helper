import type { Agenda } from '../types'
import styles from './TechList.module.css'

interface LawListProps {
  laws: Agenda[]
  enactedLawIds: string[]
  onToggle: (lawId: string) => void
}

export function LawList({ laws, enactedLawIds, onToggle }: LawListProps) {
  const enactedSet = new Set(enactedLawIds)
  const sorted = [...laws].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className={styles.techGrid}>
      {sorted.map(law => (
        <button
          key={law.id}
          className={`${styles.techBtn} ${enactedSet.has(law.id) ? styles.owned : ''}`}
          onClick={() => onToggle(law.id)}
        >
          {law.name}
        </button>
      ))}
    </div>
  )
}
