import type { PatternDefinition } from '@ad-jigoku/pattern-catalog'
import { STEP_MS } from './core/clock'
import { hashValue } from './core/hash'
import { createRngCursor } from './core/rng'
import { resolveTuning, type EngineTuning } from './config'
import { handleTargetedIntent } from './engine/intent'
import { drainPatience, tickAds } from './engine/tick'
import type { StepEnv } from './engine/context'
import { checkOutcome } from './resource/outcome'
import { applyAnswer, applyRead } from './resource/progress'
import { computeThreats } from './resource/threat'
import { updateEnemyCombo } from './combo/detect'
import { updateRage } from './rage/rage'
import { finalizeScore } from './score/score'
import { getStage } from './stage/data'
import { defaultRegistries, type Registries } from './sim/registries'
import { DEFAULT_A11Y_PROFILE, type Intent } from './state/intent'
import type { Effect } from './state/effect'
import type { GameState, Run, RunConfig } from './state/types'

/**
 * GAME_ENGINE_DESIGN.md §2 Public API。
 * `step()` は純粋関数。入力の run を破壊的に変更しない（構造共有はする）。
 * RNG はストリーム毎の uint32 を state に持ち、step の中でローカルに進めて書き戻す（ADR-002 / TASK-005）。
 */

export type StepResult = { run: Run; effects: Effect[] }

export const DEFAULT_CONTENT_TOTAL_LINES = 60

export function createRun(config: RunConfig, registries: Registries = defaultRegistries): Run {
  const tuning = resolveTuning(config.overrides)
  const state: GameState = {
    step: 0,
    phase: 'running',
    progress: { read: 0, tasksDone: 0, total: config.contentTotalLines ?? DEFAULT_CONTENT_TOTAL_LINES, tasksTotal: config.questions?.length ?? 0 },
    elapsedMs: 0,
    patience: tuning.PATIENCE_INITIAL,
    ads: [],
    combo: { chain: 0, bestChain: 0, activeTags: [], namedCombosSeen: [] },
    score: { total: 0, completion: 0, speedBonus: 0, accuracyBonus: 0, comboBonus: 0, survivalBonus: 0, triageBonus: 0, damagePenalty: 0, timePenalty: 0, clearPoints: 0 },
    rage: { meter: 0, active: false, level: 0 },
    log: [],
    schedule: [...(config.schedule ?? [])],
    rng: {},
    a11y: { ...DEFAULT_A11Y_PROFILE, ...config.accessibility },
    mistakes: { 'too-early': 0, 'clicked-ad': 0, 'fake-close': 0, 'stray-click': 0, 'wrong-answer': 0, 'wrong-action': 0 },
    nextInstanceSeq: 0,
    answered: {},
    scrollLine: 0,
  }
  return { config, state, registries }
}

export function tuningOf(run: Run): EngineTuning {
  return resolveTuning(run.config.overrides)
}

/** 任意ステップでの状態ハッシュ。リプレイ回帰テストの assertion に使う */
export function hashState(run: Run): string {
  return hashValue(run.state)
}

const patternIndexCache = new WeakMap<readonly PatternDefinition[], Map<string, PatternDefinition>>()
function patternIndex(catalog: readonly PatternDefinition[]): Map<string, PatternDefinition> {
  let m = patternIndexCache.get(catalog)
  if (!m) {
    m = new Map(catalog.map((p) => [p.id, p]))
    patternIndexCache.set(catalog, m)
  }
  return m
}

export function step(run: Run, intent: Intent): StepResult {
  const { state } = run
  // クリア / 失敗後は intent を受け付けない（TASK-009 要件 5）
  if (state.phase === 'cleared' || state.phase === 'failed') return { run, effects: [] }

  const effects: Effect[] = []
  const cursor = createRngCursor(run.config.seed, state.rng)
  const env: StepEnv = { run, tuning: tuningOf(run), rng: cursor.rng, patternById: patternIndex(run.config.catalog) }
  let next = reduce(env, state, intent, effects)
  const rng = cursor.snapshot()
  if (next !== state || Object.keys(rng).length !== Object.keys(state.rng).length) next = { ...next, rng }
  return { run: next === state ? run : { ...run, state: next }, effects }
}

/**
 * Intent の種類を全部受け付ける。未実装の処理は TODO ではなく、`never` による網羅チェックで漏れが検出される。
 * scroll / read / answer は後続タスク（009 リソース / 015 設問）で埋める。
 */
function reduce(env: StepEnv, state: GameState, intent: Intent, effects: Effect[]): GameState {
  switch (intent.t) {
    case 'tick':
      return onTick(env, state, effects)
    case 'point':
    case 'action':
      return handleTargetedIntent(env, state, intent, effects)
    case 'scroll':
      return { ...state, scrollLine: Math.max(0, state.scrollLine + intent.deltaLines) }
    case 'read':
      return applyRead(state, env.tuning)
    case 'answer':
      return applyAnswer(state, env.run.config.questions ?? [], intent.questionId, intent.choice, env.tuning)
    case 'a11y':
      return { ...state, a11y: { ...state.a11y, ...intent.profile } }
    default:
      return assertNever(intent)
  }
}

function onTick(env: StepEnv, state: GameState, effects: Effect[]): GameState {
  const nextStep = state.step + 1
  let next: GameState = { ...state, step: nextStep, elapsedMs: nextStep * STEP_MS }
  next = tickAds(env, next, effects)
  next = drainPatience(env, next)
  next = computeThreats(next, env.patternById, env.tuning)
  next = updateEnemyCombo(next, env.patternById)
  next = updateRage(next, env.tuning, effects)
  // 判定は毎 tick の最後に 1 回だけ（TASK-009 要件 3）
  next = checkOutcome(next, env.tuning, env.run.config.timeLimitMs, effects, env.patternById)
  if (next.phase !== 'running') next = { ...next, score: finalizeScore(next, env.tuning, expectedDurationMs(env)) }
  return next
}

function expectedDurationMs(env: StepEnv): number {
  const explicit = env.run.config.expectedDurationMs
  if (explicit !== undefined) return explicit
  try {
    return getStage(env.run.config.stageId).durationMs
  } catch {
    return 60000
  }
}

export function assertNever(x: never): never {
  throw new Error(`未処理の intent: ${JSON.stringify(x)}`)
}
