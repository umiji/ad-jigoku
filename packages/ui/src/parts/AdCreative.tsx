import { AdBody } from './AdBody'
import { AdCountdown } from './AdCountdown'
import { AdCTA } from './AdCTA'
import { AdHeadline } from './AdHeadline'
import { AdLegal } from './AdLegal'
import { AdMeta } from './AdMeta'
import { adThemeClass } from './adTheme'
import { adCopy } from './copy'
import { CreativeGraphic, graphicVariant } from './creativeGraphic'
import { cx } from './cx'
import styles from './AdCreative.module.css'
import { resolvePartState, type AdPart, type AdPartState, type Countdown, type CreativeContent } from './types'

/**
 * 架空の広告素材ひとつ分（DESIGN.md §8 anatomy）。
 *
 * ここは**中身**だけを持つ。ポップアップの浮き方・位置・z 順・出入りのモーションは
 * シェル（TASK-013A/B/C）の責務。閉じるボタンもシェルが置く（位置は面の形に依存するため）。
 *
 * 素材データ（`CreativeContent`）は TASK-013D が供給する。実在ブランドは入らない
 * （DESIGN.md §3 MUST NOT 9）。ここにコピーをハードコードしない（OD-9）。
 *
 * `parts` は engine の `ViewState.parts` をそのまま渡せる（types.ts は sim/view.ts の写し）。
 */
export type AdCreativeProps = {
  readonly creative: CreativeContent
  /** engine の ViewState.parts。未指定の部位は「見える / 押せる / 通常」 */
  readonly parts?: readonly AdPartState[]
  /** 残り待機時間。渡されたら必ず表示される（GAME §15.4） */
  readonly countdown?: Countdown
  readonly instanceId?: string
  readonly onPartActivate?: (part: AdPart) => void
  readonly className?: string
}

/** ブランドのイニシャル。日本語でも英字でも先頭 2 文字（ロゴは作らない） */
function brandInitials(brand: string): string {
  return [...brand].slice(0, 2).join('')
}

export function AdCreative({
  creative,
  parts,
  countdown,
  instanceId,
  onPartActivate,
  className,
}: AdCreativeProps) {
  const label = resolvePartState(parts, 'label')
  const media = resolvePartState(parts, 'media')
  const body = resolvePartState(parts, 'body')
  const cta = resolvePartState(parts, 'cta')
  const variant = graphicVariant(creative.id)

  return (
    <article
      className={cx(styles.creative, adThemeClass(creative.theme), className)}
      data-ad-theme={creative.theme}
      data-creative-id={creative.id}
      data-creative-kind={creative.kind}
      data-graphic-variant={variant}
      data-target="body"
      data-instance={instanceId}
    >
      <div className={styles.head}>
        <span className={styles.brand}>
          <span className={styles['brand-mark']} aria-hidden="true">
            {brandInitials(creative.brand)}
          </span>
          <span className={styles['brand-name']}>{creative.brand}</span>
        </span>
        <AdMeta
          visible={label.visible}
          emphasis={label.emphasis}
          {...(instanceId === undefined ? {} : { instanceId })}
        />
      </div>

      {media.visible ? (
        <div className={styles.media} data-target="media" data-instance={instanceId}>
          <CreativeGraphic variant={variant} />
          <span className={styles['media-tag']}>{adCopy.label.limited}</span>
        </div>
      ) : null}

      {/*
        見出しは広告そのものなので `body` 部位の visible では消さない
        （消すと「何も言っていない広告」になる）。`body` が制御するのは補足コピー側。
        クリックの intent はどちらも `body` 部位にマップされる（data-target）。
      */}
      <AdHeadline {...(instanceId === undefined ? {} : { instanceId })}>{creative.headline}</AdHeadline>

      {creative.body === undefined ? null : (
        <AdBody visible={body.visible} {...(instanceId === undefined ? {} : { instanceId })}>
          {creative.body}
        </AdBody>
      )}

      {countdown === undefined ? null : (
        <AdCountdown
          remainingMs={countdown.remainingMs}
          {...(instanceId === undefined ? {} : { instanceId })}
        />
      )}

      <div className={styles.foot}>
        <AdCTA
          label={creative.cta}
          visible={cta.visible}
          enabled={cta.enabled}
          emphasis={cta.emphasis}
          {...(instanceId === undefined ? {} : { instanceId })}
          {...(onPartActivate === undefined ? {} : { onActivate: () => onPartActivate('cta') })}
        />
        <AdLegal {...(instanceId === undefined ? {} : { instanceId })}>
          {creative.legal ?? adCopy.legal.fiction}
        </AdLegal>
      </div>
    </article>
  )
}
