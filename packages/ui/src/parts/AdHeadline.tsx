import type { ReactNode } from 'react'
import { cx } from './cx'
import styles from './AdText.module.css'
import type { PartViewProps } from './types'

/**
 * 広告見出し（DESIGN.md §5 `ad_headline` / §8 anatomy）。
 *
 * 既定では `<p>`。見出しレベルは文書構造の話であって部位の話ではないので、
 * 宿主（Shell / LP）が `as` で決める（見出しの入れ子を部位が壊さないため）。
 */
export type AdHeadlineProps = PartViewProps & {
  readonly children: ReactNode
  readonly as?: 'p' | 'h2' | 'h3'
}

export function AdHeadline({
  children,
  as: Tag = 'p',
  emphasis = 1,
  visible = true,
  instanceId,
  className,
}: AdHeadlineProps) {
  if (!visible) return null

  return (
    <Tag
      className={cx(styles.headline, className)}
      data-target="body"
      data-instance={instanceId}
      data-emphasis={emphasis}
    >
      {children}
    </Tag>
  )
}
