import styles from './content.module.css'
import type { ArticleQuestion } from './articles/types'

/**
 * 記事内の設問（OD-5 / TASK-015 要件 3）。本文を実際に読んでいないと答えられない内容。
 * 選択式。誤答は progress を戻さないが patience を削る（エンジン側）。
 * 選択肢の近くに偽 CTA（DEC-04 Fake Next 等）を置けるよう、`children` スロットを持つ。
 */
export function QuestionPrompt({
  question,
  answered,
  lastChoice,
  disabled = false,
  onAnswer,
  children,
}: {
  question: ArticleQuestion
  answered: boolean
  /** 直前に選んだ選択肢（誤答表示用） */
  lastChoice?: number | undefined
  disabled?: boolean
  onAnswer?: (questionId: string, choice: number) => void
  children?: React.ReactNode
}) {
  return (
    <aside className={styles.question} data-target="content" data-content-id={`question:${question.id}`} data-testid={`question-${question.id}`} aria-labelledby={`q-${question.id}`}>
      <div className={styles.questionLabel}>読者への設問</div>
      <p className={styles.questionPrompt} id={`q-${question.id}`}>
        {question.prompt}
      </p>
      <div className={styles.choices} role="group" aria-label="選択肢">
        {question.choices.map((choice, i) => {
          const state = answered && i === question.correctChoice ? 'correct' : !answered && lastChoice === i ? 'wrong' : 'idle'
          return (
            <button
              key={i}
              type="button"
              className={styles.choice}
              data-state={state}
              data-question={question.id}
              data-choice={i}
              disabled={answered || disabled}
              onClick={() => onAnswer?.(question.id, i)}
            >
              {choice}
            </button>
          )
        })}
      </div>
      {answered && <div className={styles.questionDone}>正解。読み進めてください。</div>}
      {children}
    </aside>
  )
}
