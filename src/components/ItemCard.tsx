import { useState, useRef, useEffect } from 'react'
import type { TouchEvent, MouseEvent } from 'react'
import type { DisplayableItem } from '../types'
import styles from './ItemCard.module.css'

interface ItemCardProps {
  item: DisplayableItem
  /** Provided only for removable items. Absent ⇒ card refuses to open. */
  onDelete?: () => void
  /** Controlled by the parent to keep only one card open at a time. */
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Window of the group this card is rendered under. Selects the matching playTiming's
   *  wording so multi-window items show the relevant line (not always the first). */
  window?: string
}

const SOURCE_TYPE_LABELS: Record<string, string> = {
  tech: 'Tech',
  action_card: 'Action Card',
  faction_ability: 'Faction',
  promissory_note: 'Promissory',
  leader: 'Leader',
  relic: 'Relic',
  mech: 'Mech',
  unit_ability: 'Unit',
  law: 'Law',
}

const REVEAL_WIDTH = 80   // px the card slides to expose the Delete button
const OPEN_THRESHOLD = 40 // px of horizontal travel needed to snap open
const AXIS_SLOP = 6       // px before we commit to a horizontal/vertical axis
const EXIT_MS = 240       // fly-off + collapse duration before the item is removed

export function ItemCard({ item, onDelete, isOpen = false, onOpenChange, window }: ItemCardProps) {
  const removable = !!onDelete
  const [dx, setDx] = useState(0)
  const [side, setSide] = useState<'left' | 'right' | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [maxH, setMaxH] = useState<number | undefined>(undefined)
  const start = useRef<{ x: number; y: number } | null>(null)
  const axis = useRef<'none' | 'h' | 'v'>('none')
  const dragging = useRef(false)
  const rowRef = useRef<HTMLDivElement>(null)
  const exitingRef = useRef(false)
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // mirror of dx so touchend reads the latest offset even when no re-render
  // happened between touchmove and touchend (e.g. a fast flick in one frame)
  const dxRef = useRef(0)

  // pick the wording for the window this card is shown under (multi-window items)
  const timing = (window && item.playTimings.find(pt => pt.window === window))
    || item.playTimings[0]

  function setOffset(v: number) {
    dxRef.current = v
    setDx(v)
  }

  // Snap closed when the parent opens a different card.
  useEffect(() => {
    if (!isOpen) { setOffset(0); setSide(null) }
  }, [isOpen])

  // Cancel a pending removal if the card unmounts for any other reason.
  useEffect(() => () => { if (exitTimer.current) clearTimeout(exitTimer.current) }, [])

  function handleTouchStart(e: TouchEvent) {
    if (!removable) return
    const t = e.touches[0]!
    start.current = { x: t.clientX, y: t.clientY }
    axis.current = 'none'
    dragging.current = true
  }

  function handleTouchMove(e: TouchEvent) {
    if (!dragging.current || !start.current) return
    const t = e.touches[0]!
    const ddx = t.clientX - start.current.x
    const ddy = t.clientY - start.current.y
    if (axis.current === 'none') {
      if (Math.abs(ddx) < AXIS_SLOP && Math.abs(ddy) < AXIS_SLOP) return
      axis.current = Math.abs(ddx) > Math.abs(ddy) ? 'h' : 'v'
    }
    if (axis.current !== 'h') return
    const clamped = Math.max(-REVEAL_WIDTH * 1.4, Math.min(REVEAL_WIDTH * 1.4, ddx))
    setIsDragging(true)
    setSide(ddx < 0 ? 'right' : 'left')
    setOffset(clamped)
  }

  function handleTouchEnd() {
    if (!dragging.current) return
    dragging.current = false
    setIsDragging(false)
    const wasHorizontal = axis.current === 'h'
    axis.current = 'none'
    start.current = null
    if (wasHorizontal && Math.abs(dxRef.current) >= OPEN_THRESHOLD) {
      const openSide = dxRef.current < 0 ? 'right' : 'left'
      setSide(openSide)
      setOffset(openSide === 'right' ? -REVEAL_WIDTH : REVEAL_WIDTH)
      if (!isOpen) onOpenChange?.(true)
    } else {
      setOffset(0)
      setSide(null)
      if (isOpen) onOpenChange?.(false)
    }
  }

  function handleCardClick(e: MouseEvent) {
    e.stopPropagation() // keep in-card taps from reaching the screen's tap-to-close handler
    if (isOpen) {
      setOffset(0)
      setSide(null)
      onOpenChange?.(false)
    }
  }

  function handleDelete(e: MouseEvent) {
    e.stopPropagation()
    if (exitingRef.current) return
    exitingRef.current = true
    setMaxH(rowRef.current?.offsetHeight) // lock current height so it can transition to 0
    setExiting(true)                       // card flies off + fades
    requestAnimationFrame(() => requestAnimationFrame(() => setMaxH(0))) // then collapse the gap
    exitTimer.current = setTimeout(() => onDelete?.(), EXIT_MS)
  }

  const showDelete = removable && side !== null && !exiting
  const cardStyle = exiting
    ? { transform: `translateX(${side === 'left' ? '120%' : '-120%'})`, opacity: 0 }
    : { transform: `translateX(${dx}px)`, transition: isDragging ? 'none' : undefined }

  return (
    <div
      ref={rowRef}
      className={`${styles.row} ${exiting ? styles.rowExiting : ''}`}
      style={maxH !== undefined ? { maxHeight: maxH } : undefined}
    >
      {showDelete && (
        <button
          className={`${styles.deleteAction} ${side === 'left' ? styles.deleteLeft : styles.deleteRight}`}
          onClick={handleDelete}
        >
          Delete
        </button>
      )}
      <div
        className={styles.card}
        data-testid="item-card"
        style={cardStyle}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleCardClick}
      >
        <div className={styles.header}>
          <span className={styles.name}>{item.name}</span>
          <span className={styles.sourceType} data-source={item.sourceType}>
            {SOURCE_TYPE_LABELS[item.sourceType] ?? item.sourceType}
          </span>
        </div>
        {timing && (
          <p className={styles.timing}>{timing.wording}</p>
        )}
        <p className={styles.description}>{item.description}</p>
      </div>
    </div>
  )
}
