import type { AccessibilityProfile, Effect } from '@ad-jigoku/game-engine'
import { describe, expect, it, vi } from 'vitest'
import { createEffectRunner, REDUCED_MOTION_SHAKE_FACTOR } from './effects'

const base: AccessibilityProfile = { reducedMotion: false, pointerPrecision: 'fine', audioEnabled: false, extendedTimeouts: false }

describe('effects runner', () => {
  it('swallows sound unless audioEnabled (SAFE-04)', () => {
    const playSound = vi.fn()
    const run = createEffectRunner({ playSound })
    run([{ kind: 'sound', id: 'popup' }], base)
    expect(playSound).not.toHaveBeenCalled()
    run([{ kind: 'sound', id: 'popup' }], { ...base, audioEnabled: true })
    expect(playSound).toHaveBeenCalledWith('popup')
  })

  it('attenuates shake and rage under reducedMotion', () => {
    const shake = vi.fn()
    const rage = vi.fn()
    const run = createEffectRunner({ shake, rage })
    const effects: Effect[] = [{ kind: 'shake', intensity: 1 }, { kind: 'rage', level: 3 }]
    run(effects, base)
    expect(shake).toHaveBeenLastCalledWith(1)
    expect(rage).toHaveBeenLastCalledWith(3)
    run(effects, { ...base, reducedMotion: true })
    expect(shake).toHaveBeenLastCalledWith(REDUCED_MOTION_SHAKE_FACTOR)
    expect(rage).toHaveBeenLastCalledWith(1)
  })

  it('routes smash / stamp / toast and tolerates missing sinks', () => {
    const smash = vi.fn()
    const stamp = vi.fn()
    const toast = vi.fn()
    createEffectRunner({ smash, stamp, toast })([{ kind: 'smash', instanceId: 'a' }, { kind: 'stamp', text: 'BLOCKED' }, { kind: 'toast', text: 'hi' }], base)
    expect(smash).toHaveBeenCalledWith('a')
    expect(stamp).toHaveBeenCalledWith('BLOCKED')
    expect(toast).toHaveBeenCalledWith('hi')
    expect(() => createEffectRunner({})([{ kind: 'smash', instanceId: 'a' }], base)).not.toThrow()
  })
})
