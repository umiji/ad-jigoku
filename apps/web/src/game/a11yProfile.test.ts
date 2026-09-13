import { describe, expect, it, vi } from 'vitest'
import { deviceProfileOf, MQ_COARSE_POINTER, MQ_REDUCED_MOTION, readA11yProfile, watchA11yProfile } from './a11yProfile'

type Listener = (e: MediaQueryListEvent) => void

function fakeWindow(matchesByQuery: Record<string, boolean>) {
  const listeners = new Map<string, Set<Listener>>()
  const win = {
    matchMedia: (q: string) => ({
      matches: matchesByQuery[q] ?? false,
      media: q,
      addEventListener: (_: 'change', l: Listener) => {
        if (!listeners.has(q)) listeners.set(q, new Set())
        listeners.get(q)!.add(l)
      },
      removeEventListener: (_: 'change', l: Listener) => listeners.get(q)?.delete(l),
    }),
  } as unknown as Window
  const fire = (q: string, matches: boolean) => listeners.get(q)?.forEach((l) => l({ matches } as MediaQueryListEvent))
  const count = (q: string) => listeners.get(q)?.size ?? 0
  return { win, fire, count }
}

describe('a11yProfile', () => {
  it('reads reduced-motion and coarse pointer; audio is OFF by default', () => {
    const { win } = fakeWindow({ [MQ_REDUCED_MOTION]: true, [MQ_COARSE_POINTER]: true })
    expect(readA11yProfile(win)).toEqual({ reducedMotion: true, pointerPrecision: 'coarse', audioEnabled: false, extendedTimeouts: false })
    expect(readA11yProfile(undefined)).toEqual({ reducedMotion: false, pointerPrecision: 'fine', audioEnabled: false, extendedTimeouts: false })
  })

  it('audio can only be enabled by an explicit override (user action), never by media queries', () => {
    const { win } = fakeWindow({})
    expect(readA11yProfile(win).audioEnabled).toBe(false)
    expect(readA11yProfile(win, { audioEnabled: true }).audioEnabled).toBe(true)
  })

  it('watch reports media query changes as partial patches and can be disposed', () => {
    const { win, fire, count } = fakeWindow({})
    const patches: unknown[] = []
    const stop = watchA11yProfile(win, (p) => patches.push(p))
    fire(MQ_REDUCED_MOTION, true)
    fire(MQ_COARSE_POINTER, true)
    fire(MQ_COARSE_POINTER, false)
    expect(patches).toEqual([{ reducedMotion: true }, { pointerPrecision: 'coarse' }, { pointerPrecision: 'fine' }])
    stop()
    expect(count(MQ_REDUCED_MOTION)).toBe(0)
    expect(count(MQ_COARSE_POINTER)).toBe(0)
  })

  it('deviceProfileOf: coarse pointer or narrow viewport → mobile', () => {
    expect(deviceProfileOf(fakeWindow({ [MQ_COARSE_POINTER]: true }).win)).toBe('mobile')
    expect(deviceProfileOf(fakeWindow({ '(max-width: 767px)': true }).win)).toBe('mobile')
    expect(deviceProfileOf(fakeWindow({}).win)).toBe('desktop')
    vi.restoreAllMocks()
  })
})
