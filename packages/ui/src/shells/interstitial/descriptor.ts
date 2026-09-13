import type { ShellDescriptor } from '../types'

/** interstitial — 本文を覆う全画面の割り込み（DESIGN.md §9 Fullscreen / interruption） */
export const interstitialDescriptor: ShellDescriptor = {
  id: 'interstitial',
  parts: ['label', 'body', 'media', 'cta', 'legal', 'close'],
  supports: ['spawn', 'surface'],
}
