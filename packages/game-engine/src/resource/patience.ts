import type { EngineTuning } from '../config'
import { withPatience } from '../engine/outcome'
import type { ActiveAd, GameState } from '../state/types'

/**
 * Patience（GAME §5.1 C / GAME_ENGINE_DESIGN §9.2）。0-100。
 * 減少は engine/outcome.ts（onSpawn / onMistake / damage）と engine/tick.ts（perSecondAlive）が担当。
 * ここは**回復**: ミスなしで広告を処理すると微量回復する。これがないと単調減少ゲームになり、上手くなる意味が薄れる。
 */
export function recoverOnCleanClear(state: GameState, ad: ActiveAd, tuning: EngineTuning): GameState {
  if (ad.mistakeCount > 0) return state
  const delta = tuning.PATIENCE_RECOVERY_PER_CLEAN_CLEAR
  if (delta <= 0 || state.patience >= tuning.PATIENCE_MAX) return state
  const capped = Math.min(delta, tuning.PATIENCE_MAX - state.patience)
  return withPatience(state, capped, { step: state.step, kind: 'recover', patternId: ad.patternId, instanceId: ad.instanceId, patienceDelta: capped })
}
