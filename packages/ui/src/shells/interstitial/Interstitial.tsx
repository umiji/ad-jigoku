import {
  AdBody,
  AdCountdown,
  AdCTA,
  AdHeadline,
  AdLegal,
  AdMeta,
  CloseButton,
  adCopy,
  resolvePartState,
} from '../../parts/index'
import { adThemeClass } from '../../parts/adTheme'
import { cx } from '../../parts/cx'
import styles from './interstitial.module.css'
import type { CreativeTheme } from '../../parts/types'
import type { ShellProps } from '../types'

/**
 * interstitial — 本文を全部覆う割り込み（DESIGN.md §9 Fullscreen / interruption）。
 *
 * popup と同じ部位を使うが、組み方が違う（シェルは独立モジュール。共通の土台は持たない / DECISIONS_v0.2 §1.3）:
 * 全画面なので見出しを一段大きく取り、CTA を画面幅いっぱいの帯にする。
 *
 * **必ず暗い面で描く。** 紙色のまま全画面にすると画面全体が明滅して眩しく、
 * パロディの範囲を超えて実害になる（DESIGN.md §20 / §14 "avoid animation for animation's sake"）。
 * 新しい色は作らず、既存テーマの暗い側へ倒すだけ。
 */
const DARK_VARIANT: Readonly<Record<CreativeTheme, CreativeTheme>> = {
  popup: 'popupDark',
  popupDark: 'popupDark',
  warning: 'danger',
  danger: 'danger',
}

export function Interstitial(p: ShellProps) {
  const theme = DARK_VARIANT[p.creative.theme]
  const label = resolvePartState(p.parts, 'label')
  const media = resolvePartState(p.parts, 'media')
  const body = resolvePartState(p.parts, 'body')
  const cta = resolvePartState(p.parts, 'cta')
  const close = resolvePartState(p.parts, 'close')

  return (
    <div
      className={cx(styles.interstitial, adThemeClass(theme))}
      data-shell-root="interstitial"
      data-ad-theme={theme}
      data-lifecycle={p.lifecycle}
      data-testid={`shell-${p.instanceId}`}
    >
      <div className={cx(styles.card)} data-target="body" data-instance={p.instanceId}>
        <div className={cx(styles.head)}>
          <AdMeta visible={label.visible} emphasis={label.emphasis} instanceId={p.instanceId} />
          <span className={cx(styles.brand)}>{p.creative.brand}</span>
        </div>

        {media.visible ? (
          <div className={cx(styles.media)} data-target="media" data-instance={p.instanceId}>
            <span className={cx(styles.beam)} aria-hidden="true" />
            <span className={cx(styles.tag)}>{adCopy.label.limited}</span>
          </div>
        ) : null}

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

        <AdLegal instanceId={p.instanceId}>{p.creative.legal ?? adCopy.legal.fiction}</AdLegal>

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
