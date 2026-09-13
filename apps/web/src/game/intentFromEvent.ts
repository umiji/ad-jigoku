import type { AdPart, Intent, TargetRef } from '@ad-jigoku/game-engine'
import type { PlayerAction } from '@ad-jigoku/pattern-catalog'

/**
 * DOM イベント → Intent（TASK-014 要件 3）。
 * クリック対象の `data-target` / `data-instance` 属性から論理的な TargetRef を作る。**座標は使わない。**
 *
 *   data-target="close|fake-close|cta|body|media|label|legal|decoy"  data-instance="<instanceId>"  → ad part
 *   data-target="content" data-content-id="<id>"                                                   → 本文
 *   data-target="chrome"  data-chrome-id="<id>"                                                    → 偽ブラウザ枠
 *   data-action="SMASH|DODGE|FOCUS|REPORT|ESCAPE|IGNORE|CLOSE" [data-instance]                     → 対抗アクション
 */
const AD_PARTS: readonly AdPart[] = ['close', 'fake-close', 'cta', 'body', 'media', 'label', 'legal', 'decoy']
const ACTIONS: readonly PlayerAction[] = ['CLOSE', 'SMASH', 'DODGE', 'FOCUS', 'REPORT', 'ESCAPE', 'IGNORE']

export function targetRefFromElement(start: Element | null): TargetRef | null {
  const el = start?.closest<HTMLElement>('[data-target]') ?? null
  if (!el) return null
  const target = el.dataset['target'] ?? ''
  if (AD_PARTS.includes(target as AdPart)) {
    const instanceId = el.closest<HTMLElement>('[data-instance]')?.dataset['instance']
    if (!instanceId) return null
    return { kind: 'ad', instanceId, part: target as AdPart }
  }
  if (target === 'content') return { kind: 'content', id: el.dataset['contentId'] ?? 'article' }
  if (target === 'chrome') return { kind: 'chrome', id: el.dataset['chromeId'] ?? 'frame' }
  return null
}

export function intentFromElement(start: Element | null): Intent | null {
  const actionEl = start?.closest<HTMLElement>('[data-action]') ?? null
  if (actionEl) {
    const action = actionEl.dataset['action'] ?? ''
    if (!ACTIONS.includes(action as PlayerAction)) return null
    const instanceId = actionEl.closest<HTMLElement>('[data-instance]')?.dataset['instance'] ?? actionEl.dataset['instance']
    const intent: Intent = instanceId ? { t: 'action', action: action as PlayerAction, target: { kind: 'ad', instanceId, part: 'body' } } : { t: 'action', action: action as PlayerAction }
    return intent
  }
  const target = targetRefFromElement(start)
  return target ? { t: 'point', target } : null
}

/** pointer / click イベントから Intent を作る。対象外の要素なら null */
export function intentFromEvent(event: { target: EventTarget | null }): Intent | null {
  const el = event.target instanceof Element ? event.target : null
  return intentFromElement(el)
}

/** 数字キー → アクション（デスクトップ用ショートカット。TASK-016 のアクションバーと同じ並び） */
export const ACTION_KEYS: Record<string, PlayerAction> = { '1': 'SMASH', '2': 'DODGE', '3': 'FOCUS', '4': 'REPORT', '5': 'ESCAPE' }

/** wheel / キー操作を論理行数に正規化する（ピクセルではない） */
export const SCROLL_PX_PER_LINE = 24
export function scrollIntentFromDelta(deltaY: number): Intent | null {
  const lines = Math.trunc(deltaY / SCROLL_PX_PER_LINE)
  return lines === 0 ? null : { t: 'scroll', deltaLines: lines }
}
