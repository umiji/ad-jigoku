import { SLOTS } from '@ad-jigoku/pattern-catalog'
import type { Effect } from '../state/effect'
import type { Intent, TargetRef } from '../state/intent'
import type { ActiveAd, GameState } from '../state/types'
import { mergeView } from '../sim/spawn'
import type { Outcome } from '../sim/types'
import { patternOf, simContext, type StepEnv } from './context'
import { applyMistake, applyOutcome, updateAd } from './outcome'

/**
 * `point` / `action` intent の処理。
 * 1. 対象広告の各 behavior に onIntent を配る（sim / view / effects を反映）
 * 2. どの behavior も `handled` にしなかった場合、エンジンの既定ルールを適用する:
 *    - point(close)  かつ closable   → closed
 *    - point(close)  かつ 未 closable → mistake 'too-early'（軽微）
 *    - point(fake-close / decoy)    → mistake 'fake-close'
 *    - point(cta / media)           → mistake 'clicked-ad'
 *    - action(SMASH, ad) closable   → smashed / 未 closable → mistake 'too-early'
 *    - action(REPORT, ad)           → 正解が「押さない」パターンなら reported、それ以外は mistake 'wrong-action'
 *    - action(CLOSE, ad)            → point(close) と同じ
 *    - その他の action / 対象なし   → behavior 任せ。未処理なら mistake 'wrong-action'
 * chrome / content への point はここでは無視する（TASK-014A / 015 が扱う）。
 */
export function handleTargetedIntent(env: StepEnv, state: GameState, intent: Extract<Intent, { t: 'point' | 'action' }>, effects: Effect[]): GameState {
  const target = intent.target
  const ad = target?.kind === 'ad' ? state.ads.find((a) => a.instanceId === target.instanceId) : undefined
  if (!ad) {
    if (intent.t === 'action' && !target) return applyMistake(state, undefined, 'wrong-action', env.tuning.PATIENCE_PENALTY_STRAY_CLICK, effects).state
    return state
  }
  if (ad.lifecycle === 'closing') return state

  let next = state
  let handled = false
  for (const slot of SLOTS) {
    const current = next.ads.find((a) => a.instanceId === ad.instanceId)
    if (!current || current.lifecycle === 'closing') return next
    const active = current.behaviors[slot]
    if (!active) continue
    const behavior = env.run.registries.behaviors.resolve(active.id, slot)
    const result = behavior.onIntent(active.sim, intent, simContext(env, next, current))
    next = updateAd(next, current.instanceId, (a) => ({
      ...a,
      behaviors: { ...a.behaviors, [slot]: { ...active, sim: result.sim } },
      view: result.view ? mergeView(a.view, result.view) : a.view,
    }))
    if (result.effects) effects.push(...result.effects)
    if (result.handled) handled = true
    if (result.outcome) {
      const cur = next.ads.find((a) => a.instanceId === ad.instanceId)
      if (cur) {
        const applied = applyOutcome(env, next, cur, result.outcome)
        next = applied.state
        effects.push(...applied.effects)
      }
      handled = true
    }
  }
  if (handled) return next

  const current = next.ads.find((a) => a.instanceId === ad.instanceId)
  if (!current || current.lifecycle === 'closing') return next
  const outcome = defaultOutcome(env, current, intent, target)
  if (!outcome) return next
  if (outcome.kind === 'mistake' && (outcome.reason === 'too-early' || outcome.reason === 'wrong-action' || outcome.reason === 'stray-click')) {
    const penalty = outcome.reason === 'too-early' ? env.tuning.PATIENCE_PENALTY_TOO_EARLY : env.tuning.PATIENCE_PENALTY_STRAY_CLICK
    return applyMistake(next, current, outcome.reason, penalty, effects).state
  }
  const applied = applyOutcome(env, next, current, outcome)
  effects.push(...applied.effects)
  return applied.state
}

function defaultOutcome(env: StepEnv, ad: ActiveAd, intent: Extract<Intent, { t: 'point' | 'action' }>, target: TargetRef | undefined): Outcome | undefined {
  const closable = ad.lifecycle === 'closable'
  if (intent.t === 'point' || (intent.t === 'action' && intent.action === 'CLOSE')) {
    const part = target?.kind === 'ad' ? target.part : 'body'
    switch (part) {
      case 'close':
        return closable ? { kind: 'closed' } : { kind: 'mistake', reason: 'too-early' }
      case 'fake-close':
      case 'decoy':
        return { kind: 'mistake', reason: 'fake-close' }
      case 'cta':
      case 'media':
        return { kind: 'mistake', reason: 'clicked-ad' }
      case 'body':
      case 'label':
      case 'legal':
        // 関係ない場所の連打は軽微なペナルティ（GAME §24: 連打は最適戦略にならない）。action 経由の body 指定は対象指定なので除外
        return intent.t === 'point' ? { kind: 'mistake', reason: 'stray-click' } : undefined
    }
  }
  switch (intent.action) {
    case 'SMASH':
      return closable ? { kind: 'smashed' } : { kind: 'mistake', reason: 'too-early' }
    case 'REPORT':
      return patternOf(env, ad).game?.correctInaction ? { kind: 'reported' } : { kind: 'mistake', reason: 'wrong-action' }
    case 'DODGE':
    case 'FOCUS':
    case 'ESCAPE':
    case 'IGNORE':
      return { kind: 'mistake', reason: 'wrong-action' }
  }
  return undefined
}
