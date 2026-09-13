/**
 * popup — DESIGN.md §8 の canonical anatomy をそのまま持つシェル。
 *
 * ここで見るのは「props をそのまま描いているか」だけ。
 * 44×44 の実測とコントラストは Playwright 側（apps/web/e2e/shells.spec.ts）の担当。
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Popup } from './Popup'
import { popupDescriptor } from './descriptor'
import { partState, shellProps } from '../fixtures'

describe('popup', () => {
  it('DESIGN §8 の anatomy（PR / 見出し / 短文 / CTA / 極小注意書き / ×）を描く', () => {
    render(<Popup {...shellProps()} />)
    expect(screen.getByText('PR')).toBeInTheDocument()
    expect(screen.getByText('本日限り 全品半額')).toBeInTheDocument()
    expect(screen.getByText('在庫がなくなり次第、静かに終了します')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '今すぐ見る' })).toBeInTheDocument()
    expect(screen.getByText('※一部対象外の商品があります')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '広告を閉じる' })).toBeInTheDocument()
  })

  it('宿主が intent に変換できるよう、操作先はすべて data-target を持つ', () => {
    const { container } = render(<Popup {...shellProps()} />)
    const targets = new Set(
      [...container.querySelectorAll('[data-target]')].map((el) => el.getAttribute('data-target')),
    )
    for (const expected of ['label', 'body', 'media', 'cta', 'close']) expect(targets).toContain(expected)
    // 宣言していない部位の intent を生やさない（descriptor が engine との契約）
    for (const target of targets) expect(popupDescriptor.parts).toContain(target)
  })

  it('data-instance を持つのはスロット（宿主）と部位。シェルの箱は足さない', () => {
    const { container } = render(<Popup {...shellProps()} />)
    expect(container.firstElementChild).not.toHaveAttribute('data-instance')
    expect(screen.getByRole('button', { name: '広告を閉じる' })).toHaveAttribute('data-instance', 'ad-1')
  })

  it('close.enabled=false でも押せる。カウントダウンは必ず見える（GAME §15.4）', () => {
    render(
      <Popup
        {...shellProps({
          parts: [partState('close', { enabled: false })],
          countdown: { remainingMs: 2700 },
        })}
      />,
    )
    const close = screen.getByRole('button', { name: '広告を閉じる' })
    expect(close).toHaveAttribute('aria-disabled', 'true')
    expect(close).not.toBeDisabled()
    expect(screen.getByText('あと3秒')).toBeInTheDocument()
  })

  it('当たり判定は CloseButton（44×44 を CSS で保証する部位）に委ねる。1 未満の倍率は丸められる', () => {
    render(<Popup {...shellProps({ parts: [partState('close', { hitboxScale: 0.4 })] })} />)
    const close = screen.getByRole('button', { name: '広告を閉じる' })
    expect(close.style.getPropertyValue('--close-hitbox-scale')).toBe('1')
  })

  it('close の anchor は CSS 変数で渡る（moving close）', () => {
    render(<Popup {...shellProps({ parts: [partState('close', { anchor: { xPercent: 20, yPercent: 80 } })] })} />)
    const close = screen.getByRole('button', { name: '広告を閉じる' })
    expect(close.style.getPropertyValue('--close-x')).toBe('20%')
    expect(close.style.getPropertyValue('--close-y')).toBe('80%')
  })

  it('close.visible=false なら × を描かない（挙動判断はしない。props のとおり）', () => {
    render(<Popup {...shellProps({ parts: [partState('close', { visible: false })] })} />)
    expect(screen.queryByRole('button', { name: '広告を閉じる' })).toBeNull()
  })

  it('badge は渡された文字列をそのまま描く', () => {
    render(<Popup {...shellProps({ badge: '🔊 音声が再生されています' })} />)
    expect(screen.getByText('🔊 音声が再生されています')).toBeInTheDocument()
  })

  it('外部遷移もダウンロードも音声も持たない（SAFE-05 / DESIGN §20 NEVER）', () => {
    const { container } = render(<Popup {...shellProps()} />)
    expect(container.querySelector('a, [href], [download], audio, video, [autoplay]')).toBeNull()
  })

  it('生の色を書かない（DESIGN §4。テーマはトークンの選択）', () => {
    const { container } = render(<Popup {...shellProps()} />)
    expect(container.innerHTML).not.toMatch(/#[0-9a-f]{3,8}\b/i)
    expect(container.innerHTML).not.toMatch(/rgba?\(/i)
  })

  it('descriptor は engine の宣言と同じ（parts / supports）', () => {
    expect(popupDescriptor.parts).toEqual(['label', 'body', 'media', 'cta', 'legal', 'close'])
    expect(popupDescriptor.supports).toEqual(['spawn', 'close', 'deception', 'hitbox'])
  })
})
