export const PHASES = ['strategy', 'action', 'status', 'agenda'] as const
export type Phase = (typeof PHASES)[number]

export const ACTION_TYPES = ['tactical', 'strategic', 'component'] as const
export type ActionType = (typeof ACTION_TYPES)[number]

export const TACTICAL_STEPS = [
  'activation', 'movement', 'space_combat', 'invasion', 'production',
] as const
export type TacticalStep = (typeof TACTICAL_STEPS)[number]

export const SPACE_COMBAT_SUB_STEPS = [
  'space_cannon_offense', 'anti_fighter_barrage', 'announce_retreat',
  'combat_rolls', 'assign_hits', 'retreat',
] as const
export type SpaceCombatSubStep = (typeof SPACE_COMBAT_SUB_STEPS)[number]

export const INVASION_SUB_STEPS = [
  'bombardment', 'commit_ground_forces', 'space_cannon_defense',
  'ground_combat', 'establish_control',
] as const
export type InvasionSubStep = (typeof INVASION_SUB_STEPS)[number]

export const STATUS_STEPS = [
  'score_objectives', 'reveal_public_objective', 'draw_action_cards',
  'remove_command_tokens', 'gain_redistribute_command_tokens',
  'ready_cards', 'repair_units', 'return_strategy_cards',
] as const
export type StatusStep = (typeof STATUS_STEPS)[number]

export const TIMINGS = ['before', 'after', 'when', 'start', 'end', 'during'] as const
export type Timing = (typeof TIMINGS)[number]

export const EXPANSIONS = ['base', 'pok', 'codex-1', 'codex-2', 'codex-3', 'codex-4'] as const
export type Expansion = (typeof EXPANSIONS)[number]

const TOP_LEVEL_WINDOWS = ['strategy', 'agenda'] as const

function buildValidWindows(): Set<string> {
  const windows = new Set<string>()
  for (const w of TOP_LEVEL_WINDOWS) windows.add(w)
  windows.add('status')
  for (const step of STATUS_STEPS) windows.add(`status.${step}`)
  windows.add('tactical')
  for (const step of TACTICAL_STEPS) windows.add(`tactical.${step}`)
  for (const sub of SPACE_COMBAT_SUB_STEPS) windows.add(`tactical.space_combat.${sub}`)
  for (const sub of INVASION_SUB_STEPS) windows.add(`tactical.invasion.${sub}`)
  windows.add('component')
  windows.add('strategic')
  return windows
}

export const VALID_WINDOWS = buildValidWindows()

export function isValidWindow(window: string): boolean {
  return VALID_WINDOWS.has(window)
}

export const WINDOW_DISPLAY_ORDER: readonly string[] = [
  'tactical',
  'tactical.activation',
  'tactical.movement',
  'tactical.space_combat',
  'tactical.space_combat.space_cannon_offense',
  'tactical.space_combat.anti_fighter_barrage',
  'tactical.space_combat.announce_retreat',
  'tactical.space_combat.combat_rolls',
  'tactical.space_combat.assign_hits',
  'tactical.space_combat.retreat',
  'tactical.invasion',
  'tactical.invasion.bombardment',
  'tactical.invasion.commit_ground_forces',
  'tactical.invasion.space_cannon_defense',
  'tactical.invasion.ground_combat',
  'tactical.invasion.establish_control',
  'tactical.production',
  'strategy',
  'agenda',
  'status',
  'status.score_objectives',
  'status.reveal_public_objective',
  'status.draw_action_cards',
  'status.remove_command_tokens',
  'status.gain_redistribute_command_tokens',
  'status.ready_cards',
  'status.repair_units',
  'status.return_strategy_cards',
  'component',
  'strategic',
] as const
