import { AdCreative, CloseButton, resolvePartState } from '../../parts/index'
import { adThemeClass } from '../../parts/adTheme'
import { cx } from '../../parts/cx'
import styles from './popup.module.css'
import type { Creative } from '@ad-jigoku/pattern-catalog'
import type { CreativeContent } from '../../parts/types'
import type { ShellProps } from '../types'

/**
 * `Creative`（013D）→ `CreativeContent`（部位が受け取る表示用ビュー）。
 * 値は同じだが、`exactOptionalPropertyTypes` の下では「省略可」と「undefined を持てる」が別の型なので、
 * 未指定のフィールドは**キーごと落として**渡す。`tags` は抽選用のメタで、描画には使わない。
 */
function toCreativeContent(creative: Creative): CreativeContent {
  return {
    id: creative.id,
    kind: creative.kind,
    brand: creative.brand,
    headline: creative.headline,
    cta: creative.cta,
    theme: creative.theme,
    ...(creative.body === undefined ? {} : { body: creative.body }),
    ...(creative.legal === undefined ? {} : { legal: creative.legal }),
  }
}

/**
 * popup — DESIGN.md §8 の canonical anatomy（`PR / × / HEADLINE / copy / CTA / legal`）そのもの。
 * 明るい紙色の広告ウィンドウが暗いサイトに割り込む、という絵（`surface.popup`）。
 *
 * **このシェルが持つのは「箱」だけ**。位置・z 順・出入りのモーションは宿主のスロットが持ち、
 * 中身は parts が持つ。閉じるタイミングも移動も再出現も判断しない（挙動は Behavior 側）。
 * 影（`shadow-popup`）だけはシェルの責務（DESIGN.md §16.1「浮いている面」）。
 */
export function Popup(p: ShellProps) {
  const close = resolvePartState(p.parts, 'close')

  return (
    <div
      className={cx(styles.popup, adThemeClass(p.creative.theme))}
      data-shell-root="popup"
      data-ad-theme={p.creative.theme}
      data-lifecycle={p.lifecycle}
      data-testid={`shell-${p.instanceId}`}
    >
      <AdCreative
        creative={toCreativeContent(p.creative)}
        parts={p.parts}
        instanceId={p.instanceId}
        className={cx(styles.creative)}
        {...(p.countdown === undefined ? {} : { countdown: p.countdown })}
      />

      {/* エンジンが渡した偽の表示（ATT-02 等）。文言はここで作らない */}
      {p.badge === undefined ? null : <p className={cx(styles.badge)}>{p.badge}</p>}

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
