'use client'

import type { ActiveAd } from '@ad-jigoku/game-engine'
import type { PatternDefinition } from '@ad-jigoku/pattern-catalog'
import type { ComponentType } from 'react'
import styles from './adlayer.module.css'
import { shellPropsOf, type ShellProps } from './shellProps'

/**
 * AdLayer — ViewState[] → Shell コンポーネント（TASK-014 要件 5）。
 * 条件分岐によるゲームロジックは存在しない。surface / stackIndex / motion を data 属性に写し、
 * shellId に対応するコンポーネントへ props を渡すだけ。
 */
export type ShellComponentMap = Readonly<Record<string, ComponentType<ShellProps>>>

export function AdLayer({ ads, step, reducedMotion, shells, fallback, byId }: { ads: readonly ActiveAd[]; step: number; reducedMotion: boolean; shells: ShellComponentMap; fallback: ComponentType<ShellProps>; byId: ReadonlyMap<string, PatternDefinition> }) {
  return (
    <div className={styles.layer} data-testid="ad-layer" aria-live="polite">
      {ads.map((ad) => {
        const props = shellPropsOf(ad, step, reducedMotion, byId.get(ad.patternId))
        const Shell = shells[ad.shellId] ?? fallback
        const stack = String(Math.min(5, Math.max(0, props.stackIndex)))
        const style = props.anchor ? ({ '--ad-x': `${props.anchor.xPercent}%`, '--ad-y': `${props.anchor.yPercent}%` } as React.CSSProperties) : undefined
        return (
          <div
            key={ad.instanceId}
            className={styles.slot}
            data-instance={ad.instanceId}
            data-shell={ad.shellId}
            data-surface={props.surface}
            data-size={props.sizeHint}
            data-stack={stack}
            data-lifecycle={props.lifecycle}
            data-motion={props.motion.join(' ')}
            style={style}
          >
            <Shell {...props} />
          </div>
        )
      })}
    </div>
  )
}
