import { difficultyAxesMean, type PatternDefinition } from '@ad-jigoku/pattern-catalog'
import type { EngineTuning } from '../config'

/**
 * onClear の導出（GAME_ENGINE_DESIGN §9.4.1 / DECISIONS_v0.2 §5.3）。
 *
 *   onClear = SCORE_BASE × mean(interactionComplexity, uncertainty, timePressure)
 *
 * ★ 禁止: `score += pattern.severity`（GAME §9.1）。
 *   「UX severity が高いほどプレイヤー報酬が高い」構造を作ってはいけない。プレイヤーの得点源は
 *   「難しい状況を切り抜けたこと」であって「ひどい広告に遭遇したこと」ではない。
 *   この関数は severity を一切参照しない（scoring.test.ts が severity 非依存を検証する）。
 * ★ v0.1 の `scoreEffect`（パターン個別の手打ち値）は廃止済み。ここ以外に onClear の値は存在しない。
 */
export function onClearPoints(pattern: PatternDefinition | undefined, tuning: EngineTuning): number {
  const g = pattern?.game
  if (!g) return tuning.SCORE_BASE
  return Math.round(tuning.SCORE_BASE * difficultyAxesMean(g))
}
