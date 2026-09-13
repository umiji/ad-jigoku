import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BrowserFrame } from './BrowserFrame'
import { FAKE_HOST, fakeUrl, hasCapability, looksLikeRealDomain } from './frameCapabilities'

describe('BrowserFrame (TASK-014A / SAFE-12)', () => {
  it('renders the fake chrome, never touches real history, and shows the first-visit notice', () => {
    const pushSpy = vi.spyOn(window.history, 'pushState')
    const replaceSpy = vi.spyOn(window.history, 'replaceState')
    const backSpy = vi.spyOn(window.history, 'back')
    const onFakeNavigate = vi.fn()
    render(
      <BrowserFrame device="desktop" path="article/1" onFakeNavigate={onFakeNavigate} forceNotice>
        <p>本文</p>
      </BrowserFrame>,
    )
    expect(screen.getByTestId('browser-frame')).toBeTruthy()
    expect(screen.getByTestId('frame-notice').textContent).toContain('これはゲーム内の偽ブラウザです')
    const lengthBefore = window.history.length
    fireEvent.click(screen.getByRole('button', { name: /偽の戻る/ }))
    expect(onFakeNavigate).toHaveBeenCalledWith('back')
    expect(pushSpy).not.toHaveBeenCalled()
    expect(replaceSpy).not.toHaveBeenCalled()
    expect(backSpy).not.toHaveBeenCalled()
    expect(window.history.length).toBe(lengthBefore)
    fireEvent.click(screen.getByRole('button', { name: 'この案内を閉じる' }))
    expect(screen.queryByTestId('frame-notice')).toBeNull()
    vi.restoreAllMocks()
  })

  it('fake URL never shows a real domain or a real scheme', () => {
    render(
      <BrowserFrame device="mobile" path="/article/2/section-3">
        <p />
      </BrowserFrame>,
    )
    const url = screen.getByTestId('fake-url').textContent ?? ''
    expect(url).toContain(FAKE_HOST)
    expect(url.startsWith('hell://')).toBe(true)
    expect(looksLikeRealDomain(url)).toBe(false)
    expect(looksLikeRealDomain('https://example.com/x')).toBe(true)
    expect(looksLikeRealDomain('google.co.jp')).toBe(true)
    expect(fakeUrl('/a/b')).toBe(`hell://${FAKE_HOST}/a/b`)
  })

  it('mobile has no tabs (minimized bar); desktop has tabs', () => {
    expect(hasCapability('mobile', 'tabs')).toBe(false)
    expect(hasCapability('desktop', 'tabs')).toBe(true)
    expect(hasCapability('mobile', 'back')).toBe(true)
  })

  it('fake scroll container reports logical lines and does not scroll the window', () => {
    const onScrollLines = vi.fn()
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    render(
      <BrowserFrame device="mobile" path="x" onScrollLines={onScrollLines}>
        <div style={{ height: 3000 }} />
      </BrowserFrame>,
    )
    const scroller = screen.getByTestId('fake-scroll')
    Object.defineProperty(scroller, 'scrollTop', { value: 120, configurable: true })
    fireEvent.scroll(scroller)
    expect(onScrollLines).toHaveBeenCalledWith(5)
    expect(scrollTo).not.toHaveBeenCalled()
    expect(window.scrollY).toBe(0)
    vi.restoreAllMocks()
  })
})
