import type { PlayerAction } from '@ad-jigoku/pattern-catalog'

/** GAME_ENGINE_DESIGN.md §4 Intent（入力）。ピクセル座標は持たない（§4.1） */

export type AdPart = 'close' | 'fake-close' | 'cta' | 'body' | 'media' | 'label' | 'legal' | 'decoy'

export type TargetRef =
  | { kind: 'ad'; instanceId: string; part: AdPart }
  | { kind: 'content'; id: string }
  | { kind: 'chrome'; id: string }

export type AccessibilityProfile = {
  reducedMotion: boolean
  pointerPrecision: 'coarse' | 'fine'
  /** 既定 false。ユーザー操作でのみ true になる（SAFE-04） */
  audioEnabled: boolean
  /** 反応速度に配慮した緩和モード */
  extendedTimeouts: boolean
}

export type Intent =
  | { t: 'tick' }
  | { t: 'point'; target: TargetRef }
  | { t: 'action'; action: PlayerAction; target?: TargetRef }
  | { t: 'scroll'; deltaLines: number }
  | { t: 'read' }
  | { t: 'answer'; questionId: string; choice: number }
  | { t: 'a11y'; profile: Partial<AccessibilityProfile> }

export const DEFAULT_A11Y_PROFILE: AccessibilityProfile = {
  reducedMotion: false,
  pointerPrecision: 'fine',
  audioEnabled: false,
  extendedTimeouts: false,
}
