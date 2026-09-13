/**
 * DESIGN.md §14 Motion。値はそのまま写す（発明しない）。
 *
 * DESIGN §14 は duration しか定義していない。easing を足したくなったら
 * まず DESIGN.md を改訂する（勝手に cubic-bezier を発明しない）。
 */
export const motion = {
  fast: '120ms',
  normal: '240ms',
  dramatic: '420ms',
  escalation: '700ms',
} as const

export type MotionDuration = keyof typeof motion
