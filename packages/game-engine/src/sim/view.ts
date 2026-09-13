import type { ShellId } from '@ad-jigoku/pattern-catalog'
import type { AdPart } from '../state/intent'

/**
 * ViewState — 宿主が描画するための宣言的記述（TASK-007 要件 2）。
 * **DOM / CSS の話をここに書かない。** 論理的な記述のみ。具体的な z-index・レイアウトはトークンと UI が決める。
 *
 * UI 側が何を描くか（TASK-014 の実装者向け）:
 * - shellId       … どの Shell コンポーネント（packages/ui/shells/<id>）で描画するか
 * - surface       … レイアウト方式。overlay=中央浮遊 / sticky-bottom・sticky-top=viewport 固定 / inline=本文中 /
 *                    corner=隅 / fullscreen=全画面（DESIGN §8 position: center/corner/edge/sticky に対応）
 * - anchor        … surface 内での相対位置（%）。overlay / corner のとき有効
 * - sizeHint      … small / medium / large / fullscreen。実寸はトークンとブレークポイントが決める
 * - creative      … どのダミー広告素材（013D）を使うか
 * - parts         … 各部位（close / fake-close / cta ...）の可視・有効・強調・当たり判定倍率
 * - motion        … 適用するモーション語彙（DESIGN §14）。reducedMotion 時は UI が動きのあるものを落とす
 * - countdown     … 残り待機時間（CLS-03 等）。必ず見せる（GAME §15.4）
 * - stackIndex    … z 順。0 が最背面。具体的な z-index はトークン（popup / popup_stack / critical）が決める
 * - offset        … 見た目の移動量（LAY-01 の transform 用、%）。document flow は変えない（ADR-006）
 * - badge         … 「🔊 音声が再生されています」等の偽表示（ATT-02。実際には鳴らさない）
 */
export type Surface = 'overlay' | 'sticky-bottom' | 'sticky-top' | 'inline' | 'corner' | 'fullscreen'
export type SizeHint = 'small' | 'medium' | 'large' | 'fullscreen'

/** DESIGN.md §14 の語彙 + §8 lifecycle に対応するモーション */
export type MotionCue =
  | 'enter-slide'
  | 'enter-scale'
  | 'enter-delayed'
  | 'sticky-track'
  | 'layered-reveal'
  | 'close-collapse'
  | 'shake'
  | 'drift'
  | 'pulse'

export type AdPartState = {
  part: AdPart
  visible: boolean
  enabled: boolean
  /** 0 = 目立たない … 1 = 通常 … 2 = 強調 */
  emphasis: 0 | 1 | 2
  /** 見た目に対する当たり判定の倍率。pointerPrecision: 'coarse' のとき最小 44px を保証するために使う */
  hitboxScale: number
  /** 部位の相対位置（%）。moving close 等で更新される */
  anchor?: { xPercent: number; yPercent: number }
}

export type CreativeRef = { index: number; kind?: string }

export type ViewState = {
  shellId: ShellId
  surface: Surface
  anchor?: { xPercent: number; yPercent: number }
  sizeHint: SizeHint
  creative: CreativeRef
  parts: AdPartState[]
  motion: MotionCue[]
  countdown?: { remainingMs: number }
  stackIndex: number
  offset?: { yPercent: number }
  badge?: string
}

export const DEFAULT_PART_STATE: Omit<AdPartState, 'part'> = { visible: true, enabled: true, emphasis: 1, hitboxScale: 1 }

export function partState(part: AdPart, overrides: Partial<Omit<AdPartState, 'part'>> = {}): AdPartState {
  return { part, ...DEFAULT_PART_STATE, ...overrides }
}
