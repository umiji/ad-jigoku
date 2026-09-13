import type { PlayerAction } from '@ad-jigoku/pattern-catalog'
import styles from './hud.module.css'

/**
 * 対抗アクションバー（OD-6 / TASK-016 要件 3）。画面下の thumb-zone に固定。
 * - 使えないアクションはグレーアウト（GAME §6「全てのアクションが全てのパターンに効くわけではない」を学習させる）
 * - デスクトップは数字キー 1-5 のショートカット
 * - `data-action` で Intent に変換される（intentFromEvent）
 * - sticky 広告と混同されないよう、広告の語彙（PR / CTA / ×）を一切使わない
 */
export const ACTIONS: readonly { action: PlayerAction; label: string; key: string; primary?: boolean }[] = [
  { action: 'SMASH', label: 'SMASH', key: '1', primary: true },
  { action: 'DODGE', label: 'DODGE', key: '2' },
  { action: 'FOCUS', label: 'FOCUS', key: '3' },
  { action: 'REPORT', label: 'REPORT', key: '4' },
  { action: 'ESCAPE', label: 'ESCAPE', key: '5' },
]

export function ActionBar({ available, onAction }: { available: ReadonlySet<PlayerAction>; onAction?: (action: PlayerAction) => void }) {
  return (
    <nav className={styles.actionBar} aria-label="対抗アクション（ゲームUI。広告ではありません）" data-testid="action-bar">
      {ACTIONS.map(({ action, label, key, primary }) => {
        const enabled = available.has(action)
        return (
          <button
            key={action}
            type="button"
            className={`${styles.action}${primary ? ` ${styles.actionPrimary}` : ''}`}
            data-action={action}
            disabled={!enabled}
            aria-keyshortcuts={key}
            aria-label={`${label}（キー ${key}）${enabled ? '' : '・いまは使えません'}`}
            onClick={() => enabled && onAction?.(action)}
          >
            <span>{label}</span>
            <span className={styles.actionKey} aria-hidden="true">
              {key}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
