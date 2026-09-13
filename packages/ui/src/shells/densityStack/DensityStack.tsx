import { AdBody, AdCountdown, AdCTA, AdHeadline, AdMeta, CloseButton, resolvePartState } from '../../parts/index'
import { adThemeClass } from '../../parts/adTheme'
import { cx } from '../../parts/cx'
import styles from './densityStack.module.css'
import type { ShellProps } from '../types'

/**
 * densityStack — 積み上がる広告（DESIGN.md §9 Layered Ad / chaos。PER-01 / PER-02 の見た目）。
 *
 * 下敷きの 2 枚は**ただの装飾**。「1 枚閉じてもまだ下にある」という絵を 1 インスタンスで出すためだけにある。
 * 実際の追加レイヤーはエンジンが別インスタンスとして出す（persist:multi-layer）ので、
 * 装飾側には操作先（data-target）もフォーカスできる要素も持たせない（aria-hidden）。
 * シェルが保証するのは「積めること」だけで、何層積むかは決めない（TASK-013B req.2）。
 */
const DECORATION_COUNT = 2

export function DensityStack(p: ShellProps) {
  const label = resolvePartState(p.parts, 'label')
  const body = resolvePartState(p.parts, 'body')
  const cta = resolvePartState(p.parts, 'cta')
  const close = resolvePartState(p.parts, 'close')

  return (
    <div
      className={cx(styles.stack, adThemeClass(p.creative.theme))}
      data-shell-root="densityStack"
      data-ad-theme={p.creative.theme}
      data-lifecycle={p.lifecycle}
      data-stack-index={String(p.stackIndex)}
      data-testid={`shell-${p.instanceId}`}
    >
      {Array.from({ length: DECORATION_COUNT }, (_unused, depth) => (
        <span key={depth} className={cx(styles.under)} data-stack-decoration={String(depth + 1)} aria-hidden="true" />
      ))}

      <div className={cx(styles.card)} data-target="body" data-instance={p.instanceId}>
        <div className={cx(styles.head)}>
          <AdMeta visible={label.visible} emphasis={label.emphasis} instanceId={p.instanceId} />
          <span className={cx(styles.brand)}>{p.creative.brand}</span>
        </div>

        <AdHeadline className={cx(styles.headline)} instanceId={p.instanceId}>
          {p.creative.headline}
        </AdHeadline>

        {p.creative.body === undefined ? null : (
          <AdBody visible={body.visible} instanceId={p.instanceId}>
            {p.creative.body}
          </AdBody>
        )}

        {p.countdown === undefined ? null : (
          <AdCountdown remainingMs={p.countdown.remainingMs} instanceId={p.instanceId} />
        )}

        {p.badge === undefined ? null : <p className={cx(styles.badge)}>{p.badge}</p>}

        <AdCTA
          label={p.creative.cta}
          visible={cta.visible}
          enabled={cta.enabled}
          emphasis={cta.emphasis}
          instanceId={p.instanceId}
          className={cx(styles.cta)}
        />

        <CloseButton
          visible={close.visible}
          enabled={close.enabled}
          emphasis={close.emphasis}
          hitboxScale={close.hitboxScale}
          instanceId={p.instanceId}
          {...(close.anchor === undefined ? {} : { anchor: close.anchor })}
        />
      </div>
    </div>
  )
}
