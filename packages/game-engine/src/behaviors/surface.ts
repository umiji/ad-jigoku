import { noChange, type Behavior } from '../sim/types'

/**
 * surface スロット（TASK-017）。「どこに・どの大きさで」。
 * - surface:fullscreen — 全画面で本文を覆う（OBS-01）。覆っている間は progress が止まる
 *   （engine/spawn.ts が surface === 'fullscreen' で blocksProgress を立てる）。
 *   load 2: 画面全体を占有するので認知負荷が高い。
 */
export const surfaceFullscreen: Behavior<null> = {
  id: 'surface:fullscreen',
  slot: 'surface',
  friction: 0,
  load: 2,
  init: () => ({ sim: null, view: { surface: 'fullscreen', sizeHint: 'fullscreen', motion: ['enter-scale'] } }),
  onTick: (sim) => noChange(sim),
  onIntent: (sim) => noChange(sim),
}
