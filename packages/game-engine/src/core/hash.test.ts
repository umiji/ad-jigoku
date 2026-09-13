import { describe, expect, it } from 'vitest'
import { fnv1a64, hashValue, stableStringify } from './hash'

describe('hash', () => {
  it('is key-order independent', () => {
    const a = { x: 1, y: { b: 2, a: [1, 2, { k: 'v' }] }, z: 'str' }
    const b = { z: 'str', y: { a: [1, 2, { k: 'v' }], b: 2 }, x: 1 }
    expect(hashValue(a)).toBe(hashValue(b))
  })

  it('ignores undefined-valued keys but not null', () => {
    expect(hashValue({ a: 1, b: undefined })).toBe(hashValue({ a: 1 }))
    expect(hashValue({ a: 1, b: null })).not.toBe(hashValue({ a: 1 }))
  })

  it('rounds floats to 6 digits and unifies -0 / 0', () => {
    expect(hashValue({ v: 0.1 + 0.2 })).toBe(hashValue({ v: 0.3 }))
    expect(hashValue({ v: 1.0000001 })).toBe(hashValue({ v: 1 }))
    expect(hashValue({ v: -0 })).toBe(hashValue({ v: 0 }))
    expect(hashValue({ v: 1.5 })).not.toBe(hashValue({ v: 1.6 }))
  })

  it('includes arbitrary nested sim state', () => {
    const s1 = { ads: [{ sim: { moves: [1, 2], phase: 'a' } }] }
    const s2 = { ads: [{ sim: { moves: [1, 3], phase: 'a' } }] }
    expect(hashValue(s1)).not.toBe(hashValue(s2))
  })

  it('fnv1a64 returns 16 hex chars and is stable', () => {
    expect(fnv1a64('')).toBe('cbf29ce484222325')
    expect(fnv1a64('a')).toBe('af63dc4c8601ec8c')
    expect(hashValue({ hello: 'world' })).toMatch(/^[0-9a-f]{16}$/)
  })

  it('stableStringify handles arrays and primitives', () => {
    expect(stableStringify([1, 'a', true, null])).toBe('[1,"a",true,null]')
  })
})
