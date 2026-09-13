/**
 * WCAG 2.1 のコントラスト比計算（DESIGN.md §20「sufficient contrast」の自動検証用）。
 *
 * 純粋関数のみ。DOM も外部依存も使わない。
 * 参照: https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */

/** 本文テキストの AA 基準 */
export const WCAG_AA_NORMAL_TEXT = 4.5

/** 大きな文字（18pt 以上 / 14pt 以上の bold）の AA 基準 */
export const WCAG_AA_LARGE_TEXT = 3

const HEX_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i
const SRGB_MAX = 255
const LINEAR_THRESHOLD = 0.04045
const LINEAR_DIVISOR = 12.92
const GAMMA_OFFSET = 0.055
const GAMMA_EXPONENT = 2.4
/** WCAG 2.1 の相対輝度係数 */
const LUMINANCE_COEFFICIENTS = { r: 0.2126, g: 0.7152, b: 0.0722 } as const
/** 0 除算を避けるための WCAG 既定のオフセット */
const CONTRAST_OFFSET = 0.05

export type Rgb = { readonly r: number; readonly g: number; readonly b: number }

/**
 * `#RGB` / `#RRGGBB` を 0-255 の RGB に分解する。
 * `rgba()` などアルファを持つ色は、合成先が分からない以上コントラストを判定できないので拒否する。
 */
export function parseHexColor(hex: string): Rgb {
  if (!HEX_PATTERN.test(hex)) {
    throw new Error(`コントラスト計算には不透明な hex 色が必要（受け取った値: ${hex}）`)
  }
  const body = hex.slice(1)
  const full = body.length === 3 ? body.replace(/./g, (c) => c + c) : body
  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16),
  }
}

function toLinear(channel8Bit: number): number {
  const channel = channel8Bit / SRGB_MAX
  return channel <= LINEAR_THRESHOLD
    ? channel / LINEAR_DIVISOR
    : Math.pow((channel + GAMMA_OFFSET) / (1 + GAMMA_OFFSET), GAMMA_EXPONENT)
}

/** 相対輝度 (0..1) */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = parseHexColor(hex)
  return (
    LUMINANCE_COEFFICIENTS.r * toLinear(r) +
    LUMINANCE_COEFFICIENTS.g * toLinear(g) +
    LUMINANCE_COEFFICIENTS.b * toLinear(b)
  )
}

/** コントラスト比 (1..21)。引数の順序には依存しない */
export function contrastRatio(colorA: string, colorB: string): number {
  const a = relativeLuminance(colorA)
  const b = relativeLuminance(colorB)
  const lighter = Math.max(a, b)
  const darker = Math.min(a, b)
  return (lighter + CONTRAST_OFFSET) / (darker + CONTRAST_OFFSET)
}

/** 本文サイズで AA を満たすか */
export function meetsWcagAa(foreground: string, background: string): boolean {
  return contrastRatio(foreground, background) >= WCAG_AA_NORMAL_TEXT
}

/** 大きな文字で AA を満たすか */
export function meetsWcagAaLarge(foreground: string, background: string): boolean {
  return contrastRatio(foreground, background) >= WCAG_AA_LARGE_TEXT
}
