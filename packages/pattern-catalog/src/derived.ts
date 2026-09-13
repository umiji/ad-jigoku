import type { PatternDefinition } from './schema/pattern'

/**
 * PATTERN_SCHEMA.md §7 Derived Values。JSON には持たず、計算で導出する。
 *
 *   computeGameDifficulty(p) = normalize(severity) × interactionComplexity × uncertainty × timePressure
 *
 * 1-5 のカタログ値と比較できるよう、3軸の幾何平均（1..5）に severity 係数（0.5..1.5）を掛けて丸める。
 * 乗法構造（CATALOG §4）を保ちつつ、severity が「低いと簡単／高いと難しい」方向に ±1 程度だけ効く。
 * V-10 はこの値とカタログ列の乖離が ±1 を超えたとき warn する（error にはしない）。
 */
export function computeGameDifficulty(p: PatternDefinition): number | undefined {
  const g = p.game
  if (!g) return undefined
  const geometricMean = Math.cbrt(g.interactionComplexity * g.uncertainty * g.timePressure)
  const severityFactor = 0.5 + p.severity / 20
  const raw = geometricMean * severityFactor
  return Math.max(1, Math.min(5, Math.round(raw)))
}

/**
 * onClear の導出（GAME_ENGINE_DESIGN §9.4.1）: BASE × mean(interactionComplexity, uncertainty, timePressure)。
 * severity からは導出しない（GAME §9.1 の禁止）。BASE はエンジン側の EngineTuning が渡す。
 */
export function difficultyAxesMean(g: NonNullable<PatternDefinition['game']>): number {
  return (g.interactionComplexity + g.uncertainty + g.timePressure) / 3
}
