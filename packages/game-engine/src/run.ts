import { STEP_MS } from './core/clock'
import { hashValue } from './core/hash'
import { resolveTuning, type EngineTuning } from './config'
import { DEFAULT_A11Y_PROFILE, type Intent } from './state/intent'
import type { Effect } from './state/effect'
import type { GameState, Run, RunConfig } from './state/types'

/**
 * GAME_ENGINE_DESIGN.md §2 Public API。
 * `step()` は純粋関数。入力の run を破壊的に変更しない（構造共有はする）。
 */

export type StepResult = { run: Run; effects: Effect[] }

export const DEFAULT_CONTENT_TOTAL_LINES = 60
export const DEFAULT_TASKS_TOTAL = 2

export function createRun(config: RunConfig): Run {
  const tuning = resolveTuning(config.overrides)
  const state: GameState = {
    step: 0,
    phase: 'running',
    progress: { read: 0, tasksDone: 0, total: config.contentTotalLines ?? DEFAULT_CONTENT_TOTAL_LINES, tasksTotal: DEFAULT_TASKS_TOTAL },
    elapsedMs: 0,
    patience: tuning.PATIENCE_INITIAL,
    ads: [],
    combo: { chain: 0, bestChain: 0, activeTags: [], namedCombosSeen: [] },
    score: {
      total: 0,
      completion: 0,
      speedBonus: 0,
      accuracyBonus: 0,
      comboBonus: 0,
      survivalBonus: 0,
      triageBonus: 0,
      damagePenalty: 0,
      timePenalty: 0,
      clearPoints: 0,
    },
    rage: { meter: 0, active: false, level: 0 },
    log: [],
    schedule: [...(config.schedule ?? [])],
    rng: {},
    a11y: { ...DEFAULT_A11Y_PROFILE, ...config.accessibility },
    mistakes: { 'too-early': 0, 'clicked-ad': 0, 'fake-close': 0, 'stray-click': 0, 'wrong-answer': 0, 'wrong-action': 0 },
    nextInstanceSeq: 0,
    answered: {},
  }
  return { config, state }
}

export function tuningOf(run: Run): EngineTuning {
  return resolveTuning(run.config.overrides)
}

/** 任意ステップでの状態ハッシュ。リプレイ回帰テストの assertion に使う */
export function hashState(run: Run): string {
  return hashValue(run.state)
}

export function step(run: Run, intent: Intent): StepResult {
  const { state } = run
  // クリア / 失敗後は intent を受け付けない（TASK-009 要件 5）
  if (state.phase === 'cleared' || state.phase === 'failed') return { run, effects: [] }

  const effects: Effect[] = []
  const next = reduce(state, intent, effects)
  return { run: next === state ? run : { config: run.config, state: next }, effects }
}

/**
 * Intent の種類を全部受け付ける。未実装の処理は TODO ではなく、`never` による網羅チェックで漏れが検出される。
 * 各ハンドラの中身は後続タスク（007 sim 接続 / 009 リソース / 010 スコア / 011 コンボ / 015 設問）で埋める。
 */
function reduce(state: GameState, intent: Intent, _effects: Effect[]): GameState {
  switch (intent.t) {
    case 'tick':
      return onTick(state)
    case 'point':
      return state
    case 'action':
      return state
    case 'scroll':
      return state
    case 'read':
      return state
    case 'answer':
      return state
    case 'a11y':
      return { ...state, a11y: { ...state.a11y, ...intent.profile } }
    default:
      return assertNever(intent)
  }
}

function onTick(state: GameState): GameState {
  const nextStep = state.step + 1
  return { ...state, step: nextStep, elapsedMs: nextStep * STEP_MS }
}

export function assertNever(x: never): never {
  throw new Error(`未処理の intent: ${JSON.stringify(x)}`)
}
