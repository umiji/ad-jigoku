/**
 * FakeCloseButton — 見た目は × だが閉じない
 * （TASK-013 implementation requirement 4 / DESIGN.md §20 / SAFE-05）。
 *
 * 「視覚的な紛らわしさは可。支援技術への嘘は不可」がこの部位の唯一の設計線。
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { adCopy } from './copy'
import { FakeCloseButton } from './FakeCloseButton'

describe('FakeCloseButton', () => {
  it('aria-label が「広告のボタンであって閉じるボタンではない」と説明する', () => {
    render(<FakeCloseButton />)
    const fake = screen.getByRole('button', { name: adCopy.fakeClose.ariaLabel })
    const label = fake.getAttribute('aria-label') ?? ''
    expect(label).toContain('広告')
    // 「閉じる」という語を含むなら、必ず否定形として含む（閉じると誤解させない）
    expect(label.includes('閉じる')).toBe(label.includes('閉じるボタンではありません'))
  })

  it('intent マッピング用に data-target="fake-close" を持つ', () => {
    render(<FakeCloseButton instanceId="ad-4" />)
    const fake = screen.getByRole('button', { name: adCopy.fakeClose.ariaLabel })
    expect(fake).toHaveAttribute('data-target', 'fake-close')
    expect(fake).toHaveAttribute('data-instance', 'ad-4')
  })

  it('variant="decoy" は data-target="decoy" と囮であることを説明する aria-label になる', () => {
    render(<FakeCloseButton variant="decoy" />)
    const decoy = screen.getByRole('button', { name: adCopy.fakeClose.decoyAriaLabel })
    expect(decoy).toHaveAttribute('data-target', 'decoy')
    expect(decoy.getAttribute('aria-label') ?? '').toContain('広告')
  })

  it('押しても遷移もダウンロードもしない。onActivate を呼ぶだけ（SAFE-05）', async () => {
    const onActivate = vi.fn()
    render(<FakeCloseButton onActivate={onActivate} />)
    const fake = screen.getByRole('button', { name: adCopy.fakeClose.ariaLabel })
    expect(fake).toHaveAttribute('type', 'button')
    expect(fake).not.toHaveAttribute('href')
    expect(fake).not.toHaveAttribute('download')
    await userEvent.click(fake)
    expect(onActivate).toHaveBeenCalledTimes(1)
  })

  it('キーボードだけで操作でき、× のグリフは支援技術から隠れている', async () => {
    render(<FakeCloseButton />)
    const fake = screen.getByRole('button', { name: adCopy.fakeClose.ariaLabel })
    await userEvent.tab()
    expect(fake).toHaveFocus()
    expect(fake.querySelector('[aria-hidden="true"]')).not.toBeNull()
  })

  it('visible=false のときは何も描かない', () => {
    const { container } = render(<FakeCloseButton visible={false} />)
    expect(container).toBeEmptyDOMElement()
  })
})
