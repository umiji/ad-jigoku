import { adCopy } from './copy'
import { glyphBoxClassName, glyphClassName, glyphStyle, type CloseGlyphLayout } from './closeGlyph'
import type { PartViewProps } from './types'

/**
 * 偽の閉じるボタン（TASK-013 implementation requirement 4 / SAFE-05）。
 *
 * **視覚的な紛らわしさは可。支援技術への嘘は不可。**
 * 見た目は本物の × と同じでよいが、`aria-label` は「これは広告のボタンで、閉じない」と説明する。
 * 押しても外部遷移もダウンロードもしない。`onActivate` を呼ぶだけ（判定はエンジン）。
 *
 * `variant="decoy"` は「囮」部位（`data-target="decoy"`）として宿主にマップされる。
 */
export type FakeCloseButtonProps = PartViewProps &
  CloseGlyphLayout & {
    readonly variant?: 'fake-close' | 'decoy'
    readonly onActivate?: () => void
  }

export function FakeCloseButton({
  variant = 'fake-close',
  onActivate,
  visible = true,
  enabled = true,
  emphasis = 1,
  visualScale,
  hitboxScale,
  anchor,
  placement,
  instanceId,
  className,
}: FakeCloseButtonProps) {
  if (!visible) return null

  const layout: CloseGlyphLayout = {
    ...(visualScale === undefined ? {} : { visualScale }),
    ...(hitboxScale === undefined ? {} : { hitboxScale }),
    ...(anchor ? { anchor } : {}),
    ...(placement === undefined ? {} : { placement }),
    emphasis,
    enabled,
  }

  return (
    <button
      type="button"
      className={glyphClassName(layout, className)}
      style={glyphStyle(layout)}
      aria-label={variant === 'decoy' ? adCopy.fakeClose.decoyAriaLabel : adCopy.fakeClose.ariaLabel}
      aria-disabled={enabled ? undefined : true}
      data-target={variant}
      data-instance={instanceId}
      data-emphasis={emphasis}
      data-enabled={enabled}
      onClick={onActivate}
    >
      <span className={glyphBoxClassName} aria-hidden="true">
        ×
      </span>
    </button>
  )
}
