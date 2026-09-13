import { createRun, MINI_CATALOG, fixtureRegistries, STEP_MS } from '@ad-jigoku/game-engine'
import { describe, expect, it } from 'vitest'
import { advanceFrame, createLoopState, queueIntent } from './loop'

const a11y = { reducedMotion: false, pointerPrecision: 'fine', audioEnabled: false, extendedTimeouts: false } as const
const mk = () => createRun({ seed: 'loop', mode: 'story', stageId: 'stage-1', catalog: MINI_CATALOG, accessibility: a11y, device: 'desktop', contentTotalLines: 100 }, fixtureRegistries())

describe('host loop (rAF accumulator)', () => {
  it('converts variable dt into fixed steps and carries the remainder', () => {
    const loop = createLoopState(mk())
    const f1 = advanceFrame(loop, 10, false, true)
    expect(f1.steps).toBe(0)
    expect(f1.acc).toBeCloseTo(10, 9)
    loop.run = f1.run
    loop.acc = f1.acc
    const f2 = advanceFrame(loop, 45, false, true)
    expect(f2.steps).toBe(3) // (10 + 45) / 16.667 = 3 余り 5
    expect(f2.run.state.step).toBe(3)
    expect(f2.run.state.progress.read).toBeCloseTo((3 * 2) / 60, 9) // read を毎 tick 送っている
  })

  it('does not advance while hidden (patience does not drain in the background) but still applies queued intents', () => {
    const loop = createLoopState(mk())
    queueIntent(loop, { t: 'a11y', profile: { reducedMotion: true } })
    const f = advanceFrame(loop, 5000, true, true)
    expect(f.steps).toBe(0)
    expect(f.run.state.step).toBe(0)
    expect(f.run.state.a11y.reducedMotion).toBe(true)
    expect(f.acc).toBe(0)
  })

  it('clamps huge dt (tab resume) to at most 200ms of steps', () => {
    const loop = createLoopState(mk())
    const f = advanceFrame(loop, 60000, false, false)
    expect(f.steps).toBe(Math.floor(200 / STEP_MS))
  })

  it('stops ticking once the run is no longer running', () => {
    const loop = createLoopState(mk())
    loop.run = { ...loop.run, state: { ...loop.run.state, phase: 'failed' } }
    const f = advanceFrame(loop, 100, false, true)
    expect(f.steps).toBe(0)
  })
})
