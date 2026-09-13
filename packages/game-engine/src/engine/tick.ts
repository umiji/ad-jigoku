import { SLOTS } from '@ad-jigoku/pattern-catalog'
import type { Effect } from '../state/effect'
import type { ActiveAd, EncounterEvent, GameState } from '../state/types'
import { CLOSING_STEPS, ENTER_STEPS, instantiateAd, mergeView } from '../sim/spawn'
import { patternOf, simContext, type StepEnv } from './context'
import { applyOutcome, updateAd, withPatience } from './outcome'

/**
 * `{ t: 'tick' }` の処理順:
 *  1. step を進める
 *  2. スケジュール済み広告の出現（同時出現上限を尊重。上限超過分は次 tick 以降に持ち越す）
 *  3. ライフサイクル遷移（entering → visible → closable / closing → 除去）
 *  4. 各アクティブ広告の各 behavior の onTick と outcome 適用
 * リソース（perSecondAlive / threat / 勝敗）は TASK-009 が resource/ に置き、run.ts がこの後に呼ぶ。
 */
export function tickAds(env: StepEnv, state: GameState, effects: Effect[]): GameState {
  let next = spawnDue(env, state, effects)
  next = advanceLifecycles(next)
  next = runBehaviorTicks(env, next, effects)
  return next
}

function spawnDue(env: StepEnv, state: GameState, effects: Effect[]): GameState {
  const due = state.schedule.filter((s) => s.atStep <= state.step)
  if (due.length === 0) return state
  const max = env.tuning.MAX_CONCURRENT_ADS[env.run.config.device]
  let ads = state.ads
  let log = state.log
  let patience = state.patience
  const spawned = new Set<string>()
  for (const spawn of due) {
    const active = ads.filter((a) => a.lifecycle !== 'closing').length
    if (active >= max) break // 上限。残りは持ち越し（順序は保つ）
    const pattern = env.patternById.get(spawn.patternId)
    if (!pattern) throw new Error(`spawn: カタログに無い PatternId "${spawn.patternId}"`)
    const stackIndex = ads.length === 0 ? 0 : Math.max(...ads.map((a) => a.view.stackIndex)) + 1
    const { ad, effects: fx } = instantiateAd({
      spawn,
      pattern,
      registries: env.run.registries,
      rng: env.rng,
      a11y: state.a11y,
      tuning: env.tuning,
      step: state.step,
      elapsedMs: state.elapsedMs,
      stackIndex,
    })
    ads = [...ads, ad]
    effects.push(...fx, { kind: 'sound', id: 'popup' })
    const onSpawn = pattern.game?.patienceEffect.onSpawn ?? 0
    const before = patience
    patience = Math.max(0, patience - onSpawn)
    const ev: EncounterEvent = { step: state.step, kind: 'spawn', patternId: ad.patternId, instanceId: ad.instanceId, patienceDelta: patience - before }
    if (spawn.role) ev.detail = spawn.role
    log = [...log, ev]
    spawned.add(spawn.instanceId)
  }
  if (spawned.size === 0) return state
  return { ...state, ads, log, patience, schedule: state.schedule.filter((s) => !spawned.has(s.instanceId)) }
}

function advanceLifecycles(state: GameState): GameState {
  let changed = false
  const ads: ActiveAd[] = []
  for (const ad of state.ads) {
    if (ad.lifecycle === 'closing') {
      if (state.step - (ad.closingAtStep ?? ad.spawnedAtStep) >= CLOSING_STEPS) {
        changed = true
        continue // closed → 除去
      }
      ads.push(ad)
      continue
    }
    let next = ad
    if (next.lifecycle === 'entering' && state.step - next.spawnedAtStep >= ENTER_STEPS) {
      next = { ...next, lifecycle: 'visible', view: { ...next.view, motion: next.view.motion.filter((m) => !m.startsWith('enter-')) } }
    }
    if (next.lifecycle !== 'closable' && state.step >= next.closableAtStep) {
      next = {
        ...next,
        lifecycle: 'closable',
        view: mergeView(next.view, { parts: next.view.parts.filter((p) => p.part === 'close').map((p) => ({ ...p, enabled: true })) }),
      }
    }
    if (next !== ad) changed = true
    ads.push(next)
  }
  if (!changed) return state
  const becameClosable = ads.filter((a, i) => a.lifecycle === 'closable' && state.ads.find((o) => o.instanceId === a.instanceId)?.lifecycle !== 'closable' && i >= 0)
  const log = becameClosable.length > 0 ? [...state.log, ...becameClosable.map((a): EncounterEvent => ({ step: state.step, kind: 'closable', patternId: a.patternId, instanceId: a.instanceId }))] : state.log
  return { ...state, ads, log }
}

function runBehaviorTicks(env: StepEnv, state: GameState, effects: Effect[]): GameState {
  let next = state
  for (const original of state.ads) {
    if (original.lifecycle === 'closing') continue
    for (const slot of SLOTS) {
      const current = next.ads.find((a) => a.instanceId === original.instanceId)
      if (!current || current.lifecycle === 'closing') break
      const active = current.behaviors[slot]
      if (!active) continue
      const behavior = env.run.registries.behaviors.resolve(active.id, slot)
      const result = behavior.onTick(active.sim, simContext(env, next, current))
      next = updateAd(next, current.instanceId, (a) => ({
        ...a,
        behaviors: { ...a.behaviors, [slot]: { ...active, sim: result.sim } },
        view: result.view ? mergeView(a.view, result.view) : a.view,
      }))
      if (result.effects) effects.push(...result.effects)
      if (result.outcome) {
        const ad = next.ads.find((a) => a.instanceId === current.instanceId)
        if (ad) {
          const applied = applyOutcome(env, next, ad, result.outcome)
          next = applied.state
          effects.push(...applied.effects)
        }
      }
    }
  }
  return next
}

/** 放置コスト（perSecondAlive）を 1 tick 分だけ適用する。TASK-009 が threat と一緒に利用する */
export function drainPatience(env: StepEnv, state: GameState): GameState {
  let next = state
  for (const ad of state.ads) {
    if (ad.lifecycle === 'closing') continue
    const perSecond = patternOf(env, ad).game?.patienceEffect.perSecondAlive ?? 0
    if (perSecond <= 0) continue
    next = withPatience(next, -perSecond / 60)
  }
  return next
}
