import type { DisplayableItem } from '../types'
import styles from './ItemCard.module.css'

interface ItemCardProps {
  item: DisplayableItem
  onLongPress?: () => void
  /** Window of the group this card is rendered under. Selects the matching playTiming's
   *  wording so multi-window items show the relevant line (not always the first). */
  window?: string
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
  law: 'Law',
}

export function ItemCard({ item, onLongPress, window }: ItemCardProps) {
  let pressTimer: ReturnType<typeof setTimeout> | null = null

  const timing = (window && item.playTimings.find(pt => pt.window === window))
    || item.playTimings[0]

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
        <span className={styles.sourceType} data-source={item.sourceType}>
          {SOURCE_TYPE_LABELS[item.sourceType] ?? item.sourceType}
        </span>
      </div>
      {timing && (
        <p className={styles.timing}>{timing.wording}</p>
      )}
      <p className={styles.description}>{item.description}</p>
    </div>
  )
}
