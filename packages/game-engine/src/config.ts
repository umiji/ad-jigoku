/**
 * EngineTuning — 調整可能な定数を 1 箇所に集約する（TASK-006 要件 6）。
 * マジックナンバーをコードに散らさない。値の根拠は各コメントに書く。
 *
 * ★ `FRICTION_CAP` / `LOAD_BUDGET` は仮置き（DECISIONS_v0.2 §9 Q1）。面白さゲート（TASK-024B）で調整する。
 */
export type DeviceProfile = 'mobile' | 'desktop'

export type EngineTuning = {
  /** SAFE-01: 全ての広告はこの時間以内に必ず閉じられる状態になる（PATTERN_SCHEMA V-08 と同じ値） */
  MAX_CLOSE_DELAY_MS: number
  /** 同時出現数の上限（DESIGN §19 / GAME_ENGINE_DESIGN §13 Q2。要プレイテスト） */
  MAX_CONCURRENT_ADS: Record<DeviceProfile, number>

  PATIENCE_INITIAL: number
  PATIENCE_MAX: number
  /** ミスなしで広告を処理したときの回復量（GAME_ENGINE_DESIGN §9.2。ゼロだと単調減少ゲームになる） */
  PATIENCE_RECOVERY_PER_CLEAN_CLEAR: number
  /** 早押し（未 closable の × を押した）の軽微なペナルティ */
  PATIENCE_PENALTY_TOO_EARLY: number
  /** 関係ない場所の連打（GAME §24 Skill: 連打は最適戦略にならない） */
  PATIENCE_PENALTY_STRAY_CLICK: number
  /** 設問の誤答（TASK-015: 誤答は progress を戻さないが patience を削る） */
  PATIENCE_PENALTY_WRONG_ANSWER: number

  /** 読む速度（行/秒）。一定。反射神経ゲームにしないため */
  READ_LINES_PER_SECOND: number
  /** 失敗時の主犯特定で遡る時間（直近 N 秒の log） */
  CULPRIT_WINDOW_MS: number

  /** threat 計算（GAME_ENGINE_DESIGN §9.4）。block = 本文を覆っているときの定数、trapRisk = onMistake × 係数 */
  THREAT_BLOCK_CONSTANT: number
  THREAT_TRAP_RISK_FACTOR: number

  /** onClear = SCORE_BASE × mean(難易度3軸)（§9.4.1）。severity からは導出しない */
  SCORE_BASE: number
  SCORE_COMPLETION: number
  SCORE_TRIAGE_BONUS: number
  SCORE_CHAIN_STEP: number
  SCORE_SPEED_BONUS_MAX: number
  SCORE_SURVIVAL_PER_PATIENCE: number
  SCORE_CLEAN_PLAY_BONUS: number
  SCORE_DAMAGE_PENALTY_PER_MISTAKE: number
  SCORE_TIME_PENALTY_PER_SECOND: number

  /** RAGE 発動に必要な chain、および演出強度の上限（GAME §9.3「読めなくなるほどやらない」） */
  RAGE_CHAIN_THRESHOLD: number
  RAGE_LEVEL_MAX: number

  /** ★仮置き（Q1）。1 広告内の Σ friction 上限（R4） */
  FRICTION_CAP: number
  /** ★仮置き（Q1）。同時アクティブ広告の Σ load 上限（R5） */
  LOAD_BUDGET: Record<DeviceProfile, number>
  /** R7 難易度帯の許容幅と再抽選回数 */
  DIFFICULTY_TOLERANCE: number
  GENERATE_MAX_RETRIES: number
}

export const DEFAULT_TUNING: EngineTuning = {
  MAX_CLOSE_DELAY_MS: 8000,
  MAX_CONCURRENT_ADS: { mobile: 2, desktop: 4 },

  PATIENCE_INITIAL: 100,
  PATIENCE_MAX: 100,
  PATIENCE_RECOVERY_PER_CLEAN_CLEAR: 3,
  PATIENCE_PENALTY_TOO_EARLY: 1,
  PATIENCE_PENALTY_STRAY_CLICK: 2,
  PATIENCE_PENALTY_WRONG_ANSWER: 8,

  READ_LINES_PER_SECOND: 2,
  CULPRIT_WINDOW_MS: 10000,

  THREAT_BLOCK_CONSTANT: 2,
  THREAT_TRAP_RISK_FACTOR: 0.1,

  SCORE_BASE: 100,
  SCORE_COMPLETION: 1000,
  SCORE_TRIAGE_BONUS: 50,
  SCORE_CHAIN_STEP: 25,
  SCORE_SPEED_BONUS_MAX: 500,
  SCORE_SURVIVAL_PER_PATIENCE: 5,
  SCORE_CLEAN_PLAY_BONUS: 300,
  SCORE_DAMAGE_PENALTY_PER_MISTAKE: 80,
  SCORE_TIME_PENALTY_PER_SECOND: 2,

  RAGE_CHAIN_THRESHOLD: 5,
  RAGE_LEVEL_MAX: 3,

  FRICTION_CAP: 5,
  LOAD_BUDGET: { mobile: 5, desktop: 8 },
  DIFFICULTY_TOLERANCE: 1,
  GENERATE_MAX_RETRIES: 8,
}

export function resolveTuning(overrides?: Partial<EngineTuning>): EngineTuning {
  return overrides ? { ...DEFAULT_TUNING, ...overrides } : DEFAULT_TUNING
}
