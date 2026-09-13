import type { PatternDefinition } from '@ad-jigoku/pattern-catalog'
import { describe, expect, it } from 'vitest'
import { createRun, hashState, step } from '../run'
import { noopBehavior, noopShell } from '../sim/noop'
import { createRegistries } from '../sim/registries'
import { CLOSING_STEPS, ENTER_STEPS } from '../sim/spawn'
import type { Run, RunConfig, ScheduledSpawn } from '../state/types'
import { baseConfig } from '../run.test'

export const noopPattern: PatternDefinition = {
  id: 'INT-01',
  category: 'INT',
  name: { ja: '即時ポップアップ', en: 'Immediate Popup' },
  definition: { ja: 'ページ表示直後にポップアップ' },
  severity: 10,
  severitySource: 'hypothesis',
  gameDifficulty: 2,
  dimensions: { interruption: 3 },
  game: {
    shell: 'noop',
    behaviors: { spawn: { id: 'spawn:noop' }, close: { id: 'close:noop' } },
    playerActions: ['CLOSE', 'SMASH'],
    failureCondition: { kind: 'patience-zero' },
    warning: 'none',
    interactionComplexity: 1,
    uncertainty: 1,
    timePressure: 2,
    comboTags: ['popup'],
    incompatibleWith: [],
    patienceEffect: { onSpawn: 5, onMistake: 10, perSecondAlive: 1 },
    education: { ja: 'ページを開いた瞬間に出るポップアップ。' },
  },
}

export function noopRegistries() {
  const r = createRegistries()
  r.shells.register(noopShell)
  for (const slot of ['spawn', 'close', 'surface', 'persist', 'attention', 'instability', 'deception', 'hitbox'] as const) r.behaviors.register(noopBehavior(slot))
  return r
}

export const spawnAt = (atStep: number, instanceId = 'ad-1'): ScheduledSpawn => ({
  instanceId,
  atStep,
  patternId: 'INT-01',
  shellId: 'noop',
  behaviors: { spawn: { id: 'spawn:noop', params: {} }, close: { id: 'close:noop', params: {} } },
  creativeIndex: 0,
})

export function tick(run: Run, n = 1): Run {
  let r = run
  for (let i = 0; i < n; i++) r = step(r, { t: 'tick' }).run
  return r
}

const config: RunConfig = { ...baseConfig, catalog: [noopPattern], schedule: [spawnAt(1)] }

