import { AdBody, AdCountdown, AdCTA, AdHeadline, AdMeta, CloseButton, resolvePartState } from '../../parts/index'
import { adThemeClass } from '../../parts/adTheme'
import { cx } from '../../parts/cx'
import styles from './stickyBanner.module.css'
import type { ShellProps } from '../types'

/**
 * stickyBanner — 画面下に貼り付く帯（DESIGN.md §9 Sticky Ad / persistence）。
 *
 * 追従そのものは宿主のスロット（`surface: 'sticky-bottom'`）がやる。ここは帯の中身だけ。
 * 帯なので `media` と `legal` を持たない（engine の parts 宣言と同じ）。
 * モバイルで本文を潰さないよう 1 行に詰める（DESIGN.md §19: 同時に出た広告でページを使用不能にしない）。
 */
export function StickyBanner(p: ShellProps) {
  const label = resolvePartState(p.parts, 'label')
  const body = resolvePartState(p.parts, 'body')
  const cta = resolvePartState(p.parts, 'cta')
  const close = resolvePartState(p.parts, 'close')

  return (
    <div
      className={cx(styles.banner, adThemeClass(p.creative.theme))}
      data-shell-root="stickyBanner"
      data-ad-theme={p.creative.theme}
      data-lifecycle={p.lifecycle}
      data-testid={`shell-${p.instanceId}`}
      data-target="body"
      data-instance={p.instanceId}
    >
      <div className={cx(styles.copy)}>
        <div className={cx(styles.line)}>
          <AdMeta visible={label.visible} emphasis={label.emphasis} instanceId={p.instanceId} />
          <AdHeadline className={cx(styles.headline)} instanceId={p.instanceId}>
            {p.creative.headline}
          </AdHeadline>
        </div>

        {p.creative.body === undefined ? null : (
          <AdBody visible={body.visible} instanceId={p.instanceId} className={cx(styles.note)}>
            {p.creative.body}
          </AdBody>
        )}

        {p.countdown === undefined ? null : (
          <AdCountdown remainingMs={p.countdown.remainingMs} instanceId={p.instanceId} />
        )}

        {p.badge === undefined ? null : <p className={cx(styles.badge)}>{p.badge}</p>}
      </div>

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
        {...(close.anchor === undefined ? { placement: 'flow' } : { anchor: close.anchor })}
      />
    </div>
  )
}
