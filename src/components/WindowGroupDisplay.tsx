import type { WindowGroup } from '../engine'
import { isRemovableSourceType } from '../types'
import { ItemCard } from './ItemCard'
import { SectionHeading } from './SectionHeading'
import styles from './WindowGroupDisplay.module.css'

interface WindowGroupDisplayProps {
  group: WindowGroup
  openId?: string | null
  onOpenChange?: (itemId: string, open: boolean) => void
  onDeleteItem?: (itemId: string) => void
}

export function WindowGroupDisplay({ group, openId, onOpenChange, onDeleteItem }: WindowGroupDisplayProps) {
  return (
    <section className={styles.group}>
      <SectionHeading as="h2">{group.label}</SectionHeading>
      <div className={styles.itemList}>
        {group.items.map(item => (
          <ItemCard
            key={item.id}
            item={item}
            window={group.window}
            isOpen={openId === item.id}
            onOpenChange={open => onOpenChange?.(item.id, open)}
            onDelete={
              onDeleteItem && isRemovableSourceType(item.sourceType)
                ? () => onDeleteItem(item.id)
                : undefined
            }
          />
        ))}
      </div>
    </section>
  )
}