describe('noop shell + behavior: spawn → tick → close の一連の流れ (TASK-007)', () => {
  it('spawns from the schedule, becomes visible then closable, and closes on point(close)', () => {
    let run = createRun(config, noopRegistries())
    expect(run.state.ads).toHaveLength(0)
    run = tick(run)
    expect(run.state.ads).toHaveLength(1)
    const ad = run.state.ads[0]!
    expect(ad.lifecycle).toBe('entering')
    expect(ad.closableAtStep).toBe(1 + ENTER_STEPS) // closeDelay 0 でも entering が終わるまでは closable にしない
    expect(ad.view.shellId).toBe('noop')
    expect(ad.view.surface).toBe('overlay')
    expect(run.state.schedule).toHaveLength(0)
    expect(run.state.patience).toBeCloseTo(95 - 1 / 60, 9) // onSpawn 5 + 1 tick 分の perSecondAlive
    expect(run.state.log.map((l) => l.kind)).toEqual(['spawn'])

    run = tick(run, ENTER_STEPS)
    const visible = run.state.ads[0]!
    expect(visible.lifecycle).toBe('closable')
    expect(visible.view.parts.find((p) => p.part === 'close')?.enabled).toBe(true)

    const closed = step(run, { t: 'point', target: { kind: 'ad', instanceId: 'ad-1', part: 'close' } })
    expect(closed.run.state.ads[0]?.lifecycle).toBe('closing')
    expect(closed.effects.map((e) => e.kind)).toContain('sound')
    expect(closed.run.state.log.at(-1)?.kind).toBe('closed')

    run = tick(closed.run, CLOSING_STEPS)
    expect(run.state.ads).toHaveLength(0)
  })

  it('pressing × too early is a mild mistake; cta is clicked-ad; SMASH when closable smashes', () => {
    let run = createRun(config, noopRegistries())
    run = tick(run)
    // closable 判定は closableAtStep <= step だが、entering 中でも既定処理は lifecycle を見る
    const early = step({ ...run, state: { ...run.state, ads: run.state.ads.map((a) => ({ ...a, lifecycle: 'visible', closableAtStep: 999 })) } }, { t: 'point', target: { kind: 'ad', instanceId: 'ad-1', part: 'close' } })
    expect(early.run.state.mistakes['too-early']).toBe(1)
    expect(early.run.state.patience).toBeCloseTo(95 - 1 / 60 - 1, 9) // onSpawn 5、1 tick 分の drain、PATIENCE_PENALTY_TOO_EARLY(1)

    const cta = step(run, { t: 'point', target: { kind: 'ad', instanceId: 'ad-1', part: 'cta' } })
    expect(cta.run.state.mistakes['clicked-ad']).toBe(1)
    expect(cta.run.state.patience).toBeCloseTo(95 - 1 / 60 - 10, 9) // onMistake 10

    run = tick(run, ENTER_STEPS)
    const smashed = step(run, { t: 'action', action: 'SMASH', target: { kind: 'ad', instanceId: 'ad-1', part: 'body' } })
    expect(smashed.run.state.ads[0]?.lifecycle).toBe('closing')
    expect(smashed.effects.map((e) => e.kind)).toEqual(expect.arrayContaining(['smash', 'stamp']))
    expect(smashed.run.state.log.at(-1)?.kind).toBe('smashed')
  })

  it('perSecondAlive drains patience while the ad is alive (1/s → -1 after 60 ticks)', () => {
    let run = createRun(config, noopRegistries())
    run = tick(run, 61)
    expect(run.state.patience).toBeCloseTo(95 - 61 / 60, 9) // spawn tick を含む 61 tick 分
  })

  it('respects MAX_CONCURRENT_ADS and carries over the rest of the schedule', () => {
    const schedule = [spawnAt(1, 'a'), spawnAt(1, 'b'), spawnAt(1, 'c')]
    let run = createRun({ ...config, device: 'mobile', schedule }, noopRegistries())
    run = tick(run)
    expect(run.state.ads.map((a) => a.instanceId)).toEqual(['a', 'b'])
    expect(run.state.schedule.map((s) => s.instanceId)).toEqual(['c'])
    expect(run.state.ads[1]?.view.stackIndex).toBe(1)
  })

  it('throws when the scheduled shell is not registered (AD-2: 実装のないパターンは出ない)', () => {
    const regs = createRegistries()
    for (const slot of ['spawn', 'close'] as const) regs.behaviors.register(noopBehavior(slot))
    const run = createRun(config, regs)
    expect(() => tick(run)).toThrow(/未登録の ShellId "noop"/)
  })

  it('throws when a behavior is assigned to a slot the shell does not support (V-13)', () => {
    const regs = noopRegistries()
    regs.shells.register({ id: 'banner', parts: ['close'], supports: ['spawn'], surface: 'sticky-bottom', sizeHint: 'small' })
    const bad: ScheduledSpawn = { ...spawnAt(1), shellId: 'banner' }
    const run = createRun({ ...config, schedule: [bad] }, regs)
    expect(() => tick(run)).toThrow(/close/)
  })

  it('is deterministic across identical runs including rng state', () => {
    const a = tick(createRun(config, noopRegistries()), 120)
    const b = tick(createRun(config, noopRegistries()), 120)
    expect(hashState(a)).toBe(hashState(b))
  })
})
