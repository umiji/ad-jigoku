import type { Registries } from '../sim/registries'
import { createRun, ENGINE_VERSION, hashState, step, type StepResult } from '../run'
import type { Intent } from '../state/intent'
import type { Run, RunConfig } from '../state/types'

/**
 * ReplayRecord（GAME_ENGINE_DESIGN §11 / TASK-012）。
 * - `tick` は記録しない（step index で位置が決まる）
 * - `inputs[i] = [stepIndex, intent]`: 「state.step === stepIndex のとき、次の tick の前に適用した intent」
 * - `catalog` 本体は持たず `version.catalog` で照合する（再生側が同バージョンのカタログを渡す）
 * - `schedule` は config に含めない: 同じ seed / stage / registries から生成器が再現する。
 *   テストで schedule を直接注入した run は `config.schedule` ごと記録される（フィクスチャ用）
 */
export type ReplayConfig = Omit<RunConfig, 'catalog'>

export type ReplayRecord = {
  version: { engine: string; catalog: string }
  config: ReplayConfig
  inputs: [stepIndex: number, intent: Intent][]
  totalSteps: number
  finalStateHash: string
}

export type Recorder = {
  readonly run: Run
  /** intent を適用して記録する。tick は記録しない */
  apply(intent: Intent): StepResult
  tick(): StepResult
  finish(): ReplayRecord
}

export function createRecorder(config: RunConfig, catalogVersion: string, registries?: Registries): Recorder {
  let run = registries ? createRun(config, registries) : createRun(config)
  const inputs: [number, Intent][] = []
  const { catalog: _catalog, ...replayConfig } = config
  return {
    get run() {
      return run
    },
    apply(intent) {
      if (intent.t === 'tick') return this.tick()
      inputs.push([run.state.step, intent])
      const r = step(run, intent)
      run = r.run
      return r
    },
    tick() {
      const r = step(run, { t: 'tick' })
      run = r.run
      return r
    },
    finish() {
      return {
        version: { engine: ENGINE_VERSION, catalog: catalogVersion },
        config: replayConfig,
        inputs: [...inputs],
        totalSteps: run.state.step,
        finalStateHash: hashState(run),
      }
    },
  }
}
