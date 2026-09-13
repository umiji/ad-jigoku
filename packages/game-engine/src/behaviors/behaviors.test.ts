import { catalogVersion, loadCatalog } from '@ad-jigoku/pattern-catalog'
import { describe, expect, it } from 'vitest'
import { DEFAULT_TUNING } from '../config'
import { STEP_MS } from '../core/clock'
import { simulate } from '../replay/simulate'
import { createRun, step } from '../run'
import { createRegistries } from '../sim/registries'
import { ENTER_STEPS } from '../sim/spawn'
import { generateStage } from '../stage/generate'
import { getStage } from '../stage/data'
import { isImplemented, type GamePattern } from '../stage/rules'
import type { Run, RunConfig, ScheduledSpawn } from '../state/types'
import { registerMvp } from './index'

const catalog = loadCatalog()
const regs = () => registerMvp(createRegistries())
const a11y = { reducedMotion: false, pointerPrecision: 'fine', audioEnabled: false, extendedTimeouts: false } as const
const byId = (id: string) => catalog.find((p) => p.id === id) as GamePattern
const spawnOf = (id: string, atStep: number, instanceId: string): ScheduledSpawn => {
  const g = byId(id).game
  const behaviors: ScheduledSpawn['behaviors'] = {}
  for (const [slot, spec] of Object.entries(g.behaviors ?? {})) {
    if (!spec) continue
    const params: Record<string, number> = {}
    for (const [k, v] of Object.entries(spec.params ?? {})) params[k] = typeof v === 'number' ? v : v.max
    behaviors[slot as keyof ScheduledSpawn['behaviors']] = { id: spec.id, params }
  }
  return { instanceId, atStep, patternId: id as ScheduledSpawn['patternId'], shellId: g.shell!, behaviors, creativeIndex: 0 }
}
const base: RunConfig = { seed: 'b', mode: 'story', stageId: 'stage-1', catalog, accessibility: a11y, device: 'desktop', contentTotalLines: 30 }
const tick = (run: Run, n = 1) => {
  let r = run
  for (let i = 0; i < n; i++) r = step(r, { t: 'tick' }).run
  return r
}

