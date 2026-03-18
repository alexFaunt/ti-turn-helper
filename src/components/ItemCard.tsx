import type { DisplayableItem } from '../types'
import styles from './ItemCard.module.css'

interface ItemCardProps {
  item: DisplayableItem
  onLongPress?: () => void
}

const SOURCE_TYPE_LABELS: Record<string, string> = {
  tech: 'Tech',
  action_card: 'Action Card',
  faction_ability: 'Faction',
  promissory_note: 'Promissory',
  leader: 'Leader',
  relic: 'Relic',
  mech: 'Mech',
  unit_ability: 'Unit',
}

export function ItemCard({ item, onLongPress }: ItemCardProps) {
  let pressTimer: ReturnType<typeof setTimeout> | null = null

  function handlePressStart() {
    pressTimer = setTimeout(() => { onLongPress?.() }, 500)
  }

  function handlePressEnd() {
    if (pressTimer) clearTimeout(pressTimer)
  }

  return (
    <div
      className={styles.card}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
    >
      <div className={styles.header}>
        <span className={styles.name}>{item.name}</span>
        <span className={styles.sourceType}>
          {SOURCE_TYPE_LABELS[item.sourceType] ?? item.sourceType}
        </span>
      </div>
      {item.playTimings[0] && (
        <p className={styles.timing}>{item.playTimings[0].wording}</p>
      )}
      <p className={styles.description}>{item.description}</p>
    </div>
  )
}
