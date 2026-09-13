import { describe, expect, it } from 'vitest'
import { createRngCursor, initialStreamState, makeRng, mulberry32Step, xmur3 } from './rng'

describe('rng', () => {
  it('is reproducible: same seed → identical 10000-value sequence', () => {
    const a = makeRng('hell-01')('stage')
    const b = makeRng('hell-01')('stage')
    for (let i = 0; i < 10000; i++) expect(a()).toBe(b())
  })

  it('matches a pinned expectation vector (regression guard)', () => {
    const r = makeRng('pinned')('timing')
    const got = Array.from({ length: 5 }, () => Number(r().toFixed(8)))
    // 変更したら「意図的にエンジンの乱数列を変えた」ことになる。共有済み seed challenge が全部変わる
    expect(got).toEqual([0.75056315, 0.26148646, 0.28805497, 0.52417867, 0.89798253])
    const s0 = initialStreamState('pinned', 'timing')
    const { value } = mulberry32Step(s0)
    expect(got[0]).toBe(Number(value.toFixed(8)))
  })

  it('different seeds and different streams produce different sequences', () => {
    const a = makeRng('s1')('stage')
    const b = makeRng('s2')('stage')
    const c = makeRng('s1')('timing')
    const seqA = Array.from({ length: 20 }, () => a())
    const seqB = Array.from({ length: 20 }, () => b())
    const seqC = Array.from({ length: 20 }, () => c())
    expect(seqA).not.toEqual(seqB)
    expect(seqA).not.toEqual(seqC)
  })

  it('stream independence: drawing from a new stream never changes an existing stream (最重要)', () => {
    const only = makeRng('seed-x')
    const stageOnly = Array.from({ length: 1000 }, () => only('stage')())

    const mixed = makeRng('seed-x')
    const stageMixed: number[] = []
    for (let i = 0; i < 1000; i++) {
      // 途中で creative / jitter を好きなだけ引いても stage の列は変わらない
      if (i % 3 === 0) mixed('creative')()
      if (i % 7 === 0) mixed('jitter')()
      stageMixed.push(mixed('stage')())
    }
    expect(stageMixed).toEqual(stageOnly)
  })

  it('cursor snapshot round-trips: resuming from a snapshot continues the same sequence', () => {
    const c1 = createRngCursor('snap', {})
    const first = Array.from({ length: 10 }, () => c1.rng('placement')())
    const snap = c1.snapshot()
    const c2 = createRngCursor('snap', snap)
    const c1Rest = Array.from({ length: 10 }, () => c1.rng('placement')())
    const c2Rest = Array.from({ length: 10 }, () => c2.rng('placement')())
    expect(c2Rest).toEqual(c1Rest)
    expect(first).not.toEqual(c1Rest)
    // 未使用ストリームはスナップショットに現れない（追加しても既存 hash が変わらない）
    expect(Object.keys(snap)).toEqual(['placement'])
  })

  it('is roughly uniform on [0,1)', () => {
    const r = makeRng('uniform')('jitter')
    const buckets = new Array<number>(10).fill(0)
    const n = 100000
    let min = 1
    let max = 0
    for (let i = 0; i < n; i++) {
      const v = r()
      min = Math.min(min, v)
      max = Math.max(max, v)
      buckets[Math.floor(v * 10)]! += 1
    }
    expect(min).toBeGreaterThanOrEqual(0)
    expect(max).toBeLessThan(1)
    for (const b of buckets) expect(Math.abs(b / n - 0.1)).toBeLessThan(0.01)
  })

  it('xmur3 is deterministic', () => {
    expect(xmur3('abc')()).toBe(xmur3('abc')())
    expect(xmur3('abc')()).not.toBe(xmur3('abd')())
  })
})
