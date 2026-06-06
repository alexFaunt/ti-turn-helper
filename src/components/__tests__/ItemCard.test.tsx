import { describe, it, expect, vi } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ItemCard } from '../ItemCard'
import type { DisplayableItem } from '../../types'

const item: DisplayableItem = {
  id: 'sarween',
  name: 'Sarween Tools',
  description: 'Reduce cost by 1 during production',
  sourceType: 'tech',
  playTimings: [{
    wording: 'When producing',
    window: 'tactical.production',
    timing: 'during',
    mustBeActivePlayer: true,
  }],
}

const factionItem: DisplayableItem = { ...item, sourceType: 'faction_ability' }

/** Controlled harness mirroring the parent's single-open behavior. */
function renderCard({ removable = true } = {}) {
  const onDelete = vi.fn()
  const onOpenChange = vi.fn()
  function Harness() {
    const [open, setOpen] = useState(false)
    return (
      <ItemCard
        item={removable ? item : factionItem}
        onDelete={removable ? onDelete : undefined}
        isOpen={open}
        onOpenChange={o => { onOpenChange(o); setOpen(o) }}
      />
    )
  }
  return { onDelete, onOpenChange, ...render(<Harness />) }
}

function swipe(el: Element, dx: number) {
  fireEvent.touchStart(el, { touches: [{ clientX: 200, clientY: 100 }] })
  fireEvent.touchMove(el, { touches: [{ clientX: 200 + dx, clientY: 100 }] })
  fireEvent.touchEnd(el, { changedTouches: [{ clientX: 200 + dx, clientY: 100 }] })
}

describe('ItemCard', () => {
  it('renders item name and description', () => {
    render(<ItemCard item={item} />)
    expect(screen.getByText('Sarween Tools')).toBeInTheDocument()
    expect(screen.getByText('Reduce cost by 1 during production')).toBeInTheDocument()
  })

  it('renders source type badge', () => {
    render(<ItemCard item={item} />)
    expect(screen.getByText('Tech')).toBeInTheDocument()
  })

  it('renders timing wording', () => {
    render(<ItemCard item={item} />)
    expect(screen.getByText('When producing')).toBeInTheDocument()
  })

  it('renders all source type labels correctly', () => {
    const sourceTypes = [
      { sourceType: 'action_card' as const, label: 'Action Card' },
      { sourceType: 'faction_ability' as const, label: 'Faction' },
      { sourceType: 'promissory_note' as const, label: 'Promissory' },
      { sourceType: 'leader' as const, label: 'Leader' },
      { sourceType: 'relic' as const, label: 'Relic' },
      { sourceType: 'mech' as const, label: 'Mech' },
      { sourceType: 'unit_ability' as const, label: 'Unit' },
    ]

    for (const { sourceType, label } of sourceTypes) {
      const testItem: DisplayableItem = { ...item, sourceType }
      const { unmount } = render(<ItemCard item={testItem} />)
      expect(screen.getByText(label)).toBeInTheDocument()
      unmount()
    }
  })

  it('renders without timing when playTimings is empty', () => {
    const noTimingItem: DisplayableItem = { ...item, playTimings: [] }
    render(<ItemCard item={noTimingItem} />)
    expect(screen.getByText('Sarween Tools')).toBeInTheDocument()
    expect(screen.queryByText('When producing')).not.toBeInTheDocument()
  })

  it('swiping left past threshold reveals Delete and reports open', () => {
    const { onOpenChange } = renderCard()
    swipe(screen.getByTestId('item-card'), -100)
    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('swiping right past threshold also reveals Delete', () => {
    const { onOpenChange } = renderCard()
    swipe(screen.getByTestId('item-card'), 100)
    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('tapping Delete animates out, then removes after the exit delay', () => {
    vi.useFakeTimers()
    try {
      const { onDelete } = renderCard()
      swipe(screen.getByTestId('item-card'), -100)
      fireEvent.click(screen.getByText('Delete'))
      // deferred until the fly-off animation finishes; button hidden meanwhile
      expect(onDelete).not.toHaveBeenCalled()
      expect(screen.queryByText('Delete')).not.toBeInTheDocument()
      vi.advanceTimersByTime(300)
      expect(onDelete).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('short swipe under threshold stays closed', () => {
    const { onOpenChange } = renderCard()
    swipe(screen.getByTestId('item-card'), -20)
    expect(onOpenChange).not.toHaveBeenCalledWith(true)
    expect(screen.queryByText('Delete')).not.toBeInTheDocument()
  })

  it('vertical-dominant drag does not open (scroll preserved)', () => {
    const { onOpenChange } = renderCard()
    const card = screen.getByTestId('item-card')
    fireEvent.touchStart(card, { touches: [{ clientX: 200, clientY: 300 }] })
    fireEvent.touchMove(card, { touches: [{ clientX: 100, clientY: 150 }] }) // dx -100, dy -150
    fireEvent.touchEnd(card, { changedTouches: [{ clientX: 100, clientY: 150 }] })
    expect(onOpenChange).not.toHaveBeenCalledWith(true)
  })

  it('non-removable card refuses: never opens, no Delete button', () => {
    const { onOpenChange } = renderCard({ removable: false })
    swipe(screen.getByTestId('item-card'), -100)
    expect(onOpenChange).not.toHaveBeenCalledWith(true)
    expect(screen.queryByText('Delete')).not.toBeInTheDocument()
  })

  it('tapping the card body closes an open card', () => {
    const { onOpenChange } = renderCard()
    const card = screen.getByTestId('item-card')
    swipe(card, -100)
    expect(screen.getByText('Delete')).toBeInTheDocument()
    fireEvent.click(card)
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    expect(screen.queryByText('Delete')).not.toBeInTheDocument()
  })
})
