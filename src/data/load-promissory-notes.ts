import type { PromissoryNote } from '../types'
import rawData from '../../data/promissory-notes.json'

export function loadPromissoryNotes(): PromissoryNote[] {
  return rawData as PromissoryNote[]
}
