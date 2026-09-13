import { describe, expect, it } from 'vitest'
import { MAX_FRAME_DT_MS, STEP_MS, advance, elapsedMs, msToSteps } from './clock'

function simulate(frameDts: number[]): number {
  let acc = 0
  let total = 0
  for (const dt of frameDts) {
    const r = advance(acc, dt)
    acc = r.acc
    total += r.steps
  }
  return total
}

describe('clock', () => {
  it('elapsedMs derives from step count only', () => {
    expect(elapsedMs(0)).toBe(0)
    expect(elapsedMs(60)).toBeCloseTo(1000, 6)
    expect(msToSteps(1000)).toBe(60)
    expect(msToSteps(1)).toBe(1)
  })

  it('60fps, 30fps and variable frames yield the same cumulative steps for the same wall time', () => {
    const seconds = 10
    const at60 = simulate(new Array(60 * seconds).fill(1000 / 60))
    const at30 = simulate(new Array(30 * seconds).fill(1000 / 30))
    // 可変: 12ms と 21.333ms を交互（平均 16.667ms）
    const variable: number[] = []
    let t = 0
    let i = 0
    while (t < 1000 * seconds - 1e-9) {
      const dt = i % 2 === 0 ? 12 : 1000 / 30 - 12 + 1000 / 60 - 1000 / 60 // 21.333...
      variable.push(dt)
      t += dt
      i++
    }
    expect(at60).toBe(60 * seconds)
    expect(at30).toBe(60 * seconds)
    expect(Math.abs(simulate(variable) - 60 * seconds)).toBeLessThanOrEqual(1)
  })

  it('clamps huge deltas (tab resume) so the player is not killed instantly', () => {
    const r = advance(0, 5000)
    expect(r.steps).toBe(Math.floor(MAX_FRAME_DT_MS / STEP_MS))
    expect(advance(0, -50).steps).toBe(0)
  })

  it('carries the remainder between frames', () => {
    const r1 = advance(0, 10)
    expect(r1.steps).toBe(0)
    expect(r1.acc).toBeCloseTo(10, 9)
    const r2 = advance(r1.acc, 10)
    expect(r2.steps).toBe(1)
    expect(r2.acc).toBeCloseTo(20 - STEP_MS, 9)
  })
})
