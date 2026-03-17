import type { Unit } from '../types'
import rawData from '../../data/units.json'

export function loadUnits(): Unit[] {
  return rawData as Unit[]
}
