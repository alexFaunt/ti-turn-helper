import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TechList } from '../TechList'
import type { Technology } from '../../types'

const makeTech = (overrides: Partial<Technology>): Technology => ({
  id: 'test-tech',
  name: 'Test Tech',
  type: 'color',
  color: 'blue',
  prerequisites: [],
  description: 'A test technology',
  source: 'base',
  ...overrides,
})

const techs: Technology[] = [
  makeTech({ id: 'blue-2', name: 'Blue Two', color: 'blue', prerequisites: ['blue', 'blue'] }),
  makeTech({ id: 'blue-0', name: 'Blue Zero', color: 'blue', prerequisites: [] }),
  makeTech({ id: 'green-1', name: 'Green One', color: 'green', prerequisites: ['green'] }),
  makeTech({ id: 'green-0', name: 'Green Zero', color: 'green', prerequisites: [] }),
  makeTech({ id: 'red-0', name: 'Red Zero', color: 'red', prerequisites: [] }),
  makeTech({ id: 'yellow-0', name: 'Yellow Zero', color: 'yellow', prerequisites: [] }),
  makeTech({ id: 'unit-1', name: 'War Sun II', type: 'unit-upgrade', color: undefined, prerequisites: ['red', 'red', 'yellow'] }),
]

describe('TechList', () => {
  it('groups techs by color', () => {
    render(<TechList techs={techs} ownedTechIds={[]} onToggle={() => {}} />)

    expect(screen.getByText('Blue')).toBeInTheDocument()
    expect(screen.getByText('Green')).toBeInTheDocument()
    expect(screen.getByText('Red')).toBeInTheDocument()
    expect(screen.getByText('Yellow')).toBeInTheDocument()
    expect(screen.getByText('Unit Upgrades')).toBeInTheDocument()
  })

  it('sorts techs by prerequisite count within each group (0 prereqs first)', () => {
    render(<TechList techs={techs} ownedTechIds={[]} onToggle={() => {}} />)

    const blueHeading = screen.getByText('Blue')
    const blueSection = blueHeading.closest('section')!
    const buttons = blueSection.querySelectorAll('button')
    const buttonTexts = Array.from(buttons).map(b => b.textContent)

    expect(buttonTexts.indexOf('Blue Zero')).toBeLessThan(buttonTexts.indexOf('Blue Two'))
  })

  it('highlights owned techs with owned class', () => {
    render(<TechList techs={techs} ownedTechIds={['blue-0']} onToggle={() => {}} />)

    const blueZeroBtn = screen.getByRole('button', { name: 'Blue Zero' })
    expect(blueZeroBtn.className).toMatch(/owned/)

    const blueTwoBtn = screen.getByRole('button', { name: 'Blue Two' })
    expect(blueTwoBtn.className).not.toMatch(/owned/)
  })

  it('calls onToggle with tech ID when tapped', () => {
    const onToggle = vi.fn()
    render(<TechList techs={techs} ownedTechIds={[]} onToggle={onToggle} />)

    fireEvent.click(screen.getByRole('button', { name: 'Green Zero' }))
    expect(onToggle).toHaveBeenCalledWith('green-0')
  })

  it('puts unit upgrade techs in a separate Unit Upgrades group', () => {
    render(<TechList techs={techs} ownedTechIds={[]} onToggle={() => {}} />)

    const unitHeading = screen.getByText('Unit Upgrades')
    const unitSection = unitHeading.closest('section')!
    const buttons = unitSection.querySelectorAll('button')
    const buttonTexts = Array.from(buttons).map(b => b.textContent)

    expect(buttonTexts).toContain('War Sun II')
  })
})
