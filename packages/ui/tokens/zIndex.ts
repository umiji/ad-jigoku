/**
 * DESIGN.md §15 Depth / Layering。値はそのまま写す（発明しない）。
 *
 * `z-index: 9999` のような直書きは stylelint で落ちる。必ずここを経由する。
 * YAML のキー `popup_stack` は TS 側では camelCase (`popupStack`)。
 */
export const zIndex = {
  page: 0,
  ambient: 10,
  sticky: 100,
  popup: 500,
  popupStack: 600,
  critical: 800,
  system: 1000,
} as const

export type ZIndexLayer = keyof typeof zIndex
