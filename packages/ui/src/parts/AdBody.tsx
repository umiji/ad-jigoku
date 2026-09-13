import type { ReactNode } from 'react'
import { cx } from './cx'
import styles from './AdText.module.css'
import type { PartViewProps } from './types'

/**
 * 広告の短いコピー（DESIGN.md §5 `body` / §8 anatomy）。長文を置かない（DESIGN_REQ §3.3）。
 */
export type AdBodyProps = PartViewProps & {
  readonly children: ReactNode
}

export function AdBody({ children, emphasis = 1, visible = true, instanceId, className }: AdBodyProps) {
  if (!visible) return null

  return (
    <p
      className={cx(styles.body, className)}
      data-target="body"
      data-instance={instanceId}
      data-emphasis={emphasis}
    >
      {children}
    </p>
  )
}
