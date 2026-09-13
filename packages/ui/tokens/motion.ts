/**
 * DESIGN.md §14 Motion。値はそのまま写す（発明しない）。
 *
 * DESIGN §14 本体は duration しか定義していない。easing は DESIGN.md §14.1
 * （追記提案 2026-09-13 / TASK-013）で追加された値をそのまま写している。
 * ここに無い cubic-bezier を勝手に発明しない。まず DESIGN.md を改訂する。
 */
export const motion = {
  fast: '120ms',
  normal: '240ms',
  dramatic: '420ms',
  escalation: '700ms',
} as const

export type MotionDuration = keyof typeof motion

/** DESIGN.md §14.1。standard=通常 / abrupt=割り込み / exit=閉じる */
export const easing = {
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  abrupt: 'cubic-bezier(0.4, 0, 1, 1)',
  exit: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const

export type MotionEasing = keyof typeof easing
