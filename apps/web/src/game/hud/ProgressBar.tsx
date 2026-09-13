import styles from './hud.module.css'

/** 読了進捗（GAME §5.1 A）。read/total と設問の消化数 */
export function ProgressBar({ read, total, tasksDone, tasksTotal }: { read: number; total: number; tasksDone: number; tasksTotal: number }) {
  const ratio = total > 0 ? Math.max(0, Math.min(1, read / total)) : 0
  return (
    <div>
      <div className={styles.label}>
        読了 PROGRESS{tasksTotal > 0 ? ` · 設問 ${tasksDone}/${tasksTotal}` : ''}
      </div>
      <div className={styles.meter} role="progressbar" aria-label="読了" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(ratio * 100)} data-testid="progress-bar">
        <div className={styles.progressFill} style={{ transform: `scaleX(${ratio})` }} />
      </div>
    </div>
  )
}

export function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000)
  const mm = String(Math.floor(s / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return `${mm}:${ss}`
}
