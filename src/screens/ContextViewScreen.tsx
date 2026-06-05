import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGameContext } from '../hooks/use-game-context'
import { WindowGroupDisplay } from '../components/WindowGroupDisplay'
import { ConfirmModal } from '../components/ConfirmModal'
import { ProductionCalculator } from '../components/ProductionCalculator'
import { windowLabel } from '../engine'
import { loadFactions } from '../data'
import styles from './ContextViewScreen.module.css'

interface PendingRemoval {
  itemId: string
  itemName: string
}

export function ContextViewScreen() {
  const { gameId, windowPrefix } = useParams<{ gameId: string; windowPrefix: string }>()
  const navigate = useNavigate()
  const decodedPrefix = decodeURIComponent(windowPrefix ?? '')
  const { game, groups, loading, removeItem } = useGameContext(gameId, decodedPrefix)
  const [pendingRemoval, setPendingRemoval] = useState<PendingRemoval | null>(null)

  function handleLongPress(itemId: string, itemName: string) {
    setPendingRemoval({ itemId, itemName })
  }

  async function handleConfirmRemove() {
    if (pendingRemoval) {
      await removeItem(pendingRemoval.itemId)
      setPendingRemoval(null)
    }
  }

  if (loading) return <div className={styles.loading}>Loading...</div>

  const total = groups.reduce((sum, g) => sum + g.items.length, 0)
  const faction = game ? loadFactions().find(f => f.id === game.factionId) : undefined

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button
          className={styles.backBtn}
          onClick={() => navigate(`/game/${gameId}`)}
          aria-label="Back"
        >
          ‹
        </button>
        <div className={styles.headingText}>
          <h1 className={styles.title}>{windowLabel(decodedPrefix)}</h1>
          <p className={styles.sub}>
            {total} playable{faction ? ` · ${faction.name}` : ''}
          </p>
        </div>
      </header>

      <div className={styles.content}>
        {groups.length === 0 ? (
          <p className={styles.empty}>No relevant items</p>
        ) : (
          groups.map(group => (
            <WindowGroupDisplay
              key={group.window}
              group={group}
              onLongPressItem={handleLongPress}
            />
          ))
        )}
        {decodedPrefix === 'tactical.production' && (
          <ProductionCalculator
            hasSarween={game?.ownedTechIds.includes('sarween-tools') ?? false}
            ownedTechIds={game?.ownedTechIds ?? []}
          />
        )}
      </div>

      {pendingRemoval && (
        <ConfirmModal
          message={`Remove "${pendingRemoval.itemName}" from your game?`}
          onConfirm={handleConfirmRemove}
          onCancel={() => setPendingRemoval(null)}
        />
      )}
    </div>
  )
}
