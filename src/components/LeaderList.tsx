import type { FactionLeader, LeaderState } from '../types'
import styles from './LeaderList.module.css'

interface LeaderListProps {
  leaders: FactionLeader[]
  leaderStates: Record<string, LeaderState>
  onToggle: (leaderName: string) => void
}

export function LeaderList({ leaders, leaderStates, onToggle }: LeaderListProps) {
  return (
    <div className={styles.list}>
      {leaders.map(leader => {
        const state = leaderStates[leader.name] ?? 'locked'
        const isUnlocked = state === 'unlocked'

        return (
          <div
            key={leader.name}
            className={`${styles.leader} ${!isUnlocked ? styles.locked : ''}`}
          >
            <span className={styles.badge}>{leader.type}</span>
            <div className={styles.info}>
              <p className={styles.leaderName}>{leader.name}</p>
              <p className={styles.unlockCondition}>{leader.unlockCondition}</p>
            </div>
            <button
              className={`${styles.toggleBtn} ${isUnlocked ? styles.unlocked : ''}`}
              onClick={() => onToggle(leader.name)}
            >
              {isUnlocked ? 'Lock' : 'Unlock'}
            </button>
          </div>
        )
      })}
    </div>
  )
}
