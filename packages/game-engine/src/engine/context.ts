import type { PatternDefinition } from '@ad-jigoku/pattern-catalog'
import type { EngineTuning } from '../config'
import type { Rng } from '../core/rng'
import type { ActiveAd, GameState, Run } from '../state/types'
import type { SimContext } from '../sim/types'

/** 1 回の step() の間だけ生きる可変コンテキスト（RNG カーソル・効果の蓄積） */
export type StepEnv = {
  run: Run
  tuning: EngineTuning
  rng: Rng
  patternById: Map<string, PatternDefinition>
}

export function patternOf(env: StepEnv, ad: ActiveAd): PatternDefinition {
  const p = env.patternById.get(ad.patternId)
  if (!p) throw new Error(`step: カタログに無い PatternId "${ad.patternId}"`)
  return p
}

export function simContext(env: StepEnv, state: GameState, ad: ActiveAd): SimContext {
  return {
    rng: env.rng,
    a11y: state.a11y,
    tuning: env.tuning,
    step: state.step,
    elapsedMs: state.elapsedMs,
    spawnedAtStep: ad.spawnedAtStep,
    closableAtStep: ad.closableAtStep,
    lifecycle: ad.lifecycle,
    view: ad.view,
    pattern: patternOf(env, ad),
    instanceId: ad.instanceId,
  }
}
