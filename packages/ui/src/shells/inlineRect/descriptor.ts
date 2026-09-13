import type { ShellDescriptor } from '../types'

/** inlineRect — 本文中のレクタングル広告（DESIGN.md §9 Layout Shift / instability） */
export const inlineRectDescriptor: ShellDescriptor = {
  id: 'inlineRect',
  parts: ['label', 'media', 'cta'],
  supports: ['spawn', 'instability'],
}
