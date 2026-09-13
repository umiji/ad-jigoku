/**
 * DESIGN.md §20「sufficient contrast」を機械的に検証する。
 * 主要な「文字色 × 背景色」の組み合わせが WCAG 2.1 AA（本文 4.5:1）を満たすこと。
 *
 * ここが落ちたらテストを緩めるのではなく DESIGN.md §4 の色を直す（CLAUDE.md §3）。
 */
import { describe, expect, it } from 'vitest'
import { colors } from '../tokens/colors'
import { contrastRatio, relativeLuminance, WCAG_AA_NORMAL_TEXT } from '../tokens/contrast'

/** [ラベル, 前景, 背景] */
const PAIRS: readonly (readonly [string, string, string])[] = [
  ['text.primary / bg.primary', colors.text.primary, colors.bg.primary],
  ['text.primary / bg.secondary', colors.text.primary, colors.bg.secondary],
  ['text.primary / bg.elevated', colors.text.primary, colors.bg.elevated],
  ['text.secondary / bg.primary', colors.text.secondary, colors.bg.primary],
  ['text.inverse / surface.popup', colors.text.inverse, colors.surface.popup],
  ['text.primary / surface.popupDark', colors.text.primary, colors.surface.popupDark],
  ['text.inverse / accent.danger', colors.text.inverse, colors.accent.danger],
  ['text.inverse / accent.warning', colors.text.inverse, colors.accent.warning],
  ['text.inverse / accent.success', colors.text.inverse, colors.accent.success],
]

describe('relativeLuminance', () => {
  it('returns 0 for black and 1 for white', () => {
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 10)
    expect(relativeLuminance('#FFFFFF')).toBeCloseTo(1, 10)
  })

  it('accepts 3-digit shorthand and is case-insensitive', () => {
    expect(relativeLuminance('#fff')).toBeCloseTo(relativeLuminance('#FFFFFF'), 10)
  })

  it('throws when the color is not a plain hex value', () => {
    expect(() => relativeLuminance('rgba(0,0,0,0.72)')).toThrow()
  })
})

describe('contrastRatio', () => {
  it('returns 21 for black on white', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 6)
  })

  it('is symmetric', () => {
    expect(contrastRatio(colors.text.primary, colors.bg.primary)).toBeCloseTo(
      contrastRatio(colors.bg.primary, colors.text.primary),
      10,
    )
  })

  it('returns 1 for identical colors', () => {
    expect(contrastRatio(colors.bg.primary, colors.bg.primary)).toBeCloseTo(1, 10)
  })
})

describe('DESIGN.md §4 の主要な組み合わせは WCAG AA (4.5:1) を満たす', () => {
  it.each(PAIRS)('%s', (_label, foreground, background) => {
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT)
  })
})
