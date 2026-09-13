/**
 * AdCountdown（DESIGN_REQUIREMENTS §5.3 Pattern B / GAME §15.4「必ず見せる」/ DESIGN.md §13）。
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AdCountdown } from './AdCountdown'
import { adCopy } from './copy'

describe('AdCountdown', () => {
  it('既定は日本語表記（DESIGN.md §13「あと3秒」）', () => {
    render(<AdCountdown remainingMs={3000} />)
    expect(screen.getByText('あと3秒')).toBeInTheDocument()
  })

  it('端数は切り上げる（700ms は「あと1秒」）', () => {
    render(<AdCountdown remainingMs={700} />)
    expect(screen.getByText('あと1秒')).toBeInTheDocument()
  })

  it('format="sec" は DESIGN_REQ §5.3 B の「閉じるまで 2.7 sec」表記', () => {
    render(<AdCountdown remainingMs={2700} format="sec" />)
    expect(screen.getByText('閉じるまで 2.7 sec')).toBeInTheDocument()
  })

  it('0 になったら閉じられることを伝える', () => {
    render(<AdCountdown remainingMs={0} />)
    expect(screen.getByText(adCopy.countdown.ready)).toBeInTheDocument()
  })

  it('負の値でも 0 として扱う（表示が壊れない）', () => {
    render(<AdCountdown remainingMs={-500} />)
    expect(screen.getByText(adCopy.countdown.ready)).toBeInTheDocument()
  })

  it('支援技術に読み上げられる（aria-live="polite"）', () => {
    render(<AdCountdown remainingMs={3000} />)
    expect(screen.getByText('あと3秒')).toHaveAttribute('aria-live', 'polite')
  })

  it('渡されたら必ず見える（GAME §15.4: 隠す props を持たない）', () => {
    render(<AdCountdown remainingMs={1200} />)
    const countdown = screen.getByText('あと2秒')
    expect(countdown).toBeVisible()
    expect(countdown).toHaveAttribute('data-remaining-ms', '1200')
  })
})
