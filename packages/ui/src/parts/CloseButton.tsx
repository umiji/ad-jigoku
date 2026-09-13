import { adCopy } from './copy'
import { glyphBoxClassName, glyphClassName, glyphStyle, type CloseGlyphLayout } from './closeGlyph'
import type { PartViewProps } from './types'

/**
 * 本物の閉じるボタン（DESIGN.md §8 anatomy / §19 / §20 / DESIGN_REQ §5.3）。
 *
 * ここが product の信用線。
 * - 支援技術には必ず「広告を閉じる」と伝える（`adCopy.close.ariaLabel`）
 * - 見た目は `visualScale` でいくらでも小さくできるが、**当たり判定は常に 44×44 以上**
 *   （DESIGN.md §19 / DESIGN_REQ §5.3 Pattern C。ゲームとして不公平にしない）
 * - `enabled=false`（カウントダウン中）でもフォーカスでき、押せる。押されたことは宿主に伝わる。
 *   早すぎたかどうかを決めるのはエンジンであって部位ではない（requirement 1）
 */
export type CloseButtonProps = PartViewProps &
  CloseGlyphLayout & {
    readonly onActivate?: () => void
    /** 支援技術向けラベルの差し替え。既定（広告を閉じる）から嘘の方向へ変えない */
    readonly ariaLabel?: string
  }

export function CloseButton({
  onActivate,
  ariaLabel = adCopy.close.ariaLabel,
  visible = true,
  enabled = true,
  emphasis = 1,
  visualScale,
  hitboxScale,
  anchor,
  placement,
  instanceId,
  className,
}: CloseButtonProps) {
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
      aria-label={ariaLabel}
      aria-disabled={enabled ? undefined : true}
      data-target="close"
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
