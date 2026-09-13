/**
 * AdCTA（DESIGN.md §12 CTA System / §20 safety / SAFE-05）。
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AdCTA } from './AdCTA'

describe('AdCTA', () => {
  it('本物の <button type="button">。リンクではない（SAFE-05: 外部遷移しない）', () => {
    render(<AdCTA label="今すぐ無料で遊ぶ" />)
    const cta = screen.getByRole('button', { name: '今すぐ無料で遊ぶ' })
    expect(cta).toHaveAttribute('type', 'button')
    expect(cta.tagName).toBe('BUTTON')
    expect(cta).not.toHaveAttribute('href')
  })

  it('intent マッピング用に data-target="cta" と data-instance を持つ（TASK-014）', () => {
    render(<AdCTA label="受け取る" instanceId="ad-3" />)
    const cta = screen.getByRole('button', { name: '受け取る' })
    expect(cta).toHaveAttribute('data-target', 'cta')
    expect(cta).toHaveAttribute('data-instance', 'ad-3')
  })

  it('押すと onActivate が呼ばれる', async () => {
    const onActivate = vi.fn()
    render(<AdCTA label="受け取る" onActivate={onActivate} />)
    await userEvent.click(screen.getByRole('button', { name: '受け取る' }))
    expect(onActivate).toHaveBeenCalledTimes(1)
  })

  it('enabled=false でも押せて onActivate は呼ばれる（判定はエンジンがする）', async () => {
    const onActivate = vi.fn()
    render(<AdCTA label="受け取る" enabled={false} onActivate={onActivate} />)
    const cta = screen.getByRole('button', { name: '受け取る' })
    expect(cta).toHaveAttribute('aria-disabled', 'true')
    // disabled 属性は使わない。フォーカスを奪うと支援技術から存在が消えるため
    expect(cta).not.toBeDisabled()
    await userEvent.click(cta)
    expect(onActivate).toHaveBeenCalledTimes(1)
  })

  it('variant / emphasis を data 属性として出す', () => {
    render(<AdCTA label="診断する" variant="secondary" emphasis={0} />)
    const cta = screen.getByRole('button', { name: '診断する' })
    expect(cta).toHaveAttribute('data-variant', 'secondary')
    expect(cta).toHaveAttribute('data-emphasis', '0')
  })

  it('キーボードだけで発火できる', async () => {
    const onActivate = vi.fn()
    render(<AdCTA label="受け取る" onActivate={onActivate} />)
    await userEvent.tab()
    expect(screen.getByRole('button', { name: '受け取る' })).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard(' ')
    expect(onActivate).toHaveBeenCalledTimes(2)
  })

  it('visible=false のときは何も描かない', () => {
    const { container } = render(<AdCTA label="受け取る" visible={false} />)
    expect(container).toBeEmptyDOMElement()
  })
})
