import type { Relic } from '../types'
import rawData from '../../data/relics.json'

export function loadRelics(): Relic[] {
  return rawData as Relic[]
}
