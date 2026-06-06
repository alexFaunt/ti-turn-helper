import { describe, it, expect } from 'vitest'
import { loadAgendas, loadLaws, lawEffectText } from '../load-agendas'
import { isValidWindow } from '../../types'

describe('loadAgendas', () => {
  it('loads all 63 agendas (40 laws + 23 directives)', () => {
    const all = loadAgendas()
    expect(all).toHaveLength(63)
    expect(all.filter(a => a.type === 'law')).toHaveLength(40)
    expect(all.filter(a => a.type === 'directive')).toHaveLength(23)
  })

  it('has Minister of Antiquities (typo fixed), not Antiques', () => {
    const ids = loadAgendas().map(a => a.id)
    expect(ids).toContain('minister-of-antiquities')
    expect(ids).not.toContain('minister-of-antiques')
  })

  it('every playTiming window is valid', () => {
    for (const a of loadAgendas()) {
      for (const pt of a.playTimings ?? []) {
        expect(isValidWindow(pt.window), `${a.id}: ${pt.window}`).toBe(true)
      }
    }
  })
})

describe('loadLaws', () => {
  it('returns only laws, never directives', () => {
    const laws = loadLaws(['base', 'pok'])
    expect(laws.length).toBeGreaterThan(0)
    expect(laws.every(l => l.type === 'law')).toBe(true)
  })

  it('drops removedByPok laws when pok is selected', () => {
    const laws = loadLaws(['base', 'pok'])
    expect(laws.find(l => l.id === 'core-mining')).toBeUndefined()
    expect(laws.find(l => l.id === 'representative-government')).toBeUndefined()
    // PoK replacement is present instead
    expect(laws.find(l => l.id === 'representative-government-pok')).toBeDefined()
  })

  it('keeps removedByPok laws in a base-only game', () => {
    const laws = loadLaws(['base'])
    expect(laws.find(l => l.id === 'core-mining')).toBeDefined()
    expect(laws.find(l => l.id === 'representative-government')).toBeDefined()
  })
})

describe('lawEffectText', () => {
  it('uses description when present, else the For outcome', () => {
    expect(lawEffectText({
      id: 'x', name: 'X', type: 'law', electionType: 'player',
      description: 'desc', source: 'base',
    })).toBe('desc')
    expect(lawEffectText({
      id: 'y', name: 'Y', type: 'law', electionType: 'for-or-against',
      for: 'for-text', against: 'against-text', source: 'base',
    })).toBe('for-text')
  })
})
