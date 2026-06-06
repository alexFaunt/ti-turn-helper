import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { ProductionCalculator } from '../ProductionCalculator'

/** Click the "+" stepper for the unit row whose name matches. */
function addUnit(nameRegex: RegExp) {
  const nameEl = screen.getByText(nameRegex)
  const row = nameEl.closest('div')!
  fireEvent.click(within(row).getByRole('button', { name: '+' }))
}

const costRow = () => screen.getByText('Cost').closest('div')!

describe('ProductionCalculator', () => {
  it('omits PDS (it is placed via Construction, not produced)', () => {
    render(<ProductionCalculator ownedTechIds={[]} />)
    expect(screen.queryByText(/PDS/)).toBeNull()
  })

  it('shows War Sun but disables its stepper until the War Sun tech is owned', () => {
    render(<ProductionCalculator ownedTechIds={[]} />)
    const row = screen.getByText(/War Sun/).closest('div')!
    expect(within(row).getByRole('button', { name: '+' })).toBeDisabled()
  })

  it('enables the War Sun stepper once the War Sun tech is owned', () => {
    render(<ProductionCalculator ownedTechIds={['war-sun']} />)
    const row = screen.getByText(/War Sun/).closest('div')!
    expect(within(row).getByRole('button', { name: '+' })).toBeEnabled()
  })

  it('applies the Sarween discount for the Omega variant', () => {
    render(<ProductionCalculator ownedTechIds={['sarween-tools-omega']} />)
    addUnit(/Carrier/)
    expect(costRow().textContent).toMatch(/Sarween/)
    expect(costRow().textContent).toContain('2') // 3 - 1
  })

  it('charges a full pair for a single fighter', () => {
    render(<ProductionCalculator ownedTechIds={[]} />)
    addUnit(/Fighter/)
    expect(costRow().textContent).toContain('1') // not 0.5
  })

  it('hides the AI Dev Algorithm toggle unless the tech is owned', () => {
    render(<ProductionCalculator ownedTechIds={[]} />)
    expect(screen.queryByRole('button', { name: /AI Dev/i })).toBeNull()
  })

  it('applies the AI Development Algorithm discount only when toggled on', () => {
    render(<ProductionCalculator ownedTechIds={['ai-development-algorithm', 'cruiser-2']} />)
    addUnit(/Cruiser/)
    expect(costRow().textContent).toContain('2')
    expect(costRow().textContent).not.toMatch(/AI Dev/)

    fireEvent.click(screen.getByRole('button', { name: /AI Dev/i }))
    expect(costRow().textContent).toContain('1') // 2 - 1 (one owned unit-upgrade tech)
    expect(costRow().textContent).toMatch(/AI Dev/)
  })
})
