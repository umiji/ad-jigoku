import { noChange, type Behavior } from '../sim/types'

/**
 * spawn スロット（TASK-017）。「いつ出るか」。
 * 出現時刻そのものはステージ生成器が ScheduledSpawn.atStep に焼き込む。
 * - spawn:immediate — スケジュールどおり即出現。入場モーションは scale
 * - spawn:delayed {afterMs} — 生成器が atStep に afterMs を加算する（stage/generate.ts）。入場は slide
 * 両者とも閉じられるまでの遅延は持たない（close スロットの責務）。
 */
export const spawnImmediate: Behavior<null> = {
  id: 'spawn:immediate',
  slot: 'spawn',
  friction: 0,
  load: 1,
  init: () => ({ sim: null, view: { motion: ['enter-scale'] } }),
  onTick: (sim) => noChange(sim),
  onIntent: (sim) => noChange(sim),
}

export const spawnDelayed: Behavior<null> = {
  id: 'spawn:delayed',
  slot: 'spawn',
  friction: 0,
  load: 1,
  init: () => ({ sim: null, view: { motion: ['enter-slide', 'enter-delayed'] } }),
  onTick: (sim) => noChange(sim),
  onIntent: (sim) => noChange(sim),
}
