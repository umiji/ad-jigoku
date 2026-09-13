import { AdCTA, AdMeta, adCopy, resolvePartState } from '../../parts/index'
import { adThemeClass } from '../../parts/adTheme'
import { cx } from '../../parts/cx'
import styles from './inlineRect.module.css'
import type { CSSProperties } from 'react'
import type { ShellProps } from '../types'

/**
 * inlineRect — 本文中のレクタングル広告（DESIGN.md §9 Layout Shift / instability）。
 *
 * 部位は `label` / `media` / `cta` だけ（engine の宣言）。見出しは**バナー画像に焼き込まれた文字**の扱いで
 * `media` 面の中に描く。宣言していない `body` 部位の intent を生やさないため。
 *
 * `offset` は `transform: translateY(%)` にしか使わない。**document flow は変えない**（ADR-006）。
 * 本文が実際に動くのはスロット側（ArticleSurface）の仕事で、ここが自分で動くのは見た目だけ。
 */
export function InlineRect(p: ShellProps) {
  const label = resolvePartState(p.parts, 'label')
  const media = resolvePartState(p.parts, 'media')
  const cta = resolvePartState(p.parts, 'cta')
  const style =
    p.offset === undefined ? undefined : ({ '--ad-offset-y': `${p.offset.yPercent}%` } as CSSProperties)

  return (
    <div
      className={cx(styles.rect, adThemeClass(p.creative.theme))}
      data-shell-root="inlineRect"
      data-ad-theme={p.creative.theme}
      data-lifecycle={p.lifecycle}
      data-testid={`shell-${p.instanceId}`}
      {...(style === undefined ? {} : { style })}
    >
      {media.visible ? (
        <div className={cx(styles.media)} data-target="media" data-instance={p.instanceId}>
          <span className={cx(styles.grid)} aria-hidden="true" />
          <span className={cx(styles.burst)} aria-hidden="true" />
          <p className={cx(styles.headline)}>{p.creative.headline}</p>
          <span className={cx(styles.tag)}>{adCopy.label.limited}</span>
        </div>
      ) : null}

      <div className={cx(styles.foot)}>
        <AdMeta visible={label.visible} emphasis={label.emphasis} instanceId={p.instanceId} />
        <AdCTA
          label={p.creative.cta}
          visible={cta.visible}
          enabled={cta.enabled}
          emphasis={cta.emphasis}
          instanceId={p.instanceId}
          className={cx(styles.cta)}
        />
      </div>

      {p.badge === undefined ? null : <p className={cx(styles.badge)}>{p.badge}</p>}
    </div>
  )
}
