import { describe, it, expect, vi } from 'vitest'
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
      const testItem: DisplayableItem = {
        ...item,
        sourceType,
      }
      const { unmount } = render(<ItemCard item={testItem} />)
      expect(screen.getByText(label)).toBeInTheDocument()
      unmount()
    }
  })

  it('renders without timing when playTimings is empty', () => {
    const noTimingItem: DisplayableItem = {
      ...item,
      playTimings: [],
    }
    render(<ItemCard item={noTimingItem} />)
    expect(screen.getByText('Sarween Tools')).toBeInTheDocument()
    expect(screen.queryByText('When producing')).not.toBeInTheDocument()
  })

  it('triggers onLongPress after 500ms press', () => {
    vi.useFakeTimers()
    const onLongPress = vi.fn()
    render(<ItemCard item={item} onLongPress={onLongPress} />)

    const card = screen.getByText('Sarween Tools').closest('div')!
    fireEvent.mouseDown(card)
    expect(onLongPress).not.toHaveBeenCalled()

    vi.advanceTimersByTime(500)
    expect(onLongPress).toHaveBeenCalledTimes(1)

    vi.useRealTimers()
  })

  it('does not trigger onLongPress if released before 500ms', () => {
    vi.useFakeTimers()
    const onLongPress = vi.fn()
    render(<ItemCard item={item} onLongPress={onLongPress} />)

    const card = screen.getByText('Sarween Tools').closest('div')!
    fireEvent.mouseDown(card)
    vi.advanceTimersByTime(300)
    fireEvent.mouseUp(card)
    vi.advanceTimersByTime(300)

    expect(onLongPress).not.toHaveBeenCalled()
    vi.useRealTimers()
  })
})
