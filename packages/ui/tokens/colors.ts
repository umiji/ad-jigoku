/**
 * DESIGN.md §4 Color System。値はそのまま写す（発明しない）。
 *
 * 公開するのは意味論的な役割名だけ。`red500` のような色名トークンは作らない（DESIGN §4）。
 * 新しい色が必要になったら、まず DESIGN.md を改訂する（packages/ui/README.md 参照）。
 *
 * YAML のキー `popup_dark` は TS 側では camelCase (`popupDark`) にしている。
 * CSS 変数名は `--color-surface-popup-dark`。値は一切変えていない。
 */
export const colors = {
  bg: {
    primary: '#080808',
    secondary: '#111111',
    elevated: '#181818',
  },
  surface: {
    popup: '#F4F1EA',
    popupDark: '#1C1C1C',
    overlay: 'rgba(0,0,0,0.72)',
  },
  text: {
    primary: '#F5F3EE',
    secondary: '#A8A5A0',
    inverse: '#0A0A0A',
  },
  accent: {
    danger: '#FF3B30',
    warning: '#FFD23F',
    electric: '#E8E8E8',
    success: '#7CFF6B',
  },
  border: {
    subtle: 'rgba(255,255,255,0.12)',
    popup: 'rgba(0,0,0,0.18)',
  },
} as const

export type Colors = typeof colors
