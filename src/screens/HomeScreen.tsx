import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listGames, deleteGame } from '../db'
import type { Game } from '../types/game'
import styles from './HomeScreen.module.css'

export function HomeScreen() {
  const [games, setGames] = useState<Game[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    listGames().then(setGames)
  }, [])

  async function handleDelete(id: string) {
    await deleteGame(id)
    setGames(await listGames())
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>TI4 Turn Helper</h1>
      <button className={styles.newGameBtn} onClick={() => navigate('/setup')}>
        New Game
      </button>
      <div className={styles.gameList}>
        {games.map(game => (
          <div key={game.id} className={styles.gameCard}>
            <button className={styles.gameLink} onClick={() => navigate(`/game/${game.id}`)}>
              <span className={styles.gameName}>{game.name}</span>
              <span className={styles.gameFaction}>{game.factionId}</span>
            </button>
            <button className={styles.deleteBtn} onClick={() => handleDelete(game.id)}>
              Delete
            </button>
          </div>
        ))}
        {games.length === 0 && (
          <p className={styles.empty}>No games yet. Start a new one!</p>
        )}
      </div>
    </div>
  )
}
