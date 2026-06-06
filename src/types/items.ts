import type { PlayTiming } from './play-timing'

export interface Technology {
  id: string
  name: string
  type: 'color' | 'unit-upgrade'
  color?: 'green' | 'blue' | 'red' | 'yellow'
  prerequisites: string[]
  description: string
  source: string
  replaces?: string
  faction?: string
  playTimings?: PlayTiming[]
  unitType?: string
  upgradedStats?: {
    cost?: number
    combat?: number
    move?: number
    capacity?: number
    abilities?: string[]
  }
}

export interface ActionCard {
  id: string
  name: string
  description: string
  playTiming: string
  count: number
  source: string
  playTimings?: PlayTiming[]
}

export interface Faction {
  id: string
  name: string
  abilities: FactionAbility[]
  startingTech: string[]
  startingUnits: Record<string, number>
  commodities: number
  leaders: FactionLeader[]
  mech: FactionMech
  promissoryNote: PromissoryNote
  source: string
}

export interface FactionAbility {
  name: string
  description: string
  playTimings?: PlayTiming[]
}

export interface FactionLeader {
  type: 'agent' | 'commander' | 'hero'
  name: string
  title: string
  ability: string
  unlockCondition: string
  playTimings?: PlayTiming[]
}

export interface FactionMech {
  name: string
  description: string
  playTimings?: PlayTiming[]
}

export interface PromissoryNote {
  id: string
  name: string
  description: string
  faction?: string
  source: string
  replaces?: string
  playTimings?: PlayTiming[]
}

export interface Relic {
  id: string
  name: string
  description: string
  source: string
  playTimings?: PlayTiming[]
}

export interface Agenda {
  id: string
  name: string
  type: 'law' | 'directive'
  electionType: string
  for?: string
  against?: string
  description?: string
  source: string
  removedByPok?: boolean
  replaces?: string
  playTimings?: PlayTiming[]
}

export interface Unit {
  id: string
  name: string
  type: string
  cost?: number
  combat?: number
  move?: number
  capacity?: number
  abilities?: string[]
  source: string
  upgradeOf?: string
  techId?: string
}
