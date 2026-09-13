import type { PatternDefinition, PatternId } from '@ad-jigoku/pattern-catalog'
import type { EngineTuning } from '../config'
import type { Effect } from '../state/effect'
import type { GameState } from '../state/types'

/**
 * 勝敗判定（TASK-009 要件 3-4）。毎 tick の最後に 1 回だけ呼ぶ。
 * - cleared: progress が total に到達し、設問（あれば）に全部答えた
 * - failed: patience が 0（主）/ 制限時間超過（従。ステージ定義で任意）
 * 失敗時は「何にやられたか」（culprit）を確定する（GAME §15.1 / §20「今回の主犯」）。
 */
export function checkOutcome(state: GameState, tuning: EngineTuning, timeLimitMs: number | undefined, effects: Effect[], byId: ReadonlyMap<string, PatternDefinition>): GameState {
  if (state.phase !== 'running') return state
  if (state.progress.read >= state.progress.total && state.progress.tasksDone >= state.progress.tasksTotal) {
    effects.push({ kind: 'toast', text: '読了。広告地獄を生き延びた。' })
    return { ...state, phase: 'cleared', log: [...state.log, { step: state.step, kind: 'cleared' }] }
  }
  const timeout = timeLimitMs !== undefined && state.elapsedMs > timeLimitMs
  if (state.patience <= 0 || timeout) {
    const culprit = findCulprit(state, tuning, byId)
    const reason = timeout && state.patience > 0 ? 'timeout' : 'patience-zero'
    effects.push({ kind: 'shake', intensity: 1 })
    const next: GameState = { ...state, phase: 'failed', log: [...state.log, { step: state.step, kind: 'failed', reason, ...(culprit ? { patternId: culprit } : {}) }] }
    return culprit ? { ...next, culprit } : next
  }
  return state
}

/**
 * 直近 CULPRIT_WINDOW_MS の log から patience を最も削ったパターンを特定する。
 * 該当がなければ全期間で最も削ったパターン、それも無ければ最後に出現したパターン。
 */
export function findCulprit(state: GameState, tuning: EngineTuning, byId: ReadonlyMap<string, PatternDefinition>): PatternId | undefined {
  const windowSteps = Math.ceil(tuning.CULPRIT_WINDOW_MS / (1000 / 60))
  const since = state.step - windowSteps
  const tally = (from: number) => {
    const loss = new Map<PatternId, number>()
    for (const e of state.log) {
      if (e.step < from || !e.patternId || e.patienceDelta === undefined || e.patienceDelta >= 0) continue
      loss.set(e.patternId, (loss.get(e.patternId) ?? 0) - e.patienceDelta)
    }
    // perSecondAlive の drain は毎 tick なので log に出さない。生存中の広告の drain 分をカタログから算出して加算する
    for (const ad of state.ads) {
      if (ad.lifecycle === 'closing') continue
      const aliveSteps = Math.max(0, state.step - Math.max(ad.spawnedAtStep, from))
      const perSecond = byId.get(ad.patternId)?.game?.patienceEffect.perSecondAlive ?? 0
      const drain = perSecond * (aliveSteps / 60)
      if (drain > 0) loss.set(ad.patternId, (loss.get(ad.patternId) ?? 0) + drain)
    }
    let best: PatternId | undefined
    let bestLoss = 0
    for (const [id, l] of loss) {
      if (l > bestLoss) {
        best = id
        bestLoss = l
      }
    }
    return best
  }
  const recent = tally(since)
  if (recent) return recent
  const overall = tally(0)
  if (overall) return overall
  const lastSpawn = [...state.log].reverse().find((e) => e.kind === 'spawn' && e.patternId)
  return lastSpawn?.patternId
}
