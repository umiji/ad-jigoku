import { STEP_MS } from '../core/clock'
import { noChange, type Behavior } from '../sim/types'

/**
 * close スロット: 「どう閉じる／閉じにくいか」。
 * - close:instant — 普通に × を押せる（INT-01 など）。摩擦 0
 * - close:delayed {delayMs} — 一定時間経過まで × が有効にならない（CLS-03）。
 *   残り時間は必ず見せる（ViewState.countdown / GAME §15.4「難易度は観測可能」）。
 *   隠された待機時間は作らない。
 * 閉じる操作そのものはエンジンの既定ルール（engine/intent.ts）が処理する。
 */
export const closeInstant: Behavior<null> = {
  id: 'close:instant',
  slot: 'close',
  friction: 0,
  load: 1,
  init: () => noChange(null),
  onTick: (sim) => noChange(sim),
  onIntent: (sim) => noChange(sim),
}

export type DelayedCloseSim = { delayMs: number }

export const closeDelayed: Behavior<DelayedCloseSim> = {
  id: 'close:delayed',
  slot: 'close',
  friction: 1,
  load: 1,
  closeDelayMs: (params) => params['delayMs'] ?? 3000,
  init: (params) => {
    const delayMs = params['delayMs'] ?? 3000
    return { sim: { delayMs }, view: { countdown: { remainingMs: delayMs }, motion: ['enter-scale'] } }
  },
  onTick: (sim, ctx) => {
    const remaining = Math.max(0, (ctx.closableAtStep - ctx.step) * STEP_MS)
    if (ctx.lifecycle === 'closable' || remaining <= 0) {
      return ctx.view.countdown ? { sim, view: { countdown: { remainingMs: 0 } } } : noChange(sim)
    }
    return { sim, view: { countdown: { remainingMs: Math.round(remaining) } } }
  },
  onIntent: (sim) => noChange(sim),
}
