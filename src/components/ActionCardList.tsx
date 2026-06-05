import type { ActionCard, OwnedActionCard } from '../types'
import styles from './ActionCardList.module.css'

interface ActionCardListProps {
  cards: ActionCard[]
  ownedCards: OwnedActionCard[]
  onAdjust: (cardId: string, delta: number) => void
}

export function ActionCardList({ cards, ownedCards, onAdjust }: ActionCardListProps) {
  const ownedMap = new Map(ownedCards.map(c => [c.id, c.quantity]))
  const sorted = [...cards].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className={styles.list}>
      {sorted.map(card => {
        const qty = ownedMap.get(card.id) ?? 0
        return (
          <div key={card.id} className={styles.card}>
            <div className={styles.cardInfo} onClick={() => onAdjust(card.id, 1)}>
              <p className={styles.cardName}>{card.name}</p>
              <p className={styles.cardDescription}>{card.description}</p>
            </div>
            <div className={styles.controls}>
              <button
                className={styles.adjustBtn}
                onClick={() => onAdjust(card.id, -1)}
                aria-label={`Decrement ${card.name}`}
              >
                -
              </button>
              <span className={styles.qty}>{qty}</span>
              <button
                className={styles.adjustBtn}
                onClick={() => onAdjust(card.id, 1)}
                aria-label={`Increment ${card.name}`}
              >
                +
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
