import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getGame, updateGame } from '../db'
import { loadFactions } from '../data'
import type { Game } from '../types/game'
import styles from './DashboardScreen.module.css'

const NOTES_DEBOUNCE_MS = 400

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
  const [notes, setNotes] = useState('')

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingNotes = useRef<string | null>(null)
  const notesRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (gameId) getGame(gameId).then(g => {
      setGame(g ?? null)
      setNotes(g?.notes ?? '')
    })
  }, [gameId])

  // Flush any pending notes save on unmount / game switch so nothing is lost.
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      if (gameId && pendingNotes.current !== null) {
        updateGame(gameId, { notes: pendingNotes.current })
        pendingNotes.current = null
      }
    }
  }, [gameId])

  // Grow the textarea to fit its content (no scrollbar, no manual resize).
  useEffect(() => {
    const el = notesRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [notes])

  function handleNotesChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value
    setNotes(value)
    pendingNotes.current = value
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      if (gameId) updateGame(gameId, { notes: value })
      pendingNotes.current = null
    }, NOTES_DEBOUNCE_MS)
  }

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
      <section className={styles.notes}>
        <label className={styles.notesLabel} htmlFor="game-notes">Notes</label>
        <textarea
          id="game-notes"
          ref={notesRef}
          className={styles.notesInput}
          value={notes}
          onChange={handleNotesChange}
          placeholder="Notes for this game…"
          rows={4}
        />
      </section>
    </div>
  )
}
