import styles from './frame.module.css'

/**
 * 偽の戻る / 進むボタン（TASK-014A）。実ブラウザの history には一切触れない。
 * クリックは `data-target="chrome" data-chrome-id="back|forward"` として Intent に変換される（TASK-014 の intentFromEvent）。
 * ハイジャック系パターン（INT-06 等）はこのボタンに対してだけ作用する（post-MVP）。
 */
export function FakeBackButton({ direction, enabled = true, onNavigate }: { direction: 'back' | 'forward'; enabled?: boolean; onNavigate?: ((direction: 'back' | 'forward') => void) | undefined }) {
  const label = direction === 'back' ? '偽の戻る（ゲーム内。本物のブラウザ履歴は動きません）' : '偽の進む（ゲーム内）'
  return (
    <button
      type="button"
      className={styles.navButton}
      data-target="chrome"
      data-chrome-id={direction}
      aria-label={label}
      aria-disabled={enabled ? undefined : 'true'}
      onClick={(e) => {
        e.preventDefault()
        if (enabled) onNavigate?.(direction)
      }}
    >
      <span aria-hidden="true">{direction === 'back' ? '◀' : '▶'}</span>
    </button>
  )
}
