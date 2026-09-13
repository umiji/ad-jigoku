/**
 * DESIGN.md §6 Layout System。値はそのまま写す（発明しない）。
 *
 * スケールは 4px 単位の px 値そのもの。`space[16]` = 16px。
 * 「8 と 10 の間が欲しい」と思ったらスケールを増やすのではなくレイアウトを疑う（DESIGN §3 MUST 9）。
 */
export const spacingUnit = 4

export const spacingScale = [4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192] as const

export type SpacingStep = (typeof spacingScale)[number]

/** `--container-*` に対応する。DESIGN §6 Container */
export const container = {
  paddingMobile: '20px',
  paddingDesktop: '32px',
  maxWidth: '1280px',
} as const

/**
 * DESIGN.md §19 Responsive Rules「minimum close target: 44px × 44px」。
 *
 * 見た目が小さい × （Tiny Close / CLS-xx）でも当たり判定はここを下回らない
 * （DESIGN_REQUIREMENTS §5.3 Pattern C「ゲームとして不公平にしない」）。
 * 各コンポーネントに 44 を直書きせず、必ずこのトークン（`--target-tap-min`）を経由する。
 */
export const target = {
  tapMin: '44px',
} as const

export type TargetToken = keyof typeof target
