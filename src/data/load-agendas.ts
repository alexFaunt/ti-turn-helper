import type { Agenda, Expansion } from '../types'
import { filterByExpansion } from './filter-by-expansion'
import rawData from '../../data/agendas.json'

export function loadAgendas(): Agenda[] {
  return rawData as Agenda[]
}

/** Laws available for the given expansions (directives excluded, removedByPok respected). */
export function loadLaws(expansions: Expansion[]): Agenda[] {
  const laws = loadAgendas().filter(a => a.type === 'law')
  return filterByExpansion(laws, expansions)
}

/** The persistent effect text shown for a law: its description, or its "For" outcome. */
export function lawEffectText(law: Agenda): string {
  return law.description ?? law.for ?? ''
}
