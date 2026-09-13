import type { PatternDefinition } from '@ad-jigoku/pattern-catalog'
import type { EngineTuning } from '../config'
import type { ActiveAd, GameState, ScoreState } from '../state/types'
import { onClearPoints } from './on-clear'
import { isTriageCorrect } from './triage'

/**
 * スコア（GAME §9.1 / TASK-010）。
 *
 *   Score = Completion + Speed + Accuracy + Combo + Survival + Triage - Damage - Time
 *
 * - 処理ごとの加点（clearPoints / triage / chain）は処理した瞬間に加算する
 * - 完走系（completion / speed / survival / accuracy / time）はクリア・失敗確定時に確定する
 * - 内訳を必ず保持する（結果画面で「なぜこの点数か」を出す）
 * ★ 禁止: severity をスコアに使うこと（GAME §9.1）。on-clear.ts のコメント参照。
 */

export type HandledKind = 'closed' | 'smashed' | 'reported'

/** 広告を正しく処理した瞬間の加点。chain は TASK-011 が更新するので、ここでは現在の chain を読むだけ */
export function scoreOnHandled(state: GameState, ad: ActiveAd, pattern: PatternDefinition | undefined, tuning: EngineTuning): { score: ScoreState; triage: boolean; log: string } {
  const clear = onClearPoints(pattern, tuning)
  const triage = isTriageCorrect(state, ad)
  const triageBonus = triage ? tuning.SCORE_TRIAGE_BONUS : 0
  const score: ScoreState = {
    ...state.score,
    clearPoints: state.score.clearPoints + clear,
    triageBonus: state.score.triageBonus + triageBonus,
  }
  return { score: recomputeTotal(score), triage, log: `+${clear}${triage ? ` triage+${triageBonus}` : ''}` }
}

/** プレイヤー側 chain（連続成功）の加点。TASK-011 が chain を進めた後に呼ぶ */
export function scoreOnChain(score: ScoreState, chain: number, tuning: EngineTuning): ScoreState {
  if (chain < 2) return score
  return recomputeTotal({ ...score, comboBonus: score.comboBonus + tuning.SCORE_CHAIN_STEP * (chain - 1) })
}

export function totalMistakes(state: GameState): number {
  return Object.values(state.mistakes).reduce((a, b) => a + b, 0)
}

/** クリア / 失敗確定時の完走系スコア */
export function finalizeScore(state: GameState, tuning: EngineTuning, expectedDurationMs: number): ScoreState {
  const cleared = state.phase === 'cleared'
  const mistakes = totalMistakes(state)
  const seconds = state.elapsedMs / 1000
  const completion = cleared ? tuning.SCORE_COMPLETION : 0
  // 速度: 想定時間より早いほど加点（クリア時のみ）。想定時間以上なら 0
  const speedBonus = cleared ? Math.round(tuning.SCORE_SPEED_BONUS_MAX * Math.max(0, 1 - state.elapsedMs / Math.max(1, expectedDurationMs))) : 0
  const survivalBonus = cleared ? Math.round(state.patience * tuning.SCORE_SURVIVAL_PER_PATIENCE) : 0
  // Clean Play（GAME §9.2）: 誤クリック 0 / 不要操作 0 / patience 無損失（= 100 でクリア）
  const cleanPlay = cleared && mistakes === 0 && state.patience >= tuning.PATIENCE_MAX
  const accuracyBonus = cleared && mistakes === 0 ? Math.round(tuning.SCORE_CLEAN_PLAY_BONUS * (cleanPlay ? 1 : 0.5)) : 0
  const damagePenalty = mistakes * tuning.SCORE_DAMAGE_PENALTY_PER_MISTAKE
  const timePenalty = Math.round(seconds * tuning.SCORE_TIME_PENALTY_PER_SECOND)
  return recomputeTotal({ ...state.score, completion, speedBonus, survivalBonus, accuracyBonus, damagePenalty, timePenalty })
}

export function recomputeTotal(s: ScoreState): ScoreState {
  const total = s.completion + s.speedBonus + s.accuracyBonus + s.comboBonus + s.survivalBonus + s.triageBonus + s.clearPoints - s.damagePenalty - s.timePenalty
  return { ...s, total: Math.max(0, Math.round(total)) }
}
