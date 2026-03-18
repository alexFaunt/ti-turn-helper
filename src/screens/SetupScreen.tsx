import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createGame } from '../db'
import { loadFactions } from '../data'
import { EXPANSIONS, type Expansion } from '../types'
import styles from './SetupScreen.module.css'

const EXPANSION_LABELS: Record<string, string> = {
  base: 'Base Game',
  pok: 'Prophecy of Kings',
  'codex-1': 'Codex I',
  'codex-2': 'Codex II',
  'codex-3': 'Codex III',
  'codex-4': 'Codex IV',
  'thunders-edge': "Thunder's Edge",
}

export function SetupScreen() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'expansions' | 'faction'>('expansions')
  // base is always selected and non-toggleable
  const [selectedExpansions, setSelectedExpansions] = useState<Expansion[]>(['base', 'pok'])
  const [gameName, setGameName] = useState('')
  const factions = loadFactions()

  function toggleExpansion(exp: Expansion) {
    if (exp === 'base') return // base is always required
    setSelectedExpansions(prev =>
      prev.includes(exp) ? prev.filter(e => e !== exp) : [...prev, exp]
    )
  }

  async function handleSelectFaction(factionId: string) {
    const name = gameName.trim() || `Game ${new Date().toLocaleDateString()}`
    const id = await createGame({
      name,
      expansions: selectedExpansions,
      factionId,
    })
    navigate(`/game/${id}`)
  }

  if (step === 'expansions') {
    return (
      <div className={styles.container}>
        <h1>New Game</h1>
        <label className={styles.nameLabel}>
          Game Name
          <input
            className={styles.nameInput}
            value={gameName}
            onChange={e => setGameName(e.target.value)}
            placeholder="Optional"
          />
        </label>
        <h2>Select Expansions</h2>
        <div className={styles.expansionList}>
          {[...EXPANSIONS, 'thunders-edge' as const].map(exp => {
            const isThundersEdge = exp === 'thunders-edge'
            const isBase = exp === 'base'
            const isExpansion = EXPANSIONS.includes(exp as Expansion)
            const selected = isExpansion && selectedExpansions.includes(exp as Expansion)
            return (
              <button
                key={exp}
                className={`${styles.expansionBtn} ${selected ? styles.selected : ''} ${isThundersEdge ? styles.disabled : ''} ${isBase ? styles.locked : ''}`}
                onClick={() => !isThundersEdge && isExpansion && toggleExpansion(exp as Expansion)}
                disabled={isThundersEdge}
              >
                {EXPANSION_LABELS[exp] ?? exp}
                {isThundersEdge && <span className={styles.comingSoon}>Coming Soon</span>}
                {isBase && <span className={styles.required}>Required</span>}
              </button>
            )
          })}
        </div>
        <button className={styles.nextBtn} onClick={() => setStep('faction')}>
          Next: Choose Faction
        </button>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <h1>Choose Faction</h1>
      <button className={styles.backBtn} onClick={() => setStep('expansions')}>
        Back
      </button>
      <div className={styles.factionList}>
        {factions
          .filter(f => selectedExpansions.includes(f.source as Expansion))
          .map(faction => (
            <button
              key={faction.id}
              className={styles.factionBtn}
              onClick={() => handleSelectFaction(faction.id)}
            >
              {faction.name}
            </button>
          ))}
      </div>
    </div>
  )
}
