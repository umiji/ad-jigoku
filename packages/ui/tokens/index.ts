/**
 * デザイントークンの唯一の実体（ARCHITECTURE.md §10.1）。
 *
 * DESIGN.md §4,5,6,14,14.1,15,16,16.1,19 の YAML をそのまま TypeScript に落としたもの。
 * ここから `styles/tokens.css` と `styles/tailwind-theme.css` が生成される。
 * CSS 側を手で編集しないこと（CI の `tokens:check` が差分を検出する）。
 */
export { colors, type Colors } from './colors'
export { fontFamily, type, type TypeScale, type TypeScaleName } from './type'
export { container, spacingScale, spacingUnit, target, type SpacingStep, type TargetToken } from './spacing'
export { easing, motion, type MotionDuration, type MotionEasing } from './motion'
export { zIndex, type ZIndexLayer } from './zIndex'
export { shape, type ShapeToken } from './shape'
export { shadow, type ShadowToken } from './shadow'
export {
  buildTailwindThemeCss,
  buildTokensCss,
  compareTokenNames,
  tokenCssGroups,
  type CssGroup,
  type CssVar,
} from './css-vars'
export {
  contrastRatio,
  meetsWcagAa,
  meetsWcagAaLarge,
  parseHexColor,
  relativeLuminance,
  WCAG_AA_LARGE_TEXT,
  WCAG_AA_NORMAL_TEXT,
  type Rgb,
} from './contrast'
