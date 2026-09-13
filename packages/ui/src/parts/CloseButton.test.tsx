/**
 * CloseButton — 本物の閉じるボタン
 * （DESIGN.md §19 44×44 / §20 accessible close labels / DESIGN_REQ §5.3 Pattern B, C）。
 *
 * 当たり判定の「実測」は Playwright 側（apps/web/e2e/parts.spec.ts）。
 * ここでは「44px を決めるトークンが実際に使われているか」を検証する。
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CloseButton } from './CloseButton'
import { adCopy } from './copy'

describe('CloseButton', () => {
  it('閉じる操作であることを支援技術に正しく伝える', () => {
    render(<CloseButton />)
    expect(screen.getByRole('button', { name: adCopy.close.ariaLabel })).toBeInTheDocument()
    expect(adCopy.close.ariaLabel).toContain('閉じる')
  })

  it('本物の <button type="button">。リンクではない（SAFE-05）', () => {
    render(<CloseButton />)
    const close = screen.getByRole('button', { name: adCopy.close.ariaLabel })
    expect(close).toHaveAttribute('type', 'button')
    expect(close).not.toHaveAttribute('href')
  })

  it('intent マッピング用に data-target="close" と data-instance を持つ（TASK-014）', () => {
    render(<CloseButton instanceId="ad-9" />)
    const close = screen.getByRole('button', { name: adCopy.close.ariaLabel })
    expect(close).toHaveAttribute('data-target', 'close')
    expect(close).toHaveAttribute('data-instance', 'ad-9')
  })

  it('押すと onActivate が呼ばれる', async () => {
    const onActivate = vi.fn()
    render(<CloseButton onActivate={onActivate} />)
    await userEvent.click(screen.getByRole('button', { name: adCopy.close.ariaLabel }))
    expect(onActivate).toHaveBeenCalledTimes(1)
  })

  it('enabled=false でもフォーカスでき、押せて、onActivate が呼ばれる（早すぎたかはエンジンが判定する）', async () => {
    const onActivate = vi.fn()
    render(<CloseButton enabled={false} onActivate={onActivate} />)
    const close = screen.getByRole('button', { name: adCopy.close.ariaLabel })
    expect(close).toHaveAttribute('aria-disabled', 'true')
    expect(close).not.toBeDisabled()
    await userEvent.tab()
    expect(close).toHaveFocus()
    await userEvent.click(close)
    expect(onActivate).toHaveBeenCalledTimes(1)
  })

  it('見た目の縮小は CSS 変数で渡す。当たり判定は別変数で、見た目とは連動しない', () => {
    render(<CloseButton visualScale={0.5} />)
    const close = screen.getByRole('button', { name: adCopy.close.ariaLabel })
    expect(close.style.getPropertyValue('--close-visual-scale')).toBe('0.5')
    expect(close.style.getPropertyValue('--close-hitbox-scale')).toBe('1')
  })

  it('visualScale は 0.5〜1 に丸める（見えない × を作らない）', () => {
    render(<CloseButton visualScale={0.1} />)
    expect(
      screen.getByRole('button', { name: adCopy.close.ariaLabel }).style.getPropertyValue('--close-visual-scale'),
    ).toBe('0.5')
  })

  it('hitboxScale が 1 未満でも当たり判定は縮まない（CSS 側で max() する前提の値を渡す）', () => {
    render(<CloseButton hitboxScale={0.4} />)
    expect(
      screen.getByRole('button', { name: adCopy.close.ariaLabel }).style.getPropertyValue('--close-hitbox-scale'),
    ).toBe('1')
  })

  it('anchor を渡すと位置を CSS 変数（%）で受け渡す（moving close 用）', () => {
    render(<CloseButton anchor={{ xPercent: 30, yPercent: 70 }} />)
    const close = screen.getByRole('button', { name: adCopy.close.ariaLabel })
    expect(close.style.getPropertyValue('--close-x')).toBe('30%')
    expect(close.style.getPropertyValue('--close-y')).toBe('70%')
  })

  it('visible=false のときは何も描かない', () => {
    const { container } = render(<CloseButton visible={false} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('× のグリフは支援技術から隠す（ラベルは aria-label が持つ）', () => {
    render(<CloseButton />)
    const glyph = screen.getByRole('button', { name: adCopy.close.ariaLabel }).querySelector('[aria-hidden="true"]')
    expect(glyph).not.toBeNull()
  })
})
