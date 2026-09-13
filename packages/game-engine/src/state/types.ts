import type { BehaviorId, ComboTag, PatternDefinition, PatternId, ShellId, Slot } from '@ad-jigoku/pattern-catalog'
import type { RngState } from '../core/rng'
import type { AccessibilityProfile } from './intent'
import type { EngineTuning, DeviceProfile } from '../config'
import type { ViewState } from '../sim/view'
import type { Registries } from '../sim/registries'

/** GAME_ENGINE_DESIGN.md §3 State Model */

export type Phase = 'intro' | 'running' | 'cleared' | 'failed'
export type Lifecycle = 'entering' | 'visible' | 'closable' | 'closing' | 'closed'

export type StageId = string

export type RunConfig = {
  seed: string
  mode: 'story' | 'endless' | 'tutorial'
  stageId: StageId
  catalog: readonly PatternDefinition[]
  accessibility: AccessibilityProfile
  device: DeviceProfile
  /** テスト・デバッグ用。本番は undefined */
  overrides?: Partial<EngineTuning>
  /** テスト・デバッグ用: 生成器を通さず出現列を直接与える（TASK-008 以降は通常 generateStage が埋める） */
  schedule?: readonly ScheduledSpawn[]
  /** 記事の総行数（TASK-015 が記事データから渡す）。未指定は既定値 */
  contentTotalLines?: number
  /** 記事内の設問（TASK-015）。全問正答がクリア条件に加わる。未指定なら読了のみでクリア */
  questions?: readonly { id: string; correctChoice: number }[]
  /** 制限時間（従。GAME §30 Q4）。未指定なら無制限 */
  timeLimitMs?: number
  /** speed bonus の基準時間。未指定ならステージ定義の durationMs */
  expectedDurationMs?: number
}

/** 生成時に確定した 1 広告の出現予定（TASK-008 が埋める。以降、実行中に再抽選しない） */
export type ScheduledSpawn = {
  /** 生成器内で一意。ActiveAd.instanceId になる */
  instanceId: string
  atStep: number
  patternId: PatternId
  shellId: ShellId
  /** Range は焼き込み済み（確定値のみ） */
  behaviors: Partial<Record<Slot, { id: BehaviorId; params: Record<string, number> }>>
  /** Creative の抽選結果（013D）。未使用なら 0 */
  creativeIndex: number
  /** エンカウンターの役割（結果画面・デバッグ用） */
  role?: string
  /** 派生元（persist:respawn 等が生んだ 2 世代目以降） */
  parentInstanceId?: string
}

export type ActiveBehavior = { id: BehaviorId; params: Record<string, number>; sim: unknown }

export type ActiveAd = {
  instanceId: string
  patternId: PatternId
  shellId: ShellId
  spawnedAtStep: number
  /** SAFE-01: 必ず有限値（`null` を許さない / §3.1） */
  closableAtStep: number
  lifecycle: Lifecycle
  /** closing に入ったステップ（CLOSING_STEPS 後に除去） */
  closingAtStep?: number
  /** スロット毎に最大 1 挙動。sim は behavior 固有の状態。behavior 以外は触らない */
  behaviors: Partial<Record<Slot, ActiveBehavior>>
  /** 宿主が描画するための宣言的記述 */
  view: ViewState
  /** 本文を覆って progress を止めているか（surface / 挙動が宣言する） */
  blocksProgress: boolean
  /** 放置コスト（毎 tick 計算。TASK-009） */
  threat: number
  /** この広告に対するミス回数（ミスなし処理で patience 回復） */
  mistakeCount: number
  creativeIndex: number
}

export type MistakeReason = 'too-early' | 'clicked-ad' | 'fake-close' | 'stray-click' | 'wrong-answer' | 'wrong-action'

export type EncounterEventKind =
  | 'spawn'
  | 'closable'
  | 'closed'
  | 'smashed'
  | 'reported'
  | 'mistake'
  | 'damage'
  | 'recover'
  | 'read'
  | 'answer'
  | 'combo'
  | 'triage'
  | 'rage'
  | 'cleared'
  | 'failed'

/** 意味ある出来事の記録。結果画面の「今回の主犯」と失敗の説明可能性（GAME §15.1）の根拠 */
export type EncounterEvent = {
  step: number
  kind: EncounterEventKind
  patternId?: PatternId
  instanceId?: string
  /** patience の変化量（負 = 減少） */
  patienceDelta?: number
  reason?: MistakeReason | string
  /** 補助情報（コンボ名・triage 正誤など） */
  detail?: string
}

export type ScoreState = {
  total: number
  completion: number
  speedBonus: number
  accuracyBonus: number
  comboBonus: number
  survivalBonus: number
  triageBonus: number
  damagePenalty: number
  timePenalty: number
  /** 広告処理ごとの onClear 累積 */
  clearPoints: number
}

export type ComboState = {
  chain: number
  bestChain: number
  activeTags: ComboTag[]
  /** 敵側コンボ名（成立中） */
  namedCombo?: string
  /** 記録用: 成立した敵側コンボ名の集合 */
  namedCombosSeen: string[]
}

export type MistakeCounts = Record<MistakeReason, number>

export type GameState = {
  step: number
  phase: Phase
  progress: { read: number; tasksDone: number; total: number; tasksTotal: number }
  elapsedMs: number
  patience: number
  ads: ActiveAd[]
  combo: ComboState
  score: ScoreState
  rage: { meter: number; active: boolean; level: number }
  log: EncounterEvent[]
  schedule: ScheduledSpawn[]
  rng: RngState
  a11y: AccessibilityProfile
  mistakes: MistakeCounts
  /** 失敗時に確定する「今回の主犯」（TASK-009） */
  culprit?: PatternId
  /** 生成器が付ける次の派生 instanceId 用カウンタ */
  nextInstanceSeq: number
  /** 記事内の設問の正答状況（TASK-015） */
  answered: Record<string, boolean>
  /** 偽スクロールコンテナ内の論理スクロール位置（行）。ピクセルではない */
  scrollLine: number
}

export type Run = {
  config: RunConfig
  state: GameState
  /** Shell / Behavior の実装。シリアライズ対象外（リプレイは config + intents だけで再現する） */
  registries: Registries
}
