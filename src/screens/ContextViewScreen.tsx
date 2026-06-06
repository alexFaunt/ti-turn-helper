import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGameContext } from '../hooks/use-game-context'
import { WindowGroupDisplay } from '../components/WindowGroupDisplay'
import { ProductionCalculator } from '../components/ProductionCalculator'
import { windowLabel } from '../engine'
import { loadFactions } from '../data'
import styles from './ContextViewScreen.module.css'

export function ContextViewScreen() {
  const { gameId, windowPrefix } = useParams<{ gameId: string; windowPrefix: string }>()
  const navigate = useNavigate()
  const decodedPrefix = decodeURIComponent(windowPrefix ?? '')
  const { game, groups, loading, removeItem } = useGameContext(gameId, decodedPrefix)
  // id of the card currently swiped open — only one at a time
  const [openId, setOpenId] = useState<string | null>(null)

  function handleOpenChange(itemId: string, open: boolean) {
    setOpenId(open ? itemId : null)
  }

  async function handleDelete(itemId: string) {
    await removeItem(itemId)
    setOpenId(null)
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

      <div className={styles.content} onClick={() => setOpenId(null)}>
        {decodedPrefix === 'tactical.production' && (
          <ProductionCalculator ownedTechIds={game?.ownedTechIds ?? []} />
        )}
        {groups.length === 0 ? (
          <p className={styles.empty}>No relevant items</p>
        ) : (
          groups.map(group => (
            <WindowGroupDisplay
              key={group.window}
              group={group}
              openId={openId}
              onOpenChange={handleOpenChange}
              onDeleteItem={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  )
}
