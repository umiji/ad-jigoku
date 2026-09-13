import type { Registries } from '../sim/registries'
import type { RunConfig } from '../state/types'
import { createRecorder, type ReplayRecord } from './record'
import { STRATEGIES, type StrategyId } from './strategies'

export type SimulationResult = { record: ReplayRecord; summary: SimulationSummary }
export type SimulationSummary = {
  phase: string
  steps: number
  elapsedMs: number
  patience: number
  score: number
  culprit?: string
  mistakes: number
  bestChain: number
  namedCombos: string[]
  adsSeen: number
  hash: string
}

/** 戦略でヘッドレス実行し、ReplayRecord と要約を返す */
export function simulate(config: RunConfig, strategy: StrategyId, catalogVersion: string, options: { registries?: Registries; maxSteps?: number } = {}): SimulationResult {
  const rec = createRecorder(config, catalogVersion, options.registries)
  const maxSteps = options.maxSteps ?? 60 * 180
  const play = STRATEGIES[strategy]
  for (let tick = 0; tick < maxSteps && rec.run.state.phase === 'running'; tick++) {
    for (const intent of play(rec.run.state, tick)) {
      if (rec.run.state.phase !== 'running') break
      rec.apply(intent)
    }
    // 設問があれば読了後に正答する（optimal / naive）
    if ((strategy === 'optimal' || strategy === 'naive') && rec.run.state.progress.read >= rec.run.state.progress.total) {
      for (const q of config.questions ?? []) if (!rec.run.state.answered[q.id]) rec.apply({ t: 'answer', questionId: q.id, choice: q.correctChoice })
    }
    if (rec.run.state.phase === 'running') rec.tick()
  }
  const record = rec.finish()
  const s = rec.run.state
  const summary: SimulationSummary = {
    phase: s.phase,
    steps: s.step,
    elapsedMs: Math.round(s.elapsedMs),
    patience: Math.round(s.patience * 10) / 10,
    score: s.score.total,
    ...(s.culprit ? { culprit: s.culprit } : {}),
    mistakes: Object.values(s.mistakes).reduce((a, b) => a + b, 0),
    bestChain: s.combo.bestChain,
    namedCombos: s.combo.namedCombosSeen,
    adsSeen: s.log.filter((l) => l.kind === 'spawn').length,
    hash: record.finalStateHash,
  }
  return { record, summary }
}
