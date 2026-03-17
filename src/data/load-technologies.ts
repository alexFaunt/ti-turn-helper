import type { Technology } from '../types'
import rawData from '../../data/technologies.json'

export function loadTechnologies(): Technology[] {
  return rawData as Technology[]
}
