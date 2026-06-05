import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { DashboardScreen } from '../DashboardScreen'
import { createGame, getGame, updateGame, db } from '../../db'

beforeEach(async () => {
  await db.games.clear()
})

function renderDashboard(gameId: string) {
  return render(
    <MemoryRouter initialEntries={[`/game/${gameId}`]}>
      <Routes>
        <Route path="/game/:gameId" element={<DashboardScreen />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('DashboardScreen notes', () => {
  it('persists notes after debounce', async () => {
    const id = await createGame({ name: 'Test', expansions: ['base'], factionId: 'arborec' })
    renderDashboard(id)

    const textarea = await screen.findByPlaceholderText(/notes for this game/i)
    fireEvent.change(textarea, { target: { value: 'Trade deal with Sol' } })

    await waitFor(async () => {
      const g = await getGame(id)
      expect(g!.notes).toBe('Trade deal with Sol')
    })
  })

  it('loads existing notes into the textarea', async () => {
    const id = await createGame({ name: 'Test', expansions: ['base'], factionId: 'arborec' })
    await updateGame(id, { notes: 'Existing note' })
    renderDashboard(id)

    const textarea = await screen.findByPlaceholderText<HTMLTextAreaElement>(/notes for this game/i)
    await waitFor(() => expect(textarea.value).toBe('Existing note'))
  })
})
