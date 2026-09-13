/**
 * DESIGN.md §16.1 Shadow（追記提案 2026-09-13 / TASK-013）。値はそのまま写す（発明しない）。
 *
 * どちらも「ハードな 1-2px のオフセット + 抑制されたぼかし」の 2 層。
 * 巨大なぼかし（`0 24px 80px` のたぐい）を足さない。SaaS カードになる（DESIGN §16）。
 *
 * 影は深度の表現であって色ではないので、§4 の semantic color role は増やさない。
 */
export const shadow = {
  popup: '0 2px 0 rgba(0,0,0,0.6), 0 12px 32px rgba(0,0,0,0.45)',
  sticky: '0 -1px 0 rgba(255,255,255,0.08), 0 -8px 24px rgba(0,0,0,0.4)',
} as const

export type ShadowToken = keyof typeof shadow
