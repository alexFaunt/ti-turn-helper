import type { ActionCard } from '../types'
import rawData from '../../data/action-cards.json'

export function loadActionCards(): ActionCard[] {
  return rawData as ActionCard[]
}
