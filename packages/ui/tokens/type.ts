/**
 * DESIGN.md §5 Typography。値はそのまま写す（発明しない）。
 *
 * フォントファミリは DESIGN §5 が「日本語対応の sans-serif を使う / 3 ファミリ以下」
 * とだけ定めている。実体として可変フォント `M PLUS 2 Variable` を 1 ファミリだけ採用し、
 * 以降は OS 標準の日本語フォントへフォールバックする（DESIGN_REQUIREMENTS §3.3）。
 */
export const fontFamily = {
  sans: "'M PLUS 2 Variable', 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', 'Noto Sans JP', 'Yu Gothic', Meiryo, system-ui, sans-serif",
} as const

export const type = {
  display: {
    size: 'clamp(3rem, 10vw, 8rem)',
    weight: 800,
    lineHeight: 0.95,
    letterSpacing: '-0.04em',
  },
  h1: {
    size: 'clamp(2.5rem, 7vw, 5rem)',
    weight: 800,
    lineHeight: 1,
  },
  h2: {
    size: 'clamp(1.8rem, 4vw, 3.5rem)',
    weight: 700,
    lineHeight: 1.05,
  },
  body: {
    size: '1rem',
    weight: 400,
    lineHeight: 1.7,
  },
  adHeadline: {
    size: 'clamp(1.2rem, 3vw, 2.4rem)',
    weight: 800,
    lineHeight: 1.05,
  },
  adMeta: {
    size: '0.65rem',
    weight: 600,
    lineHeight: 1.2,
    letterSpacing: '0.08em',
  },
  adLegal: {
    size: '0.55rem',
    weight: 400,
    lineHeight: 1.35,
  },
} as const

export type TypeScale = typeof type
export type TypeScaleName = keyof TypeScale
