import Dexie from 'dexie'
import type { Game } from '../types/game'

class TI4Database extends Dexie {
  games!: Dexie.Table<Game, string>

  constructor() {
    super('ti4-turn-helper')
    this.version(1).stores({
      games: 'id, name, createdAt',
    })
  }
}

export const db = new TI4Database()