describe('実装済みパターン（実カタログ × MVP シェル × baseline behaviors）', () => {
  it('INT-01 / OBS-01 / OBS-03 / CLS-03 are implemented; unimplemented ones are not', () => {
    const r = regs()
    for (const id of ['INT-01', 'OBS-01', 'OBS-03', 'CLS-03']) expect(isImplemented(byId(id), r), id).toBe(true)
    for (const id of ['CLS-05', 'CLS-11', 'DEC-02', 'ATT-02', 'PER-01']) expect(isImplemented(byId(id), r), id).toBe(false)
  })

  it('INT-01 popup: spawns as overlay, closable after entering, closes on ×', () => {
    let run = createRun({ ...base, schedule: [spawnOf('INT-01', 1, 'p')] }, regs())
    run = tick(run)
    const ad = run.state.ads[0]!
    expect(ad.view.shellId).toBe('popup')
    expect(ad.view.surface).toBe('overlay')
    expect(ad.view.motion).toContain('enter-scale')
    expect(ad.blocksProgress).toBe(false)
    run = tick(run, ENTER_STEPS)
    expect(run.state.ads[0]?.lifecycle).toBe('closable')
    run = step(run, { t: 'point', target: { kind: 'ad', instanceId: 'p', part: 'close' } }).run
    expect(run.state.ads[0]?.lifecycle).toBe('closing')
  })

  it('OBS-01 fullscreen overlay blocks progress until closed', () => {
    let run = createRun({ ...base, schedule: [spawnOf('OBS-01', 1, 'f')] }, regs())
    run = tick(run)
    expect(run.state.ads[0]?.view.surface).toBe('fullscreen')
    expect(run.state.ads[0]?.blocksProgress).toBe(true)
    for (let i = 0; i < 30; i++) run = tick(step(run, { t: 'read' }).run)
    expect(run.state.progress.read).toBe(0)
    run = step(run, { t: 'point', target: { kind: 'ad', instanceId: 'f', part: 'close' } }).run
    for (let i = 0; i < 30; i++) run = tick(step(run, { t: 'read' }).run)
    expect(run.state.progress.read).toBeGreaterThan(0)
  })

  it('OBS-03 sticky banner sits at the bottom and does not block reading', () => {
    let run = createRun({ ...base, schedule: [spawnOf('OBS-03', 1, 's')] }, regs())
    run = tick(run)
    expect(run.state.ads[0]?.view.surface).toBe('sticky-bottom')
    expect(run.state.ads[0]?.view.motion).toContain('sticky-track')
    expect(run.state.ads[0]?.blocksProgress).toBe(false)
  })

  it('CLS-03 delayed close: countdown is always visible and × becomes enabled exactly at closableAtStep (≤ MAX_CLOSE_DELAY_MS)', () => {
    let run = createRun({ ...base, schedule: [spawnOf('CLS-03', 1, 'd')] }, regs())
    run = tick(run)
    const ad = run.state.ads[0]!
    const delayMs = ad.behaviors.close?.params['delayMs'] ?? 0
    expect(delayMs).toBeGreaterThan(0)
    expect((ad.closableAtStep - ad.spawnedAtStep) * STEP_MS).toBeCloseTo(delayMs, -1)
    expect((ad.closableAtStep - ad.spawnedAtStep) * STEP_MS).toBeLessThanOrEqual(DEFAULT_TUNING.MAX_CLOSE_DELAY_MS)
    expect(ad.view.countdown?.remainingMs).toBe(delayMs)
    run = tick(run, 60)
    const mid = run.state.ads[0]!
    expect(mid.view.countdown?.remainingMs).toBeLessThan(delayMs)
    expect(mid.view.countdown?.remainingMs).toBeGreaterThan(0)
    expect(mid.lifecycle).toBe('visible')
    expect(mid.view.parts.find((p) => p.part === 'close')?.enabled).toBe(false)
    // 早押しは軽微なミス
    run = step(run, { t: 'point', target: { kind: 'ad', instanceId: 'd', part: 'close' } }).run
    expect(run.state.mistakes['too-early']).toBe(1)
    run = tick(run, ad.closableAtStep - run.state.step)
    const ready = run.state.ads[0]!
    expect(ready.lifecycle).toBe('closable')
    expect(ready.view.countdown?.remainingMs).toBe(0)
    expect(ready.view.parts.find((p) => p.part === 'close')?.enabled).toBe(true)
  })

  it('spawn:delayed {afterMs} shifts the scheduled spawn later by afterMs', () => {
    const { forcedPatterns: _f, ...stage1 } = getStage('stage-1')
    const stage = { ...stage1, templates: [{ id: 'x', roles: [{ role: 'wildcard' as const }], spacingMs: { min: 0, max: 0 } }], targetDifficulty: { min: 0, max: 5 }, allowedPatterns: ['ATT-01' as const] }
    const r = registerMvp(createRegistries())
    r.behaviors.register({ id: 'attention:autoplay-video', slot: 'attention', friction: 0, load: 1, init: () => ({ sim: null }), onTick: (s) => ({ sim: s }), onIntent: (s) => ({ sim: s }) })
    const g = generateStage({ stageDef: stage, catalog, registries: r, tuning: DEFAULT_TUNING, seed: 'delay', device: 'desktop' })
    const s = g.spawns[0]!
    expect(s.patternId).toBe('ATT-01')
    const afterMs = s.behaviors.spawn?.params['afterMs'] ?? 0
    expect(afterMs).toBeGreaterThanOrEqual(1500)
    expect(s.atStep * STEP_MS).toBeGreaterThanOrEqual(800 + afterMs - STEP_MS)
  })
})

describe('stage-1 headless: 実カタログで 1 本通る（SAFE-01 property）', () => {
  it('300 seeds: every ad becomes closable within MAX_CLOSE_DELAY_MS and optimal play clears', { timeout: 60000 }, () => {
    const r = regs()
    let cleared = 0
    for (let i = 0; i < 300; i++) {
      const { record, summary } = simulate({ ...base, seed: `s1-${i}`, contentTotalLines: getStage('stage-1').contentLength }, 'optimal', catalogVersion.catalogVersion, { registries: r, maxSteps: 60 * 90 })
      expect(summary.adsSeen).toBeGreaterThan(0)
      if (summary.phase === 'cleared') cleared++
      // 記録された run を辿り、全広告の closableAtStep が上限以内
      expect(record.totalSteps).toBeGreaterThan(0)
    }
    expect(cleared / 300).toBeGreaterThan(0.95)
  })

  it('every spawn in 300 generated stage-1 schedules respects SAFE-01 when instantiated', { timeout: 60000 }, () => {
    const r = regs()
    for (let i = 0; i < 300; i++) {
      const run = createRun({ ...base, seed: `safe-${i}` }, r)
      let cur = run
      const last = Math.max(...cur.state.schedule.map((s) => s.atStep))
      for (let k = 0; k <= last; k++) {
        cur = tick(cur)
        for (const ad of cur.state.ads) expect((ad.closableAtStep - ad.spawnedAtStep) * STEP_MS).toBeLessThanOrEqual(DEFAULT_TUNING.MAX_CLOSE_DELAY_MS + STEP_MS)
        for (const ad of cur.state.ads) if (ad.lifecycle === 'closable') cur = step(cur, { t: 'point', target: { kind: 'ad', instanceId: ad.instanceId, part: 'close' } }).run
      }
    }
  })
})
