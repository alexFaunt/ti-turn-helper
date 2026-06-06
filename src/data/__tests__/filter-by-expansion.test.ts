import { describe, it, expect } from 'vitest'
import { filterByExpansion, resolveOmegaReplacements } from '../filter-by-expansion'
import type { Expansion } from '../../types'

const mockItems = [
  { id: 'base-item', name: 'Base', source: 'base' },
  { id: 'pok-item', name: 'PoK', source: 'pok' },
  { id: 'codex-1-item', name: 'Codex', source: 'codex-1' },
  { id: 'thunders-edge-item', name: 'TE', source: 'thunders-edge' },
]

const mockOmegaItems = [
  { id: 'tech-base', name: 'Tech', source: 'base' },
  { id: 'tech-omega', name: 'Tech Ω', source: 'codex-1', replaces: 'tech-base' },
  { id: 'tech-omega-omega', name: 'Tech ΩΩ', source: 'codex-4', replaces: 'tech-omega' },
]

describe('filterByExpansion', () => {
  it('filters to selected expansions only', () => {
    const result = filterByExpansion(mockItems, ['base'])
    expect(result.map(i => i.id)).toEqual(['base-item'])
  })

  it('includes multiple expansions', () => {
    const result = filterByExpansion(mockItems, ['base', 'pok'])
    expect(result.map(i => i.id)).toEqual(['base-item', 'pok-item'])
  })

  it('always excludes thunders-edge', () => {
    const all: Expansion[] = ['base', 'pok', 'codex-1', 'codex-2', 'codex-3', 'codex-4']
    const result = filterByExpansion(mockItems, all)
    expect(result.find(i => i.id === 'thunders-edge-item')).toBeUndefined()
  })

  it('drops removedByPok items when pok is selected', () => {
    const items = [
      { id: 'keeper', source: 'base' },
      { id: 'dropped', source: 'base', removedByPok: true },
    ]
    const result = filterByExpansion(items, ['base', 'pok'])
    expect(result.map(i => i.id)).toEqual(['keeper'])
  })

  it('keeps removedByPok items when pok is NOT selected', () => {
    const items = [
      { id: 'keeper', source: 'base' },
      { id: 'kept', source: 'base', removedByPok: true },
    ]
    const result = filterByExpansion(items, ['base'])
    expect(result.map(i => i.id)).toEqual(['keeper', 'kept'])
  })
})

describe('resolveOmegaReplacements', () => {
  it('replaces base with omega when codex selected', () => {
    const result = resolveOmegaReplacements(mockOmegaItems, ['base', 'codex-1'])
    expect(result.map(i => i.id)).toEqual(['tech-omega'])
  })

  it('keeps base when no codex selected', () => {
    const result = resolveOmegaReplacements(mockOmegaItems, ['base'])
    expect(result.map(i => i.id)).toEqual(['tech-base'])
  })

  it('chains omega replacements', () => {
    const result = resolveOmegaReplacements(mockOmegaItems, ['base', 'codex-1', 'codex-4'])
    expect(result.map(i => i.id)).toEqual(['tech-omega-omega'])
  })
})
