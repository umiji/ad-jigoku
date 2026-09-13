import { useMemo, useState, type ReactNode } from 'react'
import { lineOffset, linesOf, type Article } from './articles/types'
import styles from './content.module.css'
import { QuestionPrompt } from './QuestionPrompt'
import { readParagraphs, useArticleVisibility } from './ReadingProgress'

/**
 * 偽記事コンテンツ面（TASK-015）。プレイヤーが「読みたいコンテンツ」。
 * - 架空の記事。実在メディアを模倣しない
 * - 各段落に `data-paragraph` を付け、IntersectionObserver で可視性を取る（読了は宿主が read intent で進める）
 * - スクリーンリーダーは広告が前面にあっても本文にアクセスできる（`<article>` は常に DOM にある）
 * - 設問は記事の途中と末尾
 */
export function ArticleSurface({
  article,
  readLines,
  answered,
  lastChoices,
  onAnswer,
  onVisibilityChange,
  inlineSlot,
}: {
  article: Article
  readLines: number
  answered: Record<string, boolean>
  lastChoices?: Record<string, number>
  onAnswer?: (questionId: string, choice: number) => void
  onVisibilityChange?: (isReading: boolean) => void
  /** 本文中に差し込む広告（inline surface）。段落 index → ノード */
  inlineSlot?: (paragraphIndex: number) => ReactNode
}) {
  const [root, setRoot] = useState<HTMLElement | null>(null)
  const { isReading } = useArticleVisibility(root)
  const [last, setLast] = useState(isReading)
  if (last !== isReading) {
    setLast(isReading)
    onVisibilityChange?.(isReading)
  }
  const offsets = useMemo(() => article.paragraphs.map((_, i) => lineOffset(article, i)), [article])
  const counts = useMemo(() => article.paragraphs.map(linesOf), [article])
  const done = readParagraphs(readLines, offsets, counts)

  return (
    <article ref={setRoot} className={styles.article} data-target="content" data-content-id="article" data-testid="article" aria-label={article.title}>
      <p className={styles.kicker}>
        <span className={styles.outlet}>{article.outlet}</span> · {article.kicker}
      </p>
      <h1 className={styles.title}>{article.title}</h1>
      <p className={styles.lede}>{article.lede}</p>
      <p className={styles.author}>{article.author}</p>
      {article.paragraphs.map((text, i) => (
        <div key={i}>
          <p className={styles.paragraph} data-paragraph={i} data-read={done.has(i) ? 'true' : 'false'}>
            {text}
          </p>
          {inlineSlot?.(i)}
          {article.questions
            .filter((q) => q.afterParagraph === i)
            .map((q) => (
              <QuestionPrompt key={q.id} question={q} answered={!!answered[q.id]} lastChoice={lastChoices?.[q.id]} {...(onAnswer ? { onAnswer } : {})} />
            ))}
        </div>
      ))}
      <p className={styles.end}>— 記事はここまで —</p>
    </article>
  )
}
