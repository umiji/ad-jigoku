/**
 * inlineRect — 本文中のレクタングル広告（DESIGN.md §9 Layout Shift / instability）。
 * `offset` は transform でしか動かさない。document flow を変えない（ADR-006）。
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { InlineRect } from './InlineRect'
import { inlineRectDescriptor } from './descriptor'
import { partState, shellProps } from '../fixtures'

const INLINE = { surface: 'inline' } as const

describe('inlineRect', () => {
  it('ラベル / ビジュアル / CTA を描く', () => {
    const { container } = render(<InlineRect {...shellProps(INLINE)} />)
    expect(screen.getByText('PR')).toBeInTheDocument()
    expect(container.querySelector('[data-target="media"]')).not.toBeNull()
    expect(screen.getByRole('button', { name: '今すぐ見る' })).toBeInTheDocument()
  })

  it('見出しはバナー画像の焼き込み文字と同じ扱い。media 面の中に描く（body 部位を宣言していないため）', () => {
    const { container } = render(<InlineRect {...shellProps(INLINE)} />)
    expect(container.querySelector('[data-target="media"]')?.textContent).toContain('本日限り 全品半額')
    expect(container.querySelector('[data-target="body"]')).toBeNull()
  })

  it('宣言していない部位（close）は描かない。この広告は閉じられない', () => {
    render(<InlineRect {...shellProps(INLINE)} />)
    expect(screen.queryByRole('button', { name: '広告を閉じる' })).toBeNull()
  })

  it('offset は transform（%）で渡す。位置指定プロパティは使わない（ADR-006）', () => {
    const { container } = render(<InlineRect {...shellProps({ ...INLINE, offset: { yPercent: -12 } })} />)
    const root = container.firstElementChild as HTMLElement
    expect(root.style.getPropertyValue('--ad-offset-y')).toBe('-12%')
    expect(root.style.top).toBe('')
    expect(root.style.marginTop).toBe('')
  })

  it('offset が無いときは変数を書かない', () => {
    const { container } = render(<InlineRect {...shellProps(INLINE)} />)
    expect((container.firstElementChild as HTMLElement).style.getPropertyValue('--ad-offset-y')).toBe('')
  })

  it('操作先はすべて data-target を持つ', () => {
    const { container } = render(<InlineRect {...shellProps(INLINE)} />)
    const targets = new Set(
      [...container.querySelectorAll('[data-target]')].map((el) => el.getAttribute('data-target')),
    )
    for (const expected of ['label', 'media', 'cta']) expect(targets).toContain(expected)
    // 宣言していない部位の intent を生やさない（descriptor が engine との契約）
    for (const target of targets) expect(inlineRectDescriptor.parts).toContain(target)
  })

  it('media 部位が非表示ならビジュアルを落とす', () => {
    const { container } = render(<InlineRect {...shellProps({ ...INLINE, parts: [partState('media', { visible: false })] })} />)
    expect(container.querySelector('[data-target="media"]')).toBeNull()
  })

  it('外部遷移もダウンロードも音声も持たない（SAFE-05 / DESIGN §20 NEVER）', () => {
    const { container } = render(<InlineRect {...shellProps(INLINE)} />)
    expect(container.querySelector('a, [href], [download], audio, video, [autoplay]')).toBeNull()
  })

  it('descriptor は engine の宣言と同じ', () => {
    expect(inlineRectDescriptor.parts).toEqual(['label', 'media', 'cta'])
    expect(inlineRectDescriptor.supports).toEqual(['spawn', 'instability'])
  })
})
