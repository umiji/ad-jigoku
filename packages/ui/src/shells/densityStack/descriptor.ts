import type { ShellDescriptor } from '../types'

/** densityStack — 積み上がる広告（DESIGN.md §9 Layered Ad / chaos。PER-01 / PER-02 の見た目） */
export const densityStackDescriptor: ShellDescriptor = {
  id: 'densityStack',
  parts: ['label', 'body', 'cta', 'close'],
  supports: ['spawn', 'persist'],
}
