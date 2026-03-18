import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getGame } from '../db'
import { loadFactions } from '../data'
import type { Game } from '../types/game'
import styles from './DashboardScreen.module.css'

const CONTEXT_BUTTONS = [
  { label: 'Activation', windowPrefix: 'tactical.activation' },
  { label: 'Movement', windowPrefix: 'tactical.movement' },
  { label: 'Space Combat', windowPrefix: 'tactical.space_combat' },
  { label: 'Invasion', windowPrefix: 'tactical.invasion' },
  { label: 'Production', windowPrefix: 'tactical.production' },
  { label: 'Agenda', windowPrefix: 'agenda' },
  { label: 'Status Phase', windowPrefix: 'status' },
  { label: 'Component Actions', windowPrefix: 'component' },
] as const

export function DashboardScreen() {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()
  const [game, setGame] = useState<Game | null>(null)

  useEffect(() => {
    if (gameId) getGame(gameId).then(g => setGame(g ?? null))
  }, [gameId])

  if (!game) return <div className={styles.loading}>Loading...</div>

  const factions = loadFactions()
  const faction = factions.find(f => f.id === game.factionId)

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.homeBtn} onClick={() => navigate('/')}>Home</button>
        <div className={styles.headerInfo}>
          <h1 className={styles.gameName}>{game.name}</h1>
          <p className={styles.factionName}>{faction?.name ?? game.factionId}</p>
        </div>
        <button
          className={styles.manageBtn}
          onClick={() => navigate(`/game/${game.id}/manage`)}
        >
          Manage
        </button>
      </header>
      <div className={styles.buttonGrid}>
        {CONTEXT_BUTTONS.map(btn => (
          <button
            key={btn.windowPrefix}
            className={styles.contextBtn}
            onClick={() =>
              navigate(`/game/${game.id}/context/${encodeURIComponent(btn.windowPrefix)}`)
            }
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  )
}
