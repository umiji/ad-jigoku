import type { PatternDefinition } from '@ad-jigoku/pattern-catalog'
import { describe, expect, it } from 'vitest'
import { DEFAULT_TUNING } from '../config'
import { createRun, step } from '../run'
import { baseConfig } from '../run.test'
import { noopPattern, noopRegistries, spawnAt, tick } from '../engine/flow.test'
import { ENTER_STEPS } from '../sim/spawn'
import type { ActiveAd, Run, RunConfig, ScheduledSpawn } from '../state/types'
import { threatOf } from './threat'

const withEffect = (id: PatternDefinition['id'], onSpawn: number, onMistake: number, perSecondAlive: number, extra: Partial<NonNullable<PatternDefinition['game']>> = {}): PatternDefinition => ({
  ...noopPattern,
  id,
  category: id.slice(0, id.indexOf('-')) as PatternDefinition['category'],
  game: { ...noopPattern.game!, ...extra, patienceEffect: { onSpawn, onMistake, perSecondAlive } },
})

const catalog: PatternDefinition[] = [
  withEffect('INT-01', 5, 10, 1),
  withEffect('OBS-01', 5, 5, 1.5), // fullscreen: blocks progress
  withEffect('ATT-02', 5, 5, 3), // auto sound: high drain
  withEffect('OBS-03', 3, 5, 0.5), // sticky banner
  withEffect('CLS-11', 5, 25, 0), // fake close: trap
  withEffect('DEC-02', 3, 30, 0, { correctInaction: true }), // fake download: don't touch
]

const config: RunConfig = { ...baseConfig, catalog, contentTotalLines: 10 }
const sp = (patternId: PatternDefinition['id'], atStep: number, instanceId: string): ScheduledSpawn => ({ ...spawnAt(atStep, instanceId), patternId })

function readFor(run: Run, ticks: number): Run {
  let r = run
  for (let i = 0; i < ticks; i++) {
    r = step(r, { t: 'read' }).run
    r = step(r, { t: 'tick' }).run
  }
  return r
}

describe('Progress', () => {
  it('advances only on read intents at a constant rate and clears at total', () => {
    let run = createRun({ ...config, schedule: [] }, noopRegistries())
    run = tick(run, 60)
    expect(run.state.progress.read).toBe(0)
    run = readFor(run, 60)
    expect(run.state.progress.read).toBeCloseTo(DEFAULT_TUNING.READ_LINES_PER_SECOND, 6)
    run = readFor(run, 60 * 5)
    expect(run.state.progress.read).toBe(10)
    expect(run.state.phase).toBe('cleared')
    expect(run.state.log.at(-1)?.kind).toBe('cleared')
  })

  it('does not advance while an ad covers the article (blockProgress)', () => {
    let run = createRun({ ...config, schedule: [sp('OBS-01', 1, 'ov')] }, noopRegistries())
    run = tick(run)
    // fullscreen surface → blocksProgress。noop shell は overlay なので手で立てる
    run = { ...run, state: { ...run.state, ads: run.state.ads.map((a): ActiveAd => ({ ...a, blocksProgress: true })) } }
    run = readFor(run, 60)
    expect(run.state.progress.read).toBe(0)
    run = tick(run, ENTER_STEPS)
    run = step(run, { t: 'point', target: { kind: 'ad', instanceId: 'ov', part: 'close' } }).run
    run = readFor(run, 60)
    expect(run.state.progress.read).toBeGreaterThan(0)
  })

  it('requires all questions answered to clear; wrong answers cost patience but not progress', () => {
    let run = createRun({ ...config, schedule: [], questions: [{ id: 'q1', correctChoice: 2 }] }, noopRegistries())
    run = readFor(run, 60 * 6)
    expect(run.state.progress.read).toBe(10)
    expect(run.state.phase).toBe('running')
    run = step(run, { t: 'answer', questionId: 'q1', choice: 0 }).run
    expect(run.state.patience).toBe(100 - DEFAULT_TUNING.PATIENCE_PENALTY_WRONG_ANSWER)
    expect(run.state.progress.read).toBe(10)
    expect(run.state.mistakes['wrong-answer']).toBe(1)
    run = step(run, { t: 'answer', questionId: 'q1', choice: 2 }).run
    expect(run.state.progress.tasksDone).toBe(1)
    run = tick(run)
    expect(run.state.phase).toBe('cleared')
  })
})

