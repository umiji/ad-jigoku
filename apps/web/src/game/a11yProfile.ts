import type { AccessibilityProfile } from '@ad-jigoku/game-engine'

/**
 * matchMedia → AccessibilityProfile（TASK-014 要件 4 / AD-8）。
 * - prefers-reduced-motion → reducedMotion
 * - pointer: coarse → pointerPrecision
 * - 音声は**既定 OFF**。ユーザーが明示的に ON にしたときだけ audioEnabled: true（SAFE-04）
 * reduced-motion は CSS の話ではなくエンジンへの入力（GAME_ENGINE_DESIGN §2.1）。
 */
export const MQ_REDUCED_MOTION = '(prefers-reduced-motion: reduce)'
export const MQ_COARSE_POINTER = '(pointer: coarse)'

type MediaHost = Pick<Window, 'matchMedia'>

export function readA11yProfile(win: MediaHost | undefined, overrides: Partial<AccessibilityProfile> = {}): AccessibilityProfile {
  const matches = (q: string) => (win ? win.matchMedia(q).matches : false)
  return {
    reducedMotion: matches(MQ_REDUCED_MOTION),
    pointerPrecision: matches(MQ_COARSE_POINTER) ? 'coarse' : 'fine',
    audioEnabled: false,
    extendedTimeouts: false,
    ...overrides,
  }
}

/** メディアクエリの変化を監視し、変わった部分だけ onChange に渡す（`{ t: 'a11y', profile }` intent にする） */
export function watchA11yProfile(win: MediaHost, onChange: (patch: Partial<AccessibilityProfile>) => void): () => void {
  const reduced = win.matchMedia(MQ_REDUCED_MOTION)
  const coarse = win.matchMedia(MQ_COARSE_POINTER)
  const onReduced = (e: MediaQueryListEvent) => onChange({ reducedMotion: e.matches })
  const onCoarse = (e: MediaQueryListEvent) => onChange({ pointerPrecision: e.matches ? 'coarse' : 'fine' })
  reduced.addEventListener('change', onReduced)
  coarse.addEventListener('change', onCoarse)
  return () => {
    reduced.removeEventListener('change', onReduced)
    coarse.removeEventListener('change', onCoarse)
  }
}

export function deviceProfileOf(win: MediaHost | undefined): 'mobile' | 'desktop' {
  if (!win) return 'desktop'
  return win.matchMedia(MQ_COARSE_POINTER).matches || win.matchMedia('(max-width: 767px)').matches ? 'mobile' : 'desktop'
}
