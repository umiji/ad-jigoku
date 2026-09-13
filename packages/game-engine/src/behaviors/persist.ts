import { noChange, type Behavior } from '../sim/types'

/**
 * persist スロット: 「閉じた後どうなるか／どう居座るか」。
 * - persist:sticky — viewport 下部に固定され、スクロールしても付いてくる（OBS-03）。
 *   本文は覆わない（blocksProgress は立てない）が、面積を奪い続ける（perSecondAlive はカタログ）。
 * respawn / multi-layer は TASK-021。
 */
export const persistSticky: Behavior<null> = {
  id: 'persist:sticky',
  slot: 'persist',
  friction: 0,
  load: 1,
  init: () => ({ sim: null, view: { surface: 'sticky-bottom', sizeHint: 'small', motion: ['enter-slide', 'sticky-track'] } }),
  onTick: (sim) => noChange(sim),
  onIntent: (sim) => noChange(sim),
}
