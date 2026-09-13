import type { EngineTuning } from '../config'
import type { Effect } from '../state/effect'
import type { GameState } from '../state/types'

/**
 * RAGE MODE（GAME §9.3 / TASK-011）。
 * プレイヤー側 chain が閾値を超えると発動。エンジンは `{ kind: 'rage', level }` Effect を返すだけで、演出は宿主（TASK-023）。
 * - level に上限がある（「視覚的に読めなくなる」ほどやらない）
 * - reducedMotion 時は演出強度（Effect の level）を減衰させるが、**スコア上の効果は変えない**（a11y が不利にならない）
 * - meter は chain と同じ。ミスで chain が 0 に戻ると rage も解除される
 */
export function updateRage(state: GameState, tuning: EngineTuning, effects: Effect[]): GameState {
  const chain = state.combo.chain
  const active = chain >= tuning.RAGE_CHAIN_THRESHOLD
  const level = active ? Math.min(tuning.RAGE_LEVEL_MAX, 1 + Math.floor((chain - tuning.RAGE_CHAIN_THRESHOLD) / tuning.RAGE_CHAIN_THRESHOLD)) : 0
  if (active === state.rage.active && level === state.rage.level && chain === state.rage.meter) return state
  if (active && (!state.rage.active || level > state.rage.level)) {
    effects.push({ kind: 'rage', level: presentationLevel(level, state) })
  }
  const log = active && !state.rage.active ? [...state.log, { step: state.step, kind: 'rage' as const, detail: `level ${level}` }] : state.log
  return { ...state, rage: { meter: chain, active, level }, log }
}

/** 演出強度。reducedMotion では半減（最低 1）。スコアには影響しない */
export function presentationLevel(level: number, state: GameState): number {
  return state.a11y.reducedMotion ? Math.max(1, Math.floor(level / 2)) : level
}
