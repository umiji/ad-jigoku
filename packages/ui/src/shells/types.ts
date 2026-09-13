/**
 * シェル（`src/shells/<id>/`）が受け取る型。
 *
 * **`apps/web/src/game/shellProps.ts` の `ShellProps` の写し（構造的に同一）**。
 * `packages/ui` は `@ad-jigoku/game-engine` にも `apps/*` にも依存できない（ARCHITECTURE §5.1 / eslint が落とす）ので、
 * 型だけをここに複製している。宿主側を変更したらここも合わせる（整合は
 * `apps/web/src/game/shells.test.ts` と、`SHELL_COMPONENTS` を `ShellComponentMap` へ代入する型検査が守る）。
 *
 * `Lifecycle` / `SizeHint` / `Surface` は `packages/game-engine/src/state/types.ts` と `sim/view.ts` の写し。
 * `AdPart` / `AdPartState` / `MotionCue` は `../parts/types.ts`（同じく sim/view.ts の写し）から借りる。
 * `Creative` だけは実体を共有できる（pattern-catalog は Shared Kernel）。
 */
import type { Creative, ShellId, Slot } from '@ad-jigoku/pattern-catalog'
import type { AdPart, AdPartState, MotionCue } from '../parts/types'

export type { AdPart, AdPartState, MotionCue }

/** engine: state/types.ts の Lifecycle と同一（DESIGN.md §8 lifecycle） */
export type Lifecycle = 'entering' | 'visible' | 'closable' | 'closing' | 'closed'

/** engine: sim/view.ts の SizeHint と同一 */
export type SizeHint = 'small' | 'medium' | 'large' | 'fullscreen'

/** engine: sim/view.ts の Surface と同一（DESIGN.md §8 position） */
export type Surface = 'overlay' | 'sticky-bottom' | 'sticky-top' | 'inline' | 'corner' | 'fullscreen'

/**
 * シェルが受け取るすべて。**シェルはこれと `data-target` / `data-instance` だけで描く。**
 * 位置・z 順・出入りのアニメーションは宿主のスロット（`apps/web/src/game/AdLayer.tsx`）が持つ。
 * シェルが描くのは「自分の箱の中身」だけ。
 */
export type ShellProps = {
  readonly instanceId: string
  readonly lifecycle: Lifecycle
  readonly sizeHint: SizeHint
  readonly surface: Surface
  readonly stackIndex: number
  /**
   * 配列を `readonly` にしないのは、宿主側（`ViewState['parts']`）が可変配列だから。
   * ここで `readonly` にすると `ComponentType` の相互代入（`defaultProps` 経由）が通らなくなる。
   * シェル側は読むだけで、書き換えない。
   */
  readonly parts: AdPartState[]
  /** reducedMotion 適用済み（宿主が動きのある cue を落としてから渡す） */
  readonly motion: MotionCue[]
  readonly countdown?: { readonly remainingMs: number } | undefined
  /** 「🔊 音声が再生されています」等の偽表示。文言はエンジンが決める（ATT-02。実際には鳴らさない） */
  readonly badge?: string | undefined
  /** 見た目の移動量（%）。document flow は変えない（ADR-006） */
  readonly offset?: { readonly yPercent: number } | undefined
  readonly anchor?: { readonly xPercent: number; readonly yPercent: number } | undefined
  readonly creative: Creative
  readonly creativeIndex: number
  readonly reducedMotion: boolean
  /** 出現からの経過（ms）。演出用 */
  readonly ageMs: number
}

/**
 * シェルの宣言。`packages/game-engine/src/sim/shells.ts` の `MVP_SHELLS` と
 * `parts` / `supports` が一致していなければならない（生成器の R2 シェル互換検証の入力）。
 */
export type ShellDescriptor = {
  readonly id: ShellId
  readonly parts: readonly AdPart[]
  readonly supports: readonly Slot[]
}
