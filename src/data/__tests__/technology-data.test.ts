import { describe, it, expect } from 'vitest'
import { loadTechnologies } from '../../data'
import { isValidWindow } from '../../types'

describe('technology data', () => {
  it('all playTimings have valid windows', () => {
    const techs = loadTechnologies()
    for (const tech of techs) {
      for (const pt of tech.playTimings ?? []) {
        expect(isValidWindow(pt.window), `${tech.name}: invalid window "${pt.window}"`).toBe(true)
      }
    }
  })

  it('all playTimings have required fields', () => {
    const techs = loadTechnologies()
    for (const tech of techs) {
      for (const pt of tech.playTimings ?? []) {
        expect(pt.wording, `${tech.name}: missing wording`).toBeTruthy()
        expect(pt.window, `${tech.name}: missing window`).toBeTruthy()
        expect(pt.timing, `${tech.name}: missing timing`).toBeTruthy()
        expect(typeof pt.mustBeActivePlayer, `${tech.name}: missing mustBeActivePlayer`).toBe('boolean')
      }
    }
  })
})
