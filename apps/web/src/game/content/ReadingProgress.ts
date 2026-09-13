import { useEffect, useRef, useState } from 'react'

/**
 * 読了判定（TASK-015 要件 2）。
 * 「現在 viewport に本文が見えている」を IntersectionObserver で観測し、宿主が毎 tick `{ t: 'read' }` を送るか決める。
 * **覆われ判定はエンジン側（blocksProgress）が持つ。UI は判定しない。**
 *
 * 戻り値: 本文の段落が 1 つ以上「十分に見えている」か。
 */
export const READ_VISIBILITY_THRESHOLD = 0.35

export function useArticleVisibility(root: HTMLElement | null, paragraphSelector = '[data-paragraph]'): { isReading: boolean; visibleParagraphs: ReadonlySet<number> } {
  const [visible, setVisible] = useState<ReadonlySet<number>>(() => new Set())
  const observerRef = useRef<IntersectionObserver | null>(null)
  useEffect(() => {
    if (!root || typeof IntersectionObserver === 'undefined') return
    const paragraphs = Array.from(root.querySelectorAll<HTMLElement>(paragraphSelector))
    const current = new Set<number>()
    const observer = new IntersectionObserver(
      (entries) => {
        let changed = false
        for (const e of entries) {
          const idx = Number((e.target as HTMLElement).dataset['paragraph'])
          if (Number.isNaN(idx)) continue
          const wasVisible = current.has(idx)
          const isVisible = e.isIntersecting && e.intersectionRatio >= READ_VISIBILITY_THRESHOLD
          if (isVisible && !wasVisible) {
            current.add(idx)
            changed = true
          } else if (!isVisible && wasVisible) {
            current.delete(idx)
            changed = true
          }
        }
        if (changed) setVisible(new Set(current))
      },
      { root: root.closest('[data-testid="fake-scroll"]') ?? null, threshold: [0, READ_VISIBILITY_THRESHOLD, 1] },
    )
    for (const p of paragraphs) observer.observe(p)
    observerRef.current = observer
    return () => observer.disconnect()
  }, [root, paragraphSelector])
  return { isReading: visible.size > 0, visibleParagraphs: visible }
}

/** progress.read（行）から「読み終えた段落」を求める（見た目の既読表示用） */
export function readParagraphs(read: number, lineOffsets: readonly number[], lineCounts: readonly number[]): Set<number> {
  const out = new Set<number>()
  lineOffsets.forEach((offset, i) => {
    if (read >= offset + (lineCounts[i] ?? 0)) out.add(i)
  })
  return out
}
