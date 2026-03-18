import type { DisplayableItem } from '../types'
import { WINDOW_DISPLAY_ORDER } from '../types'

export interface WindowGroup {
  window: string
  label: string
  items: DisplayableItem[]
}

export const WINDOW_LABELS: Record<string, string> = {
  'tactical': 'Tactical Action',
  'tactical.activation': 'Activation',
  'tactical.movement': 'Movement',
  'tactical.space_combat': 'Space Combat',
  'tactical.space_combat.space_cannon_offense': 'Space Cannon Offense',
  'tactical.space_combat.anti_fighter_barrage': 'Anti-Fighter Barrage',
  'tactical.space_combat.announce_retreat': 'Announce Retreat',
  'tactical.space_combat.combat_rolls': 'Combat Rolls',
  'tactical.space_combat.assign_hits': 'Assign Hits',
  'tactical.space_combat.retreat': 'Retreat',
  'tactical.invasion': 'Invasion',
  'tactical.invasion.bombardment': 'Bombardment',
  'tactical.invasion.commit_ground_forces': 'Commit Ground Forces',
  'tactical.invasion.space_cannon_defense': 'Space Cannon Defense',
  'tactical.invasion.ground_combat': 'Ground Combat',
  'tactical.invasion.establish_control': 'Establish Control',
  'tactical.production': 'Production',
  'strategy': 'Strategy Phase',
  'agenda': 'Agenda Phase',
  'status': 'Status Phase',
  'status.score_objectives': 'Score Objectives',
  'status.reveal_public_objective': 'Reveal Public Objective',
  'status.draw_action_cards': 'Draw Action Cards',
  'status.remove_command_tokens': 'Remove Command Tokens',
  'status.gain_redistribute_command_tokens': 'Gain & Redistribute Command Tokens',
  'status.ready_cards': 'Ready Cards',
  'status.repair_units': 'Repair Units',
  'status.return_strategy_cards': 'Return Strategy Cards',
  'component': 'Component Action',
  'strategic': 'Strategic Action',
}

export function windowLabel(window: string): string {
  return WINDOW_LABELS[window] ?? window
}

export function groupByWindow(items: DisplayableItem[]): WindowGroup[] {
  // Collect items into groups by their play timing windows
  const windowItems = new Map<string, DisplayableItem[]>()

  for (const item of items) {
    for (const pt of item.playTimings) {
      const existing = windowItems.get(pt.window)
      if (existing) {
        // Avoid duplicates within a group
        if (!existing.some(e => e.id === item.id)) {
          existing.push(item)
        }
      } else {
        windowItems.set(pt.window, [item])
      }
    }
  }

  // Sort groups by WINDOW_DISPLAY_ORDER
  const orderIndex = new Map<string, number>()
  for (let i = 0; i < WINDOW_DISPLAY_ORDER.length; i++) {
    orderIndex.set(WINDOW_DISPLAY_ORDER[i]!, i)
  }

  const sortedWindows = [...windowItems.keys()].sort((a, b) => {
    const ai = orderIndex.get(a) ?? Number.MAX_SAFE_INTEGER
    const bi = orderIndex.get(b) ?? Number.MAX_SAFE_INTEGER
    return ai - bi
  })

  return sortedWindows.map(w => ({
    window: w,
    label: windowLabel(w),
    items: windowItems.get(w)!,
  }))
}
