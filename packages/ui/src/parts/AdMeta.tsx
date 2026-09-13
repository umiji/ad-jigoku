import { adCopy } from './copy'
import { cx } from './cx'
import styles from './AdMeta.module.css'
import type { Emphasis, PartViewProps } from './types'

/**
 * `PR` / `Sponsored` の広告ラベル（DESIGN.md §8 anatomy / §13 microcopy）。
 *
 * 挙動は持たない。表示状態を props で受け取るだけ（TASK-013 implementation requirement 1）。
 * クリックは `label` 部位として宿主にマップされる（`data-target`）。
 */
export type AdMetaProps = PartViewProps & {
  /** 既定は `PR`。語彙は adCopy.label（DESIGN.md §13）から選ぶ */
  readonly label?: string
}

const EMPHASIS_CLASS: Record<Emphasis, string | undefined> = {
  0: styles.quiet,
  1: undefined,
  2: styles.loud,
}

export function AdMeta({
  label = adCopy.label.pr,
  emphasis = 1,
  visible = true,
  instanceId,
  className,
}: AdMetaProps) {
  if (!visible) return null

  return (
    <span
      className={cx(styles.meta, EMPHASIS_CLASS[emphasis], className)}
      data-target="label"
      data-instance={instanceId}
      data-emphasis={emphasis}
    >
      {label}
    </span>
  )
}
