import { AdCTA, AdCountdown, AdMeta, CloseButton, resolvePartState } from '../../parts/index'
import { adThemeClass } from '../../parts/adTheme'
import { cx } from '../../parts/cx'
import styles from './videoPlayer.module.css'
import type { ShellProps } from '../types'

/**
 * videoPlayer — 隅に居座る偽の動画プレイヤー（ATT-01 / ATT-02 / OBS-06 の見た目）。
 *
 * **音は鳴らさない。動画ファイルも読まない。**（DESIGN.md §20 NEVER autoplay sound / CSP）
 * 「映像が流れている」ことは CSS だけで表す（動く帯 + 進行バー）。`reducedMotion` のときは
 * 同じ絵を止めた静止フレームにする（DESIGN.md §20 reduced motion）。
 *
 * 「🔊 音声が再生されています」の類は `badge` としてエンジンが渡す文字列で、
 * 広告が名乗っているだけの偽表示。見た目にも支援技術にも同じ文字列しか出さない（差をつけない）。
 */
const COPY = {
  /** 押しても再生も停止もしない。だから支援技術には「実際には再生されない」と言う */
  controlAriaLabel: '広告の動画のコントロール（実際には再生も音声もされません）',
} as const

export function VideoPlayer(p: ShellProps) {
  const label = resolvePartState(p.parts, 'label')
  const media = resolvePartState(p.parts, 'media')
  const cta = resolvePartState(p.parts, 'cta')
  const close = resolvePartState(p.parts, 'close')

  return (
    <div
      className={cx(styles.player, adThemeClass(p.creative.theme))}
      data-shell-root="videoPlayer"
      data-ad-theme={p.creative.theme}
      data-lifecycle={p.lifecycle}
      data-reduced-motion={String(p.reducedMotion)}
      data-testid={`shell-${p.instanceId}`}
    >
      <div className={cx(styles.head)}>
        <AdMeta visible={label.visible} emphasis={label.emphasis} instanceId={p.instanceId} />
        <span className={cx(styles.brand)}>{p.creative.brand}</span>
      </div>

      {media.visible ? (
        <div className={cx(styles.screen)} data-target="media" data-instance={p.instanceId}>
          <span className={cx(styles.bars)} aria-hidden="true" />
          <p className={cx(styles.title)}>{p.creative.headline}</p>

          <div className={cx(styles.controls)}>
            <button
              type="button"
              className={cx(styles.control)}
              data-target="media"
              data-instance={p.instanceId}
              aria-label={COPY.controlAriaLabel}
            >
              <span aria-hidden="true">{p.reducedMotion ? '▶' : '❚❚'}</span>
            </button>
            <span className={cx(styles.track)} aria-hidden="true">
              <span className={cx(styles.progress)} />
            </span>
          </div>
        </div>
      ) : null}

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
  )
}
