import type { CSSProperties } from 'react'
import { cx } from './cx'
import styles from './closeGlyph.module.css'
import type { Emphasis, PartAnchor } from './types'

/**
 * 本物の × と偽の × の共通部分（見た目・当たり判定・配置）。
 * 意味（aria-label / data-target）は共有しない。そこが 2 つの唯一の違いだから。
 */
export type CloseGlyphLayout = {
  /** 見た目の縮尺。0.5〜1 に丸める（見えない × を作らない） */
  readonly visualScale?: number
  /** 当たり判定の倍率。1 未満は無視する（44px を下回らせない / DESIGN.md §19） */
  readonly hitboxScale?: number
  /** % 指定の位置。渡すと anchored 配置になる（moving close） */
  readonly anchor?: PartAnchor
  /** `corner` = 親の右上 / `flow` = 通常フロー */
  readonly placement?: 'corner' | 'flow'
  readonly emphasis?: Emphasis
  readonly enabled?: boolean
}

export const MIN_VISUAL_SCALE = 0.5
export const MAX_VISUAL_SCALE = 1

function clampVisualScale(scale: number): number {
  if (!Number.isFinite(scale)) return MAX_VISUAL_SCALE
  return Math.min(MAX_VISUAL_SCALE, Math.max(MIN_VISUAL_SCALE, scale))
}

/** 当たり判定は広げられるが、縮められない */
function clampHitboxScale(scale: number): number {
  if (!Number.isFinite(scale)) return 1
  return Math.max(1, scale)
}

const EMPHASIS_CLASS: Record<Emphasis, string | undefined> = {
  0: styles.quiet,
  1: undefined,
  2: styles.loud,
}

export function glyphClassName(layout: CloseGlyphLayout, className?: string): string {
  const { anchor, placement = 'corner', emphasis = 1, enabled = true } = layout
  return cx(
    styles.button,
    anchor ? styles.anchored : placement === 'flow' ? styles.flow : styles.corner,
    EMPHASIS_CLASS[emphasis],
    !enabled && styles.inert,
    className,
  )
}

/** 数値はすべて CSS 変数として渡す。CSS 側が max() で 44px を守る */
export function glyphStyle(layout: CloseGlyphLayout): CSSProperties {
  const { visualScale = MAX_VISUAL_SCALE, hitboxScale = 1, anchor } = layout
  return {
    '--close-visual-scale': String(clampVisualScale(visualScale)),
    '--close-hitbox-scale': String(clampHitboxScale(hitboxScale)),
    ...(anchor ? { '--close-x': `${anchor.xPercent}%`, '--close-y': `${anchor.yPercent}%` } : {}),
  } as CSSProperties
}

export const glyphBoxClassName = styles.box
