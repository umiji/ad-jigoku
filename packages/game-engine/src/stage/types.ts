import type { ComboTag, PatternCategoryCode, PatternId, Range } from '@ad-jigoku/pattern-catalog'
import type { DeviceProfile } from '../config'

/**
 * ステージ生成の型（GAME_ENGINE_DESIGN.md §8.1 / ADR-011）。
 * ステージ = テンプレートの列。テンプレート = 役割スロットの列。生成器が役割ごとにカタログから埋める。
 */

export type RoleName = 'interrupt' | 'trap' | 'pressure' | 'wildcard' | 'finale'

export type RoleSlot = {
  role: RoleName
  /** 例: trap → ['DEC', 'CLS'] */
  categories?: PatternCategoryCode[]
  difficulty?: Range
  requireTags?: ComboTag[]
  /** チュートリアル・ステージ導入用（必ずこのパターンになる） */
  forced?: PatternId
}

export type EncounterTemplate = {
  id: string
  roles: RoleSlot[]
  /** 役割間の出現間隔（ms）。rng('timing') で確定 */
  spacingMs: Range
}

export type StageDefinition = {
  id: string
  name: { ja: string }
  /** 物語ステージは固定順序。Endless はここを緩く循環させる */
  templates: EncounterTemplate[]
  /** エンカウンター間の間隔（ms） */
  encounterGapMs: Range
  /** 生成結果の難易度（gameDifficulty の平均 + 合成加算）が収まるべき帯（R7） */
  targetDifficulty: Range
  /** 参考上限。生成器は超えないよう間隔を詰める/延ばす（時間制限は timeLimitMs） */
  durationMs: number
  /** 記事の総行数（TASK-015 が本文長に使う） */
  contentLength: number
  /** カテゴリの重み（rendezvous の重みに乗算。未指定は 1） */
  categoryWeights?: Partial<Record<PatternCategoryCode, number>>
  /** これ以外は出さない（チュートリアル用） */
  allowedPatterns?: PatternId[]
  /** 必ず出す（ステージ導入用。最初のエンカウンターの interrupt 役に優先的に割り当てる） */
  forcedPatterns?: PatternId[]
  /** 同時出現上限（省略時は EngineTuning.MAX_CONCURRENT_ADS[device]） */
  maxConcurrent?: Partial<Record<DeviceProfile, number>>
  /** 0..1。出現間隔とロード予算をどれだけ詰めるか */
  escalation: { startIntensity: number; endIntensity: number }
  /** 制限時間（従。GAME §30 Q4）。省略時は無制限 */
  timeLimitMs?: number
}

/** 生成結果に付く警告（棄却上限に達して緩和した等） */
export type GenerationWarning = { code: 'R7-relaxed' | 'R5-delayed' | 'no-candidate' | 'forced-missing'; message: string }
