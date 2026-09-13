import type { ShellDescriptor } from '../types'

/**
 * popup — 中央に浮く「ブラウザ広告のウィンドウ」（DESIGN.md §8 の canonical anatomy）。
 * `parts` / `supports` は `packages/game-engine/src/sim/shells.ts` の宣言と一致していなければならない。
 */
export const popupDescriptor: ShellDescriptor = {
  id: 'popup',
  parts: ['label', 'body', 'media', 'cta', 'legal', 'close'],
  supports: ['spawn', 'close', 'deception', 'hitbox'],
}
