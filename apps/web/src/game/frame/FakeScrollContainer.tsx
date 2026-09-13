import { useRef, type ReactNode, type UIEvent } from 'react'
import styles from './frame.module.css'

/**
 * 偽スクロールコンテナ（TASK-014A 要件 4 / ADR-010）。
 * 独自の overflow コンテナで、実ページの `window.scroll` には影響しない（`overscroll-behavior: contain`）。
 * スクロール量は論理行（deltaLines）に正規化して宿主へ渡す。ピクセルは外に出さない。
 */
export const FAKE_SCROLL_PX_PER_LINE = 24

export function FakeScrollContainer({ children, onScrollLines, scrollRef }: { children: ReactNode; onScrollLines?: (deltaLines: number) => void; scrollRef?: (el: HTMLDivElement | null) => void }) {
  const lastTop = useRef(0)
  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const top = e.currentTarget.scrollTop
    const delta = Math.trunc((top - lastTop.current) / FAKE_SCROLL_PX_PER_LINE)
    if (delta !== 0) {
      lastTop.current += delta * FAKE_SCROLL_PX_PER_LINE
      onScrollLines?.(delta)
    }
  }
  return (
    <div className={styles.scroll} data-testid="fake-scroll" data-target="content" data-content-id="scroll" onScroll={handleScroll} ref={scrollRef}>
      <div className={styles.scrollInner}>{children}</div>
    </div>
  )
}
