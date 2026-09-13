import { describe, expect, it } from 'vitest'
import { BehaviorRegistry } from './behavior-registry'
import { noopBehavior, noopShell } from './noop'
import { ShellRegistry } from './shell-registry'

describe('ShellRegistry', () => {
  it('registers, resolves, lists, and rejects duplicates', () => {
    const r = new ShellRegistry()
    r.register(noopShell)
    expect(r.resolve('noop')).toBe(noopShell)
    expect(r.has('noop')).toBe(true)
    expect(r.listRegistered().map((s) => s.id)).toEqual(['noop'])
    expect(() => r.register(noopShell)).toThrow(/重複/)
    expect(() => r.resolve('popup')).toThrow(/未登録/)
  })

  it('assertSupports rejects slots the shell does not support (R2 / V-13)', () => {
    const r = new ShellRegistry()
    r.register({ id: 'popup', parts: ['close', 'cta'], supports: ['spawn', 'close'], surface: 'overlay', sizeHint: 'medium' })
    expect(() => r.assertSupports('popup', ['spawn', 'close'])).not.toThrow()
    expect(() => r.assertSupports('popup', ['spawn', 'persist'])).toThrow(/persist/)
    expect(r.toImplementationMap().get('popup')).toEqual(['spawn', 'close'])
  })
})

describe('BehaviorRegistry', () => {
  it('registers, resolves by id + slot, rejects duplicates and slot mismatch', () => {
    const r = new BehaviorRegistry()
    r.register(noopBehavior('close'))
    expect(r.resolve('close:noop', 'close').slot).toBe('close')
    expect(() => r.register(noopBehavior('close'))).toThrow(/重複/)
    expect(() => r.resolve('close:noop', 'spawn')).toThrow(/スロット/)
    expect(() => r.resolve('spawn:noop', 'spawn')).toThrow(/未登録/)
    expect(r.toImplementationMap().get('close:noop')).toBe('close')
  })

  it('rejects an id whose prefix does not match its slot', () => {
    const r = new BehaviorRegistry()
    expect(() => r.register({ ...noopBehavior('close'), id: 'spawn:oops' })).toThrow(/接頭辞/)
  })
})
