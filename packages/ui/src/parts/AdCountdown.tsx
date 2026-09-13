import { adCopy, fillCopy } from './copy'
import { cx } from './cx'
import styles from './AdCountdown.module.css'
import type { PartViewProps } from './types'

/**
 * 「あと3秒」（DESIGN.md §13 / DESIGN_REQUIREMENTS §5.3 Pattern B）。
 *
 * **渡されたら必ず見える**（GAME §15.4「残り時間は必ず見せる」）。
 * 隠すための props を持たないのはそのため（`visible` は `ViewState.parts` の互換用で既定 true）。
 *
 * 時間を数えるのはこの部位ではない。残りミリ秒を受け取って描くだけ（requirement 1）。
 */
export type AdCountdownProps = PartViewProps & {
  readonly remainingMs: number
  /** `ja` = 「あと3秒」 / `sec` = 「閉じるまで 2.7 sec」（DESIGN_REQ §5.3 B） */
  readonly format?: 'ja' | 'sec'
}

function countdownText(remainingMs: number, format: 'ja' | 'sec'): string {
  if (remainingMs <= 0) return adCopy.countdown.ready
  if (format === 'sec') {
    return fillCopy(adCopy.countdown.remainingSec, { seconds: (remainingMs / 1000).toFixed(1) })
  }
  return fillCopy(adCopy.countdown.remainingJa, { seconds: Math.ceil(remainingMs / 1000) })
}

export function AdCountdown({
  remainingMs,
  format = 'ja',
  visible = true,
  emphasis = 1,
  instanceId,
  className,
}: AdCountdownProps) {
  if (!visible) return null

  const remaining = Number.isFinite(remainingMs) ? Math.max(0, remainingMs) : 0
  const isReady = remaining <= 0

  return (
    <p
      className={cx(styles.countdown, isReady && styles.ready, className)}
      // 残り時間が変わったことは読み上げる。ただし操作を奪わない polite で
      aria-live="polite"
      data-instance={instanceId}
      data-emphasis={emphasis}
      data-remaining-ms={Math.round(remaining)}
    >
      <span className={styles.tick} aria-hidden="true" />
      {countdownText(remaining, format)}
    </p>
  )
}
