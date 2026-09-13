'use client'

import styles from './generic-shell.module.css'
import type { ShellProps } from './shellProps'

/**
 * フォールバック用の汎用シェル（TASK-014）。packages/ui/shells の本実装（TASK-013A/B）が未登録の shellId に対して
 * 「ゲームが動く」ことを保証するための最小描画。挙動判断はしない。
 * 本番では全 MVP シェルが登録されるので、これが見えたら未実装の印。
 */
function formatCountdown(ms: number): string {
  return `あと ${(ms / 1000).toFixed(1)} 秒`
}

export function GenericShell(p: ShellProps) {
  const part = (name: ShellProps['parts'][number]['part']) => p.parts.find((x) => x.part === name)
  const close = part('close')
  const cta = part('cta')
  return (
    <div className={styles.box} data-testid={`shell-${p.instanceId}`} data-generic-shell>
      <div className={styles.meta}>PR · {p.creative.brand}</div>
      <div className={styles.headline}>{p.creative.headline}</div>
      {p.creative.body && <p className={styles.body}>{p.creative.body}</p>}
      {p.countdown && p.countdown.remainingMs > 0 && (
        <div className={styles.countdown} aria-live="polite">
          {formatCountdown(p.countdown.remainingMs)}
        </div>
      )}
      {p.badge && <div className={styles.badge}>{p.badge}</div>}
      {cta?.visible && (
        <button type="button" className={styles.cta} data-target="cta" aria-label={`広告のボタン「${p.creative.cta}」（押すと誤クリック扱い）`}>
          {p.creative.cta}
        </button>
      )}
      {close?.visible && (
        <button type="button" className={styles.close} data-target="close" aria-label="広告を閉じる" aria-disabled={close.enabled ? undefined : 'true'}>
          ×
        </button>
      )}
    </div>
  )
}
