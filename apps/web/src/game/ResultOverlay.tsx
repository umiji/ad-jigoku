'use client'

import { scoreBreakdown, type GameState } from '@ad-jigoku/game-engine'
import type { PatternDefinition } from '@ad-jigoku/pattern-catalog'
import styles from './host.module.css'

/**
 * 最小の結果表示（TASK-014 のトライアル用）。本実装（教育表示・EscapeCard・共有）は TASK-024。
 * Clear / Failed、スコア内訳、今回の主犯、再挑戦。
 */
export function ResultOverlay({ state, culprit, onRestart }: { state: GameState; culprit: PatternDefinition | undefined; onRestart: () => void }) {
  const cleared = state.phase === 'cleared'
  const b = scoreBreakdown(state.score)
  return (
    <div className={styles.result} role="dialog" aria-modal="true" aria-labelledby="result-title" data-testid="result-overlay" data-phase={state.phase}>
      <div className={styles.resultBox}>
        <p className={styles.resultMeta}>{cleared ? 'ESCAPED' : 'FAILED'}</p>
        <h2 className={styles.resultTitle} id="result-title">
          {cleared ? '読了。広告地獄を生き延びた。' : '読めなかった。'}
        </h2>
        <p className={styles.resultScore} data-testid="result-score">
          {state.score.total.toLocaleString('ja-JP')} <span className={styles.resultMeta}>pt</span>
        </p>
        <dl className={styles.resultRows}>
          {b.rows
            .filter((r) => r.value !== 0)
            .map((r) => (
              <div key={r.key} className={styles.resultRow}>
                <dt>{r.label.ja}</dt>
                <dd>
                  {r.sign}
                  {r.value.toLocaleString('ja-JP')}
                </dd>
              </div>
            ))}
        </dl>
        {culprit && (
          <div className={styles.culprit} data-testid="result-culprit">
            <p className={styles.resultMeta}>今回の主犯</p>
            <p className={styles.culpritName}>
              {culprit.name.ja} <span className={styles.resultMeta}>{culprit.id}</span>
            </p>
            {culprit.game?.education.ja && <p className={styles.culpritBody}>{culprit.game.education.ja}</p>}
          </div>
        )}
        <p className={styles.resultMeta}>
          {Math.round(state.elapsedMs / 1000)} 秒 · 忍耐 {Math.round(state.patience)} · ミス {Object.values(state.mistakes).reduce((a, b) => a + b, 0)} · 最長 {state.combo.bestChain} chain
        </p>
        <button type="button" className={styles.restart} onClick={onRestart} data-testid="result-restart" autoFocus>
          もう一回やる
        </button>
      </div>
    </div>
  )
}
