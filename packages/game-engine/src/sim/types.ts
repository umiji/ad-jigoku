import type { BehaviorId, FrameCapability, PatternDefinition, PatternId, ShellId, Slot } from '@ad-jigoku/pattern-catalog'
import type { EngineTuning } from '../config'
import type { Rng } from '../core/rng'
import type { Effect } from '../state/effect'
import type { AccessibilityProfile, AdPart, Intent } from '../state/intent'
import type { Lifecycle, MistakeReason } from '../state/types'
import type { SizeHint, Surface, ViewState } from './view'

/**
 * Shell / Behavior インターフェース（GAME_ENGINE_DESIGN.md §7 / ADR-009）。
 * Shell = 見た目（React コンポーネント + CSS は packages/ui/shells/<id>/ に独立して置く）。
 * ここにあるのはエンジンが知る必要のある**宣言**だけ。
 */
export interface Shell {
  readonly id: ShellId
  /** 描画する部位 */
  readonly parts: readonly AdPart[]
  /** 受け付ける挙動スロット（生成器の R2 / V-13 の入力） */
  readonly supports: readonly Slot[]
  readonly frame?: readonly FrameCapability[]
  /** 既定のレイアウト。behavior（surface スロット等）が上書きできる */
  readonly surface: Surface
  readonly sizeHint: SizeHint
}

/** behavior が受け取る文脈。**GameState 全体は渡さない**（他の広告に依存させない / GAME §25.4） */
export type SimContext = {
  rng: Rng
  a11y: AccessibilityProfile
  tuning: EngineTuning
  step: number
  elapsedMs: number
  spawnedAtStep: number
  closableAtStep: number
  lifecycle: Lifecycle
  /** この広告の現在の ViewState（読み取り専用。更新は BehaviorResult.view で返す） */
  view: ViewState
  pattern: PatternDefinition
  instanceId: string
}

export type SpawnContext = Omit<SimContext, 'closableAtStep' | 'lifecycle' | 'view'> & {
  shell: Shell
}

export type Outcome =
  | { kind: 'closed' }
  | { kind: 'smashed' }
  | { kind: 'reported' }
  | { kind: 'closable' }
  | { kind: 'mistake'; reason: MistakeReason }
  | { kind: 'spawn'; patternId: PatternId; delayMs?: number }
  | { kind: 'damage'; patience: number }
  | { kind: 'blockProgress'; active: boolean }

export type BehaviorResult<S> = {
  sim: S
  view?: Partial<ViewState>
  /** エンジンへの要求。behavior は state を直接いじらない */
  outcome?: Outcome
  effects?: Effect[]
  /** true なら、エンジンの既定処理（× を押したら閉じる 等）をこの intent に対して適用しない */
  handled?: boolean
}

export interface Behavior<S = unknown> {
  readonly id: BehaviorId
  readonly slot: Slot
  /** 公平性計算用の重み（GAME_ENGINE_DESIGN §8.2 R4） */
  readonly friction: number
  /** 認知負荷（同 R5） */
  readonly load: number
  /** 閉じられるようになるまでの遅延（ms）。省略時 0。SAFE-01 の上限で clamp される */
  closeDelayMs?(params: Record<string, number>, ctx: SpawnContext): number
  init(params: Record<string, number>, ctx: SpawnContext): BehaviorResult<S>
  onTick(sim: S, ctx: SimContext): BehaviorResult<S>
  onIntent(sim: S, intent: Intent, ctx: SimContext): BehaviorResult<S>
}

/** 挙動を持たない・何も返さないための便宜関数 */
export function noChange<S>(sim: S): BehaviorResult<S> {
  return { sim }
}
