import { SLOTS, type PatternDefinition, type Slot } from '@ad-jigoku/pattern-catalog'
import type { EngineTuning } from '../config'
import { msToSteps } from '../core/clock'
import type { Rng } from '../core/rng'
import type { Effect } from '../state/effect'
import type { AccessibilityProfile } from '../state/intent'
import type { ActiveAd, ActiveBehavior, ScheduledSpawn } from '../state/types'
import type { Registries } from './registries'
import type { SpawnContext } from './types'
import { partState, type ViewState } from './view'

/** entering → visible に要するステップ数（DESIGN §14 normal 240ms 相当） */
export const ENTER_STEPS = 14
/** closing → closed（除去）に要するステップ数 */
export const CLOSING_STEPS = 14

export type SpawnInput = {
  spawn: ScheduledSpawn
  pattern: PatternDefinition
  registries: Registries
  rng: Rng
  a11y: AccessibilityProfile
  tuning: EngineTuning
  step: number
  elapsedMs: number
  stackIndex: number
}

/**
 * ScheduledSpawn → ActiveAd。生成時に shell.supports ⊇ 使用スロット を検証する（V-13）。
 * 未登録の shell / behavior はここで例外になる（AD-2: 実装のないパターンは出ない）。
 */
export function instantiateAd(input: SpawnInput): { ad: ActiveAd; effects: Effect[] } {
  const { spawn, pattern, registries, tuning, step } = input
  const usedSlots = SLOTS.filter((s) => spawn.behaviors[s] !== undefined)
  const shell = registries.shells.assertSupports(spawn.shellId, usedSlots)

  const baseView: ViewState = {
    shellId: shell.id,
    surface: shell.surface,
    sizeHint: shell.sizeHint,
    creative: { index: spawn.creativeIndex },
    parts: shell.parts.map((p) => partState(p, p === 'close' ? { enabled: false } : {})),
    motion: ['enter-scale'],
    stackIndex: input.stackIndex,
  }

  const ctx: SpawnContext = {
    rng: input.rng,
    a11y: input.a11y,
    tuning,
    step,
    elapsedMs: input.elapsedMs,
    spawnedAtStep: step,
    pattern,
    instanceId: spawn.instanceId,
    shell,
  }

  let view = baseView
  let closeDelayMs = 0
  const effects: Effect[] = []
  const behaviors: Partial<Record<Slot, ActiveBehavior>> = {}
  for (const slot of usedSlots) {
    const spec = spawn.behaviors[slot]
    if (!spec) continue
    const behavior = registries.behaviors.resolve(spec.id, slot)
    closeDelayMs = Math.max(closeDelayMs, behavior.closeDelayMs?.(spec.params, ctx) ?? 0)
    const result = behavior.init(spec.params, ctx)
    if (result.view) view = mergeView(view, result.view)
    if (result.effects) effects.push(...result.effects)
    behaviors[slot] = { id: spec.id, params: spec.params, sim: result.sim }
  }

  // SAFE-01: 必ず有限、かつグローバル上限以内。
  // 描画（entering）が終わる前に closable にはしない: × が見えていないのに押せる/押せないの判定が発生しないように
  const cap = Math.min(tuning.MAX_CLOSE_DELAY_MS, pattern.game?.maxCloseDelayMsOverride ?? tuning.MAX_CLOSE_DELAY_MS)
  const closableAtStep = step + Math.max(ENTER_STEPS, msToSteps(Math.min(closeDelayMs, cap)))

  const ad: ActiveAd = {
    instanceId: spawn.instanceId,
    patternId: spawn.patternId,
    shellId: shell.id,
    spawnedAtStep: step,
    closableAtStep,
    lifecycle: 'entering',
    behaviors,
    view,
    blocksProgress: view.surface === 'fullscreen',
    threat: 0,
    mistakeCount: 0,
    creativeIndex: spawn.creativeIndex,
  }
  return { ad, effects }
}

export function mergeView(base: ViewState, patch: Partial<ViewState>): ViewState {
  const next: ViewState = { ...base, ...patch }
  if (patch.parts) {
    // parts はパッチ側の部位で置き換え、無いものは保持する
    const byPart = new Map(base.parts.map((p) => [p.part, p]))
    for (const p of patch.parts) byPart.set(p.part, p)
    next.parts = [...byPart.values()]
  }
  return next
}
