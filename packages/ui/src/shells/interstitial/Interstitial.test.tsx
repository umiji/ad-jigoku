/**
 * interstitial — 本文を覆う全画面の割り込み（DESIGN.md §9 Fullscreen / interruption）。
 * 暗い面に置くのは、全画面が紙色だと画面全体が明滅して眩しいため（DESIGN.md §20 / §14 avoid）。
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Interstitial } from './Interstitial'
import { interstitialDescriptor } from './descriptor'
import { FIXTURE_CREATIVE_DARK, partState, shellProps } from '../fixtures'

describe('interstitial', () => {
  it('見出し / 短文 / CTA / 極小注意書き / × を描く', () => {
    render(<Interstitial {...shellProps({ surface: 'fullscreen', sizeHint: 'fullscreen' })} />)
    expect(screen.getByText('本日限り 全品半額')).toBeInTheDocument()
    expect(screen.getByText('在庫がなくなり次第、静かに終了します')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '今すぐ見る' })).toBeInTheDocument()
    expect(screen.getByText('※一部対象外の商品があります')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '広告を閉じる' })).toBeInTheDocument()
  })

  it('全画面は必ず暗い面で描く（紙色のクリエイティブでも popupDark 側に倒す）', () => {
    const { container } = render(<Interstitial {...shellProps()} />)
    expect(container.firstElementChild).toHaveAttribute('data-ad-theme', 'popupDark')
  })

  it('もともと暗いクリエイティブはそのまま', () => {
    const { container } = render(<Interstitial {...shellProps({ creative: FIXTURE_CREATIVE_DARK })} />)
    expect(container.firstElementChild).toHaveAttribute('data-ad-theme', 'popupDark')
  })

  it('操作先はすべて data-target を持つ', () => {
    const { container } = render(<Interstitial {...shellProps()} />)
    const targets = new Set(
      [...container.querySelectorAll('[data-target]')].map((el) => el.getAttribute('data-target')),
    )
    for (const expected of ['label', 'body', 'media', 'cta', 'close']) expect(targets).toContain(expected)
    // 宣言していない部位の intent を生やさない（descriptor が engine との契約）
    for (const target of targets) expect(interstitialDescriptor.parts).toContain(target)
  })

  it('カウントダウン中でも × はフォーカスでき、押せる（DESIGN §20 MUST）', () => {
    render(
      <Interstitial
        {...shellProps({ parts: [partState('close', { enabled: false })], countdown: { remainingMs: 2700 } })}
      />,
    )
    const close = screen.getByRole('button', { name: '広告を閉じる' })
    expect(close).not.toBeDisabled()
    expect(screen.getByText('あと3秒')).toBeInTheDocument()
  })

  it('外部遷移もダウンロードも音声も持たない（SAFE-05 / DESIGN §20 NEVER）', () => {
    const { container } = render(<Interstitial {...shellProps()} />)
    expect(container.querySelector('a, [href], [download], audio, video, [autoplay]')).toBeNull()
  })

  it('descriptor は engine の宣言と同じ', () => {
    expect(interstitialDescriptor.parts).toEqual(['label', 'body', 'media', 'cta', 'legal', 'close'])
    expect(interstitialDescriptor.supports).toEqual(['spawn', 'surface'])
  })
})
