import { describe, it, expect } from 'vitest'
import { loadFactions, loadPromissoryNotes, loadRelics } from '../../data'
import { isValidWindow } from '../../types'

describe('faction data', () => {
  it('all faction ability playTimings have valid windows', () => {
    const factions = loadFactions()
    for (const f of factions) {
      for (const a of f.abilities) {
        for (const pt of a.playTimings ?? []) {
          expect(isValidWindow(pt.window), `${f.name} ability ${a.name}: invalid window "${pt.window}"`).toBe(true)
        }
      }
    }
  })

  it('all leader playTimings have valid windows', () => {
    const factions = loadFactions()
    for (const f of factions) {
      for (const l of f.leaders) {
        for (const pt of l.playTimings ?? []) {
          expect(isValidWindow(pt.window), `${f.name} leader ${l.name}: invalid window "${pt.window}"`).toBe(true)
        }
      }
    }
  })

  it('all mech playTimings have valid windows', () => {
    const factions = loadFactions()
    for (const f of factions) {
      if (f.mech) {
        for (const pt of f.mech.playTimings ?? []) {
          expect(isValidWindow(pt.window), `${f.name} mech: invalid window "${pt.window}"`).toBe(true)
        }
      }
    }
  })
})

describe('promissory note data', () => {
  it('all playTimings have valid windows', () => {
    const notes = loadPromissoryNotes()
    for (const n of notes) {
      for (const pt of n.playTimings ?? []) {
        expect(isValidWindow(pt.window), `${n.name}: invalid window "${pt.window}"`).toBe(true)
      }
    }
  })
})

describe('relic data', () => {
  it('all playTimings have valid windows', () => {
    const relics = loadRelics()
    for (const r of relics) {
      for (const pt of r.playTimings ?? []) {
        expect(isValidWindow(pt.window), `${r.name}: invalid window "${pt.window}"`).toBe(true)
      }
    }
  })
})
