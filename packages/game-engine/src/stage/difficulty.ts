import type { PatternDefinition } from '@ad-jigoku/pattern-catalog'
import { STEP_MS } from '../core/clock'
import type { ScheduledSpawn } from '../state/types'

/**
 * 難易度計算（GAME §11 / GAME_ENGINE_DESIGN.md §8.3）。
 *   StageDifficulty = mean(Pattern Difficulty) + Combo Complexity（同時出現による加算）
 * 初期式は「観測可能な難易度」（GAME §15.4）を優先して単純にしてある。面白さゲートで調整する。
 */

/** 同時出現 1 件追加ごとの加算 */
export const CONCURRENCY_DIFFICULTY_STEP = 0.5
/** 「同時」とみなす出現間隔（ms） */
export const CONCURRENCY_WINDOW_MS = 4000

export function stageDifficulty(spawns: readonly ScheduledSpawn[], byId: ReadonlyMap<string, PatternDefinition>): number {
  if (spawns.length === 0) return 0
  const base = spawns.reduce((sum, s) => sum + (byId.get(s.patternId)?.gameDifficulty ?? 0), 0) / spawns.length
  // 直前 CONCURRENCY_WINDOW_MS 以内に別の出現があるものの割合を合成複雑さとして加算
  const sorted = [...spawns].sort((a, b) => a.atStep - b.atStep)
  let overlaps = 0
  for (let i = 1; i < sorted.length; i++) {
    const gapMs = (sorted[i]!.atStep - sorted[i - 1]!.atStep) * STEP_MS
    if (gapMs <= CONCURRENCY_WINDOW_MS) overlaps++
  }
  return base + CONCURRENCY_DIFFICULTY_STEP * (overlaps / spawns.length) * 2
}

export function isWithinBand(value: number, band: { min: number; max: number }, tolerance: number): boolean {
  return value >= band.min - tolerance && value <= band.max + tolerance
}
