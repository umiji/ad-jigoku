import type { ActiveAd, GameState } from '../state/types'
import { highestThreat } from '../resource/threat'

/**
 * Triage bonus（GAME_ENGINE_DESIGN §9.4.1）。
 * 広告を処理した瞬間、その時点で最も threat の高い広告を処理したかを判定する。
 * 正しければ bonus、連続で正しければ chain に乗る（TASK-011 のコンボ機構と統合）。
 * 同点（threat が等しい）は正解扱い。アクティブが 1 件だけのときは「判断」が要らないので bonus なし。
 */
export function isTriageCorrect(state: GameState, handled: ActiveAd): boolean {
  const others = state.ads.filter((a) => a.lifecycle !== 'closing' && a.instanceId !== handled.instanceId)
  if (others.length === 0) return false
  const top = highestThreat(state)
  if (!top) return false
  return handled.threat >= top.threat
}