describe('Patience', () => {
  it('recovers on a clean clear and never exceeds the cap', () => {
    let run = createRun({ ...config, schedule: [sp('INT-01', 1, 'a')], overrides: { PATIENCE_INITIAL: 90 } }, noopRegistries())
    run = tick(run, 1 + ENTER_STEPS)
    const before = run.state.patience
    run = step(run, { t: 'point', target: { kind: 'ad', instanceId: 'a', part: 'close' } }).run
    expect(run.state.patience).toBeCloseTo(before + DEFAULT_TUNING.PATIENCE_RECOVERY_PER_CLEAN_CLEAR, 9)
    expect(run.state.log.at(-1)?.kind).toBe('recover')

    let full = createRun({ ...config, schedule: [sp('INT-01', 1, 'b')], overrides: { PATIENCE_INITIAL: 100 } }, noopRegistries())
    full = tick(full, 1 + ENTER_STEPS)
    full = { ...full, state: { ...full.state, patience: 100 } }
    full = step(full, { t: 'point', target: { kind: 'ad', instanceId: 'b', part: 'close' } }).run
    expect(full.state.patience).toBe(100)
  })

  it('does not recover when the ad was handled with a mistake', () => {
    let run = createRun({ ...config, schedule: [sp('INT-01', 1, 'a')] }, noopRegistries())
    run = tick(run, 1 + ENTER_STEPS)
    run = step(run, { t: 'point', target: { kind: 'ad', instanceId: 'a', part: 'cta' } }).run
    const before = run.state.patience
    run = step(run, { t: 'point', target: { kind: 'ad', instanceId: 'a', part: 'close' } }).run
    expect(run.state.patience).toBe(before)
  })

  it('fails immediately at patience 0 and identifies a culprit', () => {
    let run = createRun({ ...config, schedule: [sp('CLS-11', 1, 'fake'), sp('INT-01', 1, 'pop')], overrides: { PATIENCE_INITIAL: 40 } }, noopRegistries())
    run = tick(run, 1 + ENTER_STEPS)
    run = step(run, { t: 'point', target: { kind: 'ad', instanceId: 'fake', part: 'fake-close' } }).run // -25
    run = step(run, { t: 'point', target: { kind: 'ad', instanceId: 'pop', part: 'cta' } }).run // -10 → 40-5-5-25-10 < 0
    expect(run.state.patience).toBe(0)
    expect(run.state.phase).toBe('running') // 判定は tick の最後
    run = tick(run)
    expect(run.state.phase).toBe('failed')
    expect(run.state.culprit).toBe('CLS-11')
    expect(run.state.log.at(-1)).toMatchObject({ kind: 'failed', reason: 'patience-zero', patternId: 'CLS-11' })
    // 以降 intent を受け付けない
    const after = step(run, { t: 'tick' })
    expect(after.run).toBe(run)
  })

  it('time limit (secondary) fails with reason timeout', () => {
    let run = createRun({ ...config, schedule: [], timeLimitMs: 1000 }, noopRegistries())
    run = tick(run, 61)
    expect(run.state.phase).toBe('failed')
    expect(run.state.log.at(-1)?.reason).toBe('timeout')
  })

  it('culprit falls back to the last spawned pattern when only drain caused the loss', () => {
    let run = createRun({ ...config, schedule: [sp('ATT-02', 1, 'snd')], overrides: { PATIENCE_INITIAL: 6 } }, noopRegistries())
    run = tick(run, 60) // onSpawn 5 + drain 3/s → 0 within a second
    expect(run.state.phase).toBe('failed')
    expect(run.state.culprit).toBe('ATT-02')
  })
})

describe('threat (Prioritization)', () => {
  it('orders auto-sound > fullscreen > sticky banner > fake-close popup > fake download', () => {
    const mk = (id: PatternDefinition['id'], blocks: boolean): ActiveAd => ({
      instanceId: id,
      patternId: id,
      shellId: 'noop',
      spawnedAtStep: 0,
      closableAtStep: 0,
      lifecycle: 'closable',
      behaviors: {},
      view: { shellId: 'noop', surface: 'overlay', sizeHint: 'medium', creative: { index: 0 }, parts: [], motion: [], stackIndex: 0 },
      blocksProgress: blocks,
      threat: 0,
      mistakeCount: 0,
      creativeIndex: 0,
    })
    const byId = new Map(catalog.map((p) => [p.id, p]))
    const t = (id: PatternDefinition['id'], blocks = false) => threatOf(mk(id, blocks), byId.get(id), DEFAULT_TUNING)
    const sound = t('ATT-02')
    const fullscreen = t('OBS-01', true)
    const banner = t('OBS-03')
    const fakeClose = t('CLS-11')
    const fakeDownload = t('DEC-02')
    expect(sound).toBeGreaterThan(fullscreen)
    expect(fullscreen).toBeGreaterThan(banner)
    expect(banner).toBeGreaterThan(fakeClose)
    expect(fakeClose).toBeGreaterThan(fakeDownload)
  })

  it('is recomputed on every tick for each active ad', () => {
    let run = createRun({ ...config, schedule: [sp('ATT-02', 1, 's'), sp('CLS-11', 1, 'f')] }, noopRegistries())
    run = tick(run)
    const byId = Object.fromEntries(run.state.ads.map((a) => [a.instanceId, a.threat]))
    expect(byId['s']).toBeGreaterThan(byId['f']!)
  })
})

describe('strategy: fast vs safe (GAME §5.1 tradeoff)', () => {
  const schedule = [sp('INT-01', 1, 'a'), sp('INT-01', 120, 'b'), sp('INT-01', 240, 'c')]
  function play(strategy: 'fast' | 'safe'): Run {
    let run = createRun({ ...config, schedule, contentTotalLines: 1000 }, noopRegistries())
    for (let i = 0; i < 400; i++) {
      run = step(run, { t: 'read' }).run
      run = step(run, { t: 'tick' }).run
      for (const ad of run.state.ads) {
        if (ad.lifecycle === 'closing') continue
        if (strategy === 'fast' || ad.lifecycle === 'closable') {
          run = step(run, { t: 'point', target: { kind: 'ad', instanceId: ad.instanceId, part: 'close' } }).run
        }
      }
    }
    return run
  }
  it('closing safely (waiting for closable) ends with more patience than hammering × immediately', () => {
    const fast = play('fast')
    const safe = play('safe')
    expect(fast.state.mistakes['too-early']).toBeGreaterThan(0)
    expect(safe.state.mistakes['too-early']).toBe(0)
    expect(safe.state.patience).toBeGreaterThan(fast.state.patience)
    // どちらも最終的に広告は全部閉じている
    expect(safe.state.ads.filter((a) => a.lifecycle !== 'closing')).toHaveLength(0)
  })
})
