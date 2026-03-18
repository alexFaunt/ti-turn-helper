import type { WindowGroup } from '../engine'
import { ItemCard } from './ItemCard'
import styles from './WindowGroupDisplay.module.css'

interface WindowGroupDisplayProps {
  group: WindowGroup
  onLongPressItem?: (itemId: string, itemName: string) => void
}

export function WindowGroupDisplay({ group, onLongPressItem }: WindowGroupDisplayProps) {
  return (
    <section className={styles.group}>
      <h2 className={styles.heading}>{group.label}</h2>
      <div className={styles.itemList}>
        {group.items.map(item => (
          <ItemCard
            key={item.id}
            item={item}
            onLongPress={
              onLongPressItem
                ? () => onLongPressItem(item.id, item.name)
                : undefined
            }
          />
        ))}
      </div>
    </section>
  )
}
