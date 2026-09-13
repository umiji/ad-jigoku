import type { ShellDescriptor } from '../types'

/** stickyBanner — 画面下に貼り付く帯（DESIGN.md §9 Sticky Ad / persistence） */
export const stickyBannerDescriptor: ShellDescriptor = {
  id: 'stickyBanner',
  parts: ['label', 'body', 'cta', 'close'],
  supports: ['spawn', 'persist'],
}
