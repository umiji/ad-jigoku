/**
 * 部位（parts）が受け取る型。
 *
 * **`packages/game-engine/src/sim/view.ts` の写し（構造的に同一）**。
 * `packages/ui` は `@ad-jigoku/game-engine` を import できない（ARCHITECTURE §5.1 / eslint が落とす）ので、
 * 型だけをここに複製している。engine 側を変更したらここも合わせる。
 * 構造が同じなので `ViewState.parts` をそのまま各部位に渡せる（TASK-014）。
 *
 * `CreativeContent` は TASK-013D が作る Creative レコードの表示用ビュー。
 * 013D 側のデータ定義がこの形に構造的に一致していれば、そのまま渡せる。
 */

/** engine: packages/game-engine/src/state/intent.ts の AdPart と同一 */
export type AdPart = 'close' | 'fake-close' | 'cta' | 'body' | 'media' | 'label' | 'decoy'

/** 0 = 目立たない / 1 = 通常 / 2 = 強調 */
export type Emphasis = 0 | 1 | 2

/** 部位の相対位置（%）。moving close 等で更新される */
export type PartAnchor = { readonly xPercent: number; readonly yPercent: number }

/** engine: sim/view.ts の AdPartState と同一 */
export type AdPartState = {
  readonly part: AdPart
  readonly visible: boolean
  readonly enabled: boolean
  readonly emphasis: Emphasis
  /** 見た目に対する当たり判定の倍率。1 未満でも 44px は下回らない（DESIGN §19） */
  readonly hitboxScale: number
  readonly anchor?: PartAnchor
}

/** engine: sim/view.ts の MotionCue と同一（DESIGN.md §14 の語彙） */
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

/** engine: sim/view.ts の ViewState['countdown'] と同一 */
export type Countdown = { readonly remainingMs: number }

/**
 * どのトークン面で描くか。**生の色は受け取らない**（DESIGN.md §4）。
 *
 * - `popup`     … 明るい紙色の広告（surface.popup）+ accent.danger
 * - `popupDark` … 暗い広告（surface.popup_dark）+ accent.electric
 * - `danger`    … 暗い広告 + accent.danger（警告・割り込み）
 * - `warning`   … 紙色の広告 + accent.warning（偽の緊急性・カウントダウン）
 */
export type CreativeTheme = 'popup' | 'popupDark' | 'danger' | 'warning'

/**
 * 架空の広告素材（TASK-013D が供給する）。実在ブランドは入れない（DESIGN §3 MUST NOT 9）。
 * `kind` は 013D のカテゴリ語彙（'sale' | 'notice' | 'download' | 'video' | 'app' …）。
 */
export type CreativeContent = {
  readonly id: string
  readonly kind: string
  readonly brand: string
  readonly headline: string
  readonly body?: string
  readonly cta: string
  readonly legal?: string
  readonly theme: CreativeTheme
}

/** 部位が共通で受け取るもの。ViewState.parts の 1 要素をばらして渡す形 */
export type PartViewProps = {
  /** false なら何も描かない（ViewState.parts[].visible） */
  readonly visible?: boolean
  readonly emphasis?: Emphasis
  /** TASK-014 が data-instance から広告インスタンスを引く */
  readonly instanceId?: string
  readonly className?: string
}

const DEFAULT_PART_STATE = { visible: true, enabled: true, emphasis: 1, hitboxScale: 1 } as const

/**
 * `ViewState.parts` から 1 部位の状態を引く。未指定の部位は既定値（見える / 押せる / 通常）。
 * engine 側の `partState()` と同じ既定値。
 */
export function resolvePartState(
  parts: readonly AdPartState[] | undefined,
  part: AdPart,
): Omit<AdPartState, 'part'> {
  return parts?.find((state) => state.part === part) ?? DEFAULT_PART_STATE
}
