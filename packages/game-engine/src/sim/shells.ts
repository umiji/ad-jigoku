import type { Registries } from './registries'
import type { Shell } from './types'

/**
 * MVP 8 シェルのエンジン側宣言（GAME_ENGINE_DESIGN §7.1 / packages/pattern-catalog/README §4 の契約）。
 * 見た目（React + CSS）は packages/ui/shells/<id>/（TASK-013A/B/C）。ここは id / parts / supports / 既定レイアウトだけ。
 * UI 側の宣言と一致することを apps/web のテストで検査する。
 */
export const MVP_SHELLS: readonly Shell[] = [
  { id: 'popup', parts: ['label', 'body', 'media', 'cta', 'legal', 'close'], supports: ['spawn', 'close', 'deception', 'hitbox'], surface: 'overlay', sizeHint: 'medium' },
  { id: 'interstitial', parts: ['label', 'body', 'media', 'cta', 'legal', 'close'], supports: ['spawn', 'surface'], surface: 'fullscreen', sizeHint: 'fullscreen' },
  { id: 'stickyBanner', parts: ['label', 'body', 'cta', 'close'], supports: ['spawn', 'persist'], surface: 'sticky-bottom', sizeHint: 'small' },
  { id: 'inlineRect', parts: ['label', 'media', 'cta'], supports: ['spawn', 'instability'], surface: 'inline', sizeHint: 'medium' },
  { id: 'videoPlayer', parts: ['label', 'media', 'cta', 'close'], supports: ['spawn', 'persist', 'attention'], surface: 'corner', sizeHint: 'medium' },
  { id: 'densityStack', parts: ['label', 'body', 'cta', 'close'], supports: ['spawn', 'persist'], surface: 'overlay', sizeHint: 'medium' },
  { id: 'fakeDownload', parts: ['label', 'body', 'cta', 'decoy'], supports: ['spawn', 'deception'], surface: 'inline', sizeHint: 'medium' },
  { id: 'fakePlay', parts: ['label', 'media', 'cta', 'decoy'], supports: ['spawn', 'deception'], surface: 'inline', sizeHint: 'medium' },
]

export function registerMvpShells(registries: Registries): Registries {
  for (const s of MVP_SHELLS) if (!registries.shells.has(s.id)) registries.shells.register(s)
  return registries
}
