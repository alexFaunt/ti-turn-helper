import type { PromissoryNote } from '../types'
import styles from './TechList.module.css'

interface PromissoryNoteListProps {
  notes: PromissoryNote[]
  ownedNoteIds: string[]
  onToggle: (noteId: string) => void
}

export function PromissoryNoteList({ notes, ownedNoteIds, onToggle }: PromissoryNoteListProps) {
  const ownedSet = new Set(ownedNoteIds)
  const sorted = [...notes].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className={styles.techGrid}>
      {sorted.map(note => (
        <button
          key={note.id}
          className={`${styles.techBtn} ${ownedSet.has(note.id) ? styles.owned : ''}`}
          onClick={() => onToggle(note.id)}
        >
          {note.name}
        </button>
      ))}
    </div>
  )
}
