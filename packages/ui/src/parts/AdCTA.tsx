import { cx } from './cx'
import styles from './AdCTA.module.css'
import type { Emphasis, PartViewProps } from './types'

/**
 * 広告の CTA（DESIGN.md §12 / §20 / SAFE-05）。
 *
 * - 必ず `<button type="button">`。`<a href>` にはしない。**外部遷移もダウンロードもしない**
 * - `enabled=false` でも `disabled` 属性は付けない（支援技術から消える + フォーカスを失うため）。
 *   `aria-disabled` にして、押されたら `onActivate` は呼ぶ。正誤の判定はエンジン側の責務
 * - 文言（`label`）は Creative データから来る。ここにハードコードしない（OD-9）
 */
export type AdCTAProps = PartViewProps & {
  readonly label: string
  readonly variant?: 'primary' | 'secondary'
  readonly enabled?: boolean
  readonly onActivate?: () => void
}

const EMPHASIS_CLASS: Record<Emphasis, string | undefined> = {
  0: styles.quiet,
  1: undefined,
  2: styles.loud,
}

export function AdCTA({
  label,
  variant = 'primary',
  enabled = true,
  emphasis = 1,
  visible = true,
  instanceId,
  onActivate,
  className,
}: AdCTAProps) {
  if (!visible) return null

  return (
    <button
      type="button"
      className={cx(
        styles.cta,
        variant === 'primary' ? styles.primary : styles.secondary,
        EMPHASIS_CLASS[emphasis],
        !enabled && styles.inert,
        className,
      )}
      data-target="cta"
      data-instance={instanceId}
      data-variant={variant}
      data-emphasis={emphasis}
      data-enabled={enabled}
      aria-disabled={enabled ? undefined : true}
      onClick={onActivate}
    >
      {label}
    </button>
  )
}
