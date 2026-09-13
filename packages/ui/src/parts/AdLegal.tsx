import type { ReactNode } from 'react'
import { cx } from './cx'
import styles from './AdText.module.css'
import type { PartViewProps } from './types'

/**
 * 極小の注意書き（DESIGN.md §5 `ad_legal` / §8 anatomy / DESIGN_REQ §3.3）。
 *
 * 「広告っぽい小さな注意書き」は演出だが、書いてある内容は本当のことにする
 * （DESIGN_REQ §22 Trust: 本物の広告ではないことが明確）。
 */
export type AdLegalProps = PartViewProps & {
  readonly children: ReactNode
}

export function AdLegal({ children, emphasis = 1, visible = true, instanceId, className }: AdLegalProps) {
  if (!visible) return null

  return (
    <p
      className={cx(styles.legal, className)}
      data-target="body"
      data-instance={instanceId}
      data-emphasis={emphasis}
    >
      {children}
    </p>
  )
}
