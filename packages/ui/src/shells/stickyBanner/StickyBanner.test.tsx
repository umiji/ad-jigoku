/**
 * stickyBanner — 画面下に貼り付く帯（DESIGN.md §9 Sticky Ad）。
 * 帯なので media / legal は持たない（engine の parts 宣言と同じ）。
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StickyBanner } from './StickyBanner'
import { stickyBannerDescriptor } from './descriptor'
import { partState, shellProps } from '../fixtures'

const STICKY = { surface: 'sticky-bottom', sizeHint: 'small' } as const

describe('stickyBanner', () => {
  it('ラベル / 見出し / CTA / × を描く', () => {
    render(<StickyBanner {...shellProps(STICKY)} />)
    expect(screen.getByText('PR')).toBeInTheDocument()
    expect(screen.getByText('本日限り 全品半額')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '今すぐ見る' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '広告を閉じる' })).toBeInTheDocument()
  })

  it('宣言していない部位（media / legal）は描かない', () => {
    const { container } = render(<StickyBanner {...shellProps(STICKY)} />)
    expect(container.querySelector('[data-target="media"]')).toBeNull()
    expect(screen.queryByText('※一部対象外の商品があります')).toBeNull()
  })

  it('body 部位が非表示なら補足コピーを落とす（見出しは広告そのものなので残る）', () => {
    render(<StickyBanner {...shellProps({ ...STICKY, parts: [partState('body', { visible: false })] })} />)
    expect(screen.queryByText('在庫がなくなり次第、静かに終了します')).toBeNull()
    expect(screen.getByText('本日限り 全品半額')).toBeInTheDocument()
  })

  it('操作先はすべて data-target を持つ', () => {
    const { container } = render(<StickyBanner {...shellProps(STICKY)} />)
    const targets = new Set(
      [...container.querySelectorAll('[data-target]')].map((el) => el.getAttribute('data-target')),
    )
    for (const expected of ['label', 'body', 'cta', 'close']) expect(targets).toContain(expected)
    // 宣言していない部位の intent を生やさない（descriptor が engine との契約）
    for (const target of targets) expect(stickyBannerDescriptor.parts).toContain(target)
  })

  it('× は CloseButton（44×44 を保証する部位）で描く', () => {
    render(<StickyBanner {...shellProps({ ...STICKY, parts: [partState('close', { hitboxScale: 0.2 })] })} />)
    expect(
      screen.getByRole('button', { name: '広告を閉じる' }).style.getPropertyValue('--close-hitbox-scale'),
    ).toBe('1')
  })

  it('外部遷移もダウンロードも音声も持たない（SAFE-05 / DESIGN §20 NEVER）', () => {
    const { container } = render(<StickyBanner {...shellProps(STICKY)} />)
    expect(container.querySelector('a, [href], [download], audio, video, [autoplay]')).toBeNull()
  })

  it('descriptor は engine の宣言と同じ', () => {
    expect(stickyBannerDescriptor.parts).toEqual(['label', 'body', 'cta', 'close'])
    expect(stickyBannerDescriptor.supports).toEqual(['spawn', 'persist'])
  })
})
