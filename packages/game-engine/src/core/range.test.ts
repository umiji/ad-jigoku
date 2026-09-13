import { describe, expect, it } from 'vitest'
import { pickFromRange, pickOne, resolveParam } from './range'
import { makeRng } from './rng'

describe('range', () => {
  it('pickFromRange stays within [min, max] inclusive and hits both ends', () => {
    const next = makeRng('r')('timing')
    const seen = new Set<number>()
    for (let i = 0; i < 2000; i++) {
      const v = pickFromRange({ min: 3, max: 7 }, next)
      expect(v).toBeGreaterThanOrEqual(3)
      expect(v).toBeLessThanOrEqual(7)
      expect(Number.isInteger(v)).toBe(true)
      seen.add(v)
    }
    expect([...seen].sort()).toEqual([3, 4, 5, 6, 7])
  })

  it('degenerate range returns min without consuming rng', () => {
    let calls = 0
    const next = () => {
      calls++
      return 0.5
    }
    expect(pickFromRange({ min: 4, max: 4 }, next)).toBe(4)
    expect(calls).toBe(0)
    expect(() => pickFromRange({ min: 5, max: 4 }, next)).toThrow(RangeError)
  })

  it('resolveParam passes numbers through and draws Ranges once', () => {
    let calls = 0
    const next = () => {
      calls++
      return 0.99
    }
    expect(resolveParam(42, next)).toBe(42)
    expect(calls).toBe(0)
    expect(resolveParam({ min: 1, max: 3 }, next)).toBe(3)
    expect(calls).toBe(1)
  })

  it('pickOne is deterministic per seed and rejects empty input', () => {
    const a = makeRng('p')('stage')
    const b = makeRng('p')('stage')
    const items = ['x', 'y', 'z']
    for (let i = 0; i < 50; i++) expect(pickOne(items, a)).toBe(pickOne(items, b))
    expect(() => pickOne([], a)).toThrow(RangeError)
  })
})
