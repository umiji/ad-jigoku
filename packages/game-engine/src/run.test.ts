import { describe, expect, it } from 'vitest'
import { STEP_MS } from './core/clock'
import { DEFAULT_TUNING } from './config'
import { createRun, hashState, step } from './run'
import type { Run, RunConfig } from './state/types'

export function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const v of Object.values(value as Record<string, unknown>)) deepFreeze(v)
  }
  return value
}

export const baseConfig: RunConfig = {
  seed: 'test-seed',
  mode: 'story',
  stageId: 'stage-1',
  catalog: [],
  accessibility: { reducedMotion: false, pointerPrecision: 'fine', audioEnabled: false, extendedTimeouts: false },
  device: 'desktop',
}

function ticks(run: Run, n: number): Run {
  let r = run
  for (let i = 0; i < n; i++) r = step(r, { t: 'tick' }).run
  return r
}

describe('createRun / step (TASK-006 骨格)', () => {
  it('createRun → step × N が型エラーなく通り、elapsedMs = N × STEP_MS', () => {
    const run = ticks(createRun(baseConfig), 600)
    expect(run.state.step).toBe(600)
    expect(run.state.elapsedMs).toBeCloseTo(600 * STEP_MS, 6)
    expect(run.state.patience).toBe(DEFAULT_TUNING.PATIENCE_INITIAL)
  })

  it('60 秒分「何も起きないゲーム」がブラウザなしで回る', () => {
    const run = ticks(createRun(baseConfig), 60 * 60)
    expect(run.state.elapsedMs).toBeCloseTo(60000, 3)
    expect(run.state.phase).toBe('running')
    expect(run.state.ads).toEqual([])
  })

  it('step() は入力の run を変更しない（deep-freeze した state でも例外が出ない）', () => {
    const run = deepFreeze(createRun(baseConfig))
    const before = hashState(run)
    const { run: next } = step(run, { t: 'tick' })
    expect(hashState(run)).toBe(before)
    expect(next).not.toBe(run)
    expect(next.state.step).toBe(1)
    // 他の intent も凍結状態で例外なし
    for (const intent of [
      { t: 'point' as const, target: { kind: 'content' as const, id: 'p1' } },
      { t: 'action' as const, action: 'SMASH' as const },
      { t: 'scroll' as const, deltaLines: 3 },
      { t: 'read' as const },
      { t: 'answer' as const, questionId: 'q1', choice: 0 },
      { t: 'a11y' as const, profile: { reducedMotion: true } },
    ]) {
      expect(() => step(run, intent)).not.toThrow()
    }
  })

  it('a11y intent はプロファイルを部分更新する', () => {
    const { run } = step(createRun(baseConfig), { t: 'a11y', profile: { reducedMotion: true } })
    expect(run.state.a11y).toEqual({ ...baseConfig.accessibility, reducedMotion: true })
  })

  it('同一 seed / 同一 intent 列で hashState が一致する', () => {
    const a = ticks(createRun(baseConfig), 300)
    const b = ticks(createRun(baseConfig), 300)
    expect(hashState(a)).toBe(hashState(b))
    expect(hashState(a)).not.toBe(hashState(ticks(createRun(baseConfig), 299)))
  })

  it('cleared / failed 後は intent を受け付けない', () => {
    const run = createRun(baseConfig)
    const done: Run = { ...run, state: { ...run.state, phase: 'failed' } }

    const r = step(done, { t: 'tick' })
    expect(r.run).toBe(done)
    expect(r.effects).toEqual([])
  })

  it('overrides が EngineTuning に反映される', () => {
    const run = createRun({ ...baseConfig, overrides: { PATIENCE_INITIAL: 50 } })
    expect(run.state.patience).toBe(50)
  })
})
