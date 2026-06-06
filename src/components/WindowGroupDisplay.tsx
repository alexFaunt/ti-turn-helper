import type { WindowGroup } from '../engine'
import { ItemCard } from './ItemCard'
import { SectionHeading } from './SectionHeading'
import styles from './WindowGroupDisplay.module.css'

interface WindowGroupDisplayProps {
  group: WindowGroup
  onLongPressItem?: (itemId: string, itemName: string) => void
}

export function WindowGroupDisplay({ group, onLongPressItem }: WindowGroupDisplayProps) {
  return (
    <section className={styles.group}>
      <SectionHeading as="h2">{group.label}</SectionHeading>
      <div className={styles.itemList}>
        {group.items.map(item => (
          <ItemCard
            key={item.id}
            item={item}
            window={group.window}
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
