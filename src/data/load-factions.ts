import type { Faction } from '../types'
import rawData from '../../data/factions.json'

export function loadFactions(): Faction[] {
  return rawData as Faction[]
}
