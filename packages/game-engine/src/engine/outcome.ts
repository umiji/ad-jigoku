import type { Effect } from '../state/effect'
import type { ActiveAd, EncounterEvent, GameState, MistakeReason } from '../state/types'
import type { Outcome } from '../sim/types'
import type { StepEnv } from './context'
import { patternOf } from './context'
import { recoverOnCleanClear } from '../resource/patience'

/**
 * BehaviorResult.outcome をエンジンが解釈して state を更新する（TASK-007 要件 7）。
 * behavior は state を触らない。patience の増減・ログ・effect はここで一元管理する。
 * リソースの詳細（回復・threat・勝敗）は TASK-009 が resource/ に置き、ここから呼ぶ。
 */

export type Applied = { state: GameState; effects: Effect[] }

export function applyOutcome(env: StepEnv, state: GameState, ad: ActiveAd, outcome: Outcome): Applied {
  const effects: Effect[] = []
  const pattern = patternOf(env, ad)
  const pe = pattern.game?.patienceEffect ?? { onSpawn: 0, onMistake: 0, perSecondAlive: 0 }

  switch (outcome.kind) {
    case 'closable':
      return { state: updateAd(state, ad.instanceId, (a) => (a.lifecycle === 'closable' ? a : { ...a, lifecycle: 'closable', closableAtStep: Math.min(a.closableAtStep, state.step) })), effects }
    case 'closed':
    case 'smashed':
    case 'reported': {
      const kind = outcome.kind
      const log: EncounterEvent = { step: state.step, kind, patternId: ad.patternId, instanceId: ad.instanceId }
      if (kind === 'smashed') effects.push({ kind: 'smash', instanceId: ad.instanceId }, { kind: 'stamp', text: 'BLOCKED' }, { kind: 'sound', id: 'smash' })
      else if (kind === 'reported') effects.push({ kind: 'stamp', text: 'REPORTED' }, { kind: 'sound', id: 'close' })
      else effects.push({ kind: 'sound', id: 'close' })
      const next = updateAd(state, ad.instanceId, (a) => ({
        ...a,
        lifecycle: 'closing',
        blocksProgress: false,
        view: { ...a.view, motion: ['close-collapse'], parts: a.view.parts.map((p) => ({ ...p, enabled: false })) },
        // closing 状態は CLOSING_STEPS 後に除去される（tick 側）。closableAtStep を流用せず専用に記録
        closingAtStep: state.step,
      }))
      // ミスなしで処理できたら微量回復（GAME_ENGINE_DESIGN §9.2）
      return { state: recoverOnCleanClear({ ...next, log: [...next.log, log] }, ad, env.tuning), effects }
    }
    case 'mistake':
      return applyMistake(state, ad, outcome.reason, pe.onMistake, effects)
    case 'damage': {
      const delta = -Math.max(0, outcome.patience)
      return { state: withPatience(state, delta, { step: state.step, kind: 'damage', patternId: ad.patternId, instanceId: ad.instanceId, patienceDelta: delta }), effects }
    }
    case 'blockProgress':
      return { state: updateAd(state, ad.instanceId, (a) => ({ ...a, blocksProgress: outcome.active })), effects }
    case 'spawn': {
      // 派生スポーン（PER-01 respawn / PER-02 multi-layer）。スケジュールに積み、tick 側で通常どおり出現させる
      const seq = state.nextInstanceSeq + 1
      const src = state.schedule.find((s) => s.instanceId === ad.instanceId) ?? state.log.find((l) => l.instanceId === ad.instanceId)
      const pattern2 = env.patternById.get(outcome.patternId)
      if (!pattern2?.game?.shell || !pattern2.game.behaviors) return { state, effects }
      const atStep = state.step + Math.ceil((outcome.delayMs ?? 0) / (1000 / 60))
      const behaviors: Record<string, { id: string; params: Record<string, number> }> = {}
      for (const [slot, spec] of Object.entries(pattern2.game.behaviors)) {
        if (!spec) continue
        const params: Record<string, number> = {}
        for (const [k, v] of Object.entries(spec.params ?? {})) params[k] = typeof v === 'number' ? v : Math.round((v.min + v.max) / 2)
        behaviors[slot] = { id: spec.id, params }
      }
      void src
      const spawn = {
        instanceId: `${ad.instanceId}.${seq}`,
        atStep,
        patternId: outcome.patternId,
        shellId: pattern2.game.shell,
        behaviors,
        creativeIndex: ad.creativeIndex,
        parentInstanceId: ad.instanceId,
      }
      return { state: { ...state, nextInstanceSeq: seq, schedule: [...state.schedule, spawn] }, effects }
    }
  }
}

export function applyMistake(state: GameState, ad: ActiveAd | undefined, reason: MistakeReason, penalty: number, effects: Effect[]): Applied {
  const delta = -Math.max(0, penalty)
  effects.push({ kind: 'sound', id: 'error' })
  if (penalty >= 10) effects.push({ kind: 'shake', intensity: Math.min(1, penalty / 30) })
  const event: EncounterEvent = { step: state.step, kind: 'mistake', reason, patienceDelta: delta }
  if (ad) {
    event.patternId = ad.patternId
    event.instanceId = ad.instanceId
  }
  const mistakes = { ...state.mistakes, [reason]: state.mistakes[reason] + 1 }
  const withCount = ad ? updateAd(state, ad.instanceId, (a) => ({ ...a, mistakeCount: a.mistakeCount + 1 })) : state
  return { state: withPatience({ ...withCount, mistakes, combo: { ...withCount.combo, chain: 0 } }, delta, event), effects }
}

export function withPatience(state: GameState, delta: number, event?: EncounterEvent): GameState {
  const patience = Math.max(0, Math.min(state.patience + delta, 100))
  const log = event ? [...state.log, { ...event, patienceDelta: patience - state.patience }] : state.log
  return { ...state, patience, log }
}

export function updateAd(state: GameState, instanceId: string, f: (ad: ActiveAd) => ActiveAd): GameState {
  let changed = false
  const ads = state.ads.map((a) => {
    if (a.instanceId !== instanceId) return a
    const n = f(a)
    if (n !== a) changed = true
    return n
  })
  return changed ? { ...state, ads } : state
}
