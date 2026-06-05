import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ManageScreen } from '../ManageScreen'
import { createGame, db } from '../../db'

beforeEach(async () => {
  await db.games.clear()
})

function renderManage(gameId: string) {
  return render(
    <MemoryRouter initialEntries={[`/game/${gameId}/manage`]}>
      <Routes>
        <Route path="/game/:gameId/manage" element={<ManageScreen />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ManageScreen global search', () => {
  it('surfaces a tech match even when a different tab is active', async () => {
    const id = await createGame({ name: 'Test', expansions: ['base'], factionId: 'arborec' })
    renderManage(id)

    // Move off the default Techs tab so the active category does NOT contain the query.
    fireEvent.click(await screen.findByRole('button', { name: 'Action Cards' }))

    // Search for a tech by name while Action Cards is active.
    fireEvent.change(screen.getByPlaceholderText(/search/i), {
      target: { value: 'Gravity Drive' },
    })

    // Global search must surface the tech regardless of which tab was selected.
    expect(await screen.findByRole('button', { name: 'Gravity Drive' })).toBeInTheDocument()

    // Tech groups merge the category + color into one heading ("Techs: Blue"),
    // not a redundant "Techs" header stacked above a "Blue" header.
    expect(screen.getByRole('heading', { name: 'Techs: Blue' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Techs' })).toBeNull()
    expect(screen.queryByRole('heading', { name: 'Blue' })).toBeNull()

    // Tabs stay rendered (no layout shift) and indicate where matches are: the category with
    // hits gets the soft-highlight class, the rest dim to the disabled-look class.
    expect(screen.getByRole('button', { name: 'Techs' }).className).toMatch(/tabMatch/)
    expect(screen.getByRole('button', { name: 'Action Cards' }).className).toMatch(/tabDimmed/)
  })

  it('shows a no-matches message when nothing matches', async () => {
    const id = await createGame({ name: 'Test', expansions: ['base'], factionId: 'arborec' })
    renderManage(id)

    fireEvent.change(await screen.findByPlaceholderText(/search/i), {
      target: { value: 'zzzznotathing' },
    })

    expect(await screen.findByText(/no matches/i)).toBeInTheDocument()
  })
})
