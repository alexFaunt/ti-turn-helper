import { describe, it, expect } from 'vitest'
import { loadActionCards } from '../../data'
import { isValidWindow } from '../../types'

describe('action card data', () => {
  it('all playTimings have valid windows', () => {
    const cards = loadActionCards()
    for (const card of cards) {
      for (const pt of card.playTimings ?? []) {
        expect(isValidWindow(pt.window), `${card.name} (${card.id}): invalid window "${pt.window}"`).toBe(true)
      }
    }
  })

  it('all playTimings have required fields', () => {
    const cards = loadActionCards()
    for (const card of cards) {
      for (const pt of card.playTimings ?? []) {
        expect(pt.wording, `${card.name}: missing wording`).toBeTruthy()
        expect(pt.window, `${card.name}: missing window`).toBeTruthy()
        expect(pt.timing, `${card.name}: missing timing`).toBeTruthy()
        expect(typeof pt.mustBeActivePlayer, `${card.name}: missing mustBeActivePlayer`).toBe('boolean')
      }
    }
  })

  it('every card has a playTimings array', () => {
    const cards = loadActionCards()
    for (const card of cards) {
      expect(Array.isArray(card.playTimings), `${card.name}: missing playTimings array`).toBe(true)
    }
  })
})
