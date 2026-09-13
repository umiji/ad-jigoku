/**
 * tokens.ts → CSS の生成が冪等であること（TASK-002 test requirements）。
 * 併せて、コミットされている生成物が今の tokens.ts と一致することを検証する
 * （= 生成物の手編集を検出する。CI の `tokens:check` と同じ不変条件）。
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { GENERATED_CSS_OUTPUTS } from '../tokens/build-css'
import { colors } from '../tokens/colors'
import { zIndex } from '../tokens/zIndex'

describe('CSS 生成は冪等', () => {
  it.each(GENERATED_CSS_OUTPUTS.map((o) => [o.relativePath, o] as const))(
    '%s は何度生成しても同じ文字列になる',
    (_name, output) => {
      expect(output.build()).toBe(output.build())
    },
  )

  it.each(GENERATED_CSS_OUTPUTS.map((o) => [o.relativePath, o] as const))(
    '%s はコミットされている生成物と一致する（手編集の検出）',
    (_name, output) => {
      expect(readFileSync(output.absolutePath, 'utf8')).toBe(output.build())
    },
  )

  it.each(GENERATED_CSS_OUTPUTS.map((o) => [o.relativePath, o] as const))(
    '%s は LF 改行 + 末尾改行で終わる',
    (_name, output) => {
      const css = output.build()
      expect(css).not.toMatch(/\r/)
      expect(css.endsWith('\n')).toBe(true)
      expect(css.endsWith('\n\n')).toBe(false)
    },
  )

  it.each(GENERATED_CSS_OUTPUTS.map((o) => [o.relativePath, o] as const))(
    '%s は生成物であることを先頭に明記している',
    (_name, output) => {
      expect(output.build().startsWith('/*')).toBe(true)
      expect(output.build()).toMatch(/自動生成/)
    },
  )
})

describe('DESIGN.md の値がそのまま CSS に出ている', () => {
  it('色は DESIGN.md §4 の値をそのまま持つ', () => {
    const css = GENERATED_CSS_OUTPUTS[0]?.build() ?? ''
    expect(css).toContain(`--color-bg-primary: ${colors.bg.primary};`)
    expect(css).toContain(`--color-surface-popup-dark: ${colors.surface.popupDark};`)
    expect(css).toContain(`--color-accent-danger: ${colors.accent.danger};`)
  })

  it('z-index は DESIGN.md §15 の値をそのまま持つ（9999 のような値は存在しない）', () => {
    const css = GENERATED_CSS_OUTPUTS[0]?.build() ?? ''
    expect(css).toContain(`--z-popup: ${zIndex.popup};`)
    expect(css).not.toContain('9999')
  })
})
