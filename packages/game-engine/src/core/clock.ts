/**
 * 固定タイムステップ（GAME_ENGINE_DESIGN.md §5）。
 * エンジンは時刻を読まない。時間は `{ t: 'tick' }` の回数 = step からのみ導出する。
 */

export const STEP_MS = 1000 / 60

/** タブ復帰時などの巨大な dt をクランプして「戻ったら即死」を防ぐ（これもダークパターン回避） */
export const MAX_FRAME_DT_MS = 200

export function elapsedMs(step: number): number {
  return step * STEP_MS
}

/** ms を固定ステップ数に変換（切り上げ）。閉じられるまでの待機などの「最低でも N ステップ」に使う */
export function msToSteps(ms: number): number {
  // 7300 / 16.666… = 438.00000000000006 のような浮動小数誤差で 1 step 余計に切り上げないよう、微小量を引く
  return Math.ceil(ms / STEP_MS - 1e-9)
}

export type Accumulator = { steps: number; acc: number }

/**
 * 宿主の rAF delta（可変）を固定ステップ数に変換するアキュムレータ。
 * 60fps / 30fps / 可変フレームのどれでも、同じ経過時間なら同じ累積ステップ数になる。
 */
export function advance(acc: number, dtMs: number, maxDtMs: number = MAX_FRAME_DT_MS): Accumulator {
  const clamped = Math.max(0, Math.min(dtMs, maxDtMs))
  let remaining = acc + clamped
  let steps = 0
  while (remaining >= STEP_MS) {
    remaining -= STEP_MS
    steps += 1
  }
  return { steps, acc: remaining }
}
