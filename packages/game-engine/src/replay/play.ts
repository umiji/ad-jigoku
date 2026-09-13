import type { PatternDefinition } from '@ad-jigoku/pattern-catalog'
import type { Registries } from '../sim/registries'
import { createRun, ENGINE_VERSION, hashState, step } from '../run'
import type { Run } from '../state/types'
import type { ReplayRecord } from './record'

export type PlayResult =
  | { ok: true; run: Run; hash: string; matches: boolean }
  | { ok: false; reason: 'engine-version-mismatch' | 'catalog-version-mismatch' | 'invalid-record'; message: string }

/**
 * 記録を再生する。バージョン不一致は**再生を拒否して理由を返す**（黙って違う結果を出さない）。
 * 再生後の `hash` と `record.finalStateHash` の一致を `matches` で返す。
 */
export function replay(record: ReplayRecord, deps: { catalog: readonly PatternDefinition[]; catalogVersion: string; registries?: Registries }): PlayResult {
  if (record.version.engine !== ENGINE_VERSION) {
    return { ok: false, reason: 'engine-version-mismatch', message: `このリプレイはエンジン ${record.version.engine} で記録されました（現在 ${ENGINE_VERSION}）。再生すると結果が変わるため拒否します。` }
  }
  if (record.version.catalog !== deps.catalogVersion) {
    return { ok: false, reason: 'catalog-version-mismatch', message: `このリプレイはカタログ ${record.version.catalog} で記録されました（現在 ${deps.catalogVersion}）。旧バージョンの地獄です。` }
  }
  if (!Array.isArray(record.inputs) || typeof record.totalSteps !== 'number') {
    return { ok: false, reason: 'invalid-record', message: 'inputs / totalSteps が不正' }
  }
  const config = { ...record.config, catalog: deps.catalog }
  let run = deps.registries ? createRun(config, deps.registries) : createRun(config)
  let cursor = 0
  const inputs = [...record.inputs].sort((a, b) => a[0] - b[0])
  while (run.state.step < record.totalSteps) {
    while (cursor < inputs.length && inputs[cursor]![0] === run.state.step) {
      run = step(run, inputs[cursor]![1]).run
      cursor++
    }
    if (cursor < inputs.length && inputs[cursor]![0] < run.state.step) {
      return { ok: false, reason: 'invalid-record', message: `stepIndex ${inputs[cursor]![0]} の入力が過去を指している` }
    }
    run = step(run, { t: 'tick' }).run
  }
  // 最終 step に残っている入力（totalSteps と同じ step の入力）
  while (cursor < inputs.length && inputs[cursor]![0] === run.state.step) {
    run = step(run, inputs[cursor]![1]).run
    cursor++
  }
  const hash = hashState(run)
  return { ok: true, run, hash, matches: hash === record.finalStateHash }
}
