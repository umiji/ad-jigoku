import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { advance } from '../core/clock'
import { createRun, ENGINE_VERSION, hashState, step } from '../run'
import type { Intent } from '../state/intent'
import { fixtureRegistries, MINI_CATALOG } from '../testing/mini-catalog'
import { decodeReplay, encodeReplay } from './encode'
import { FIXTURE_CATALOG_VERSION, REPLAY_FIXTURE_CASES } from './fixture-cases'
import { replay } from './play'
import { createRecorder, type ReplayRecord } from './record'
import { simulate } from './simulate'
import { decodeSeedParams, encodeSeedParams } from '../stage/seed-url'

const deps = () => ({ catalog: MINI_CATALOG, catalogVersion: FIXTURE_CATALOG_VERSION, registries: fixtureRegistries() })
const fixturesDir = join(import.meta.dirname, '..', '..', 'test', 'fixtures', 'replays')

describe('記録 → 再生 → finalStateHash 一致', () => {
  it('round-trips a simulated run', () => {
    const { record } = simulate(REPLAY_FIXTURE_CASES[0]!.config, 'optimal', FIXTURE_CATALOG_VERSION, { registries: fixtureRegistries() })
    expect(record.inputs.every(([, i]) => i.t !== 'tick')).toBe(true) // tick は記録しない
    const r = replay(record, deps())
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.matches).toBe(true)
      expect(r.hash).toBe(record.finalStateHash)
      expect(r.run.state.phase).toBe('cleared')
    }
  })

  it('encode / decode round-trips and rejects garbage', () => {
    const { record } = simulate(REPLAY_FIXTURE_CASES[1]!.config, 'idle', FIXTURE_CATALOG_VERSION, { registries: fixtureRegistries(), maxSteps: 600 })
    const text = encodeReplay(record)
    const decoded = decodeReplay(text)
    expect(decoded.ok).toBe(true)
    if (decoded.ok) expect(decoded.record).toEqual(record)
    expect(decodeReplay('{"nope":1}').ok).toBe(false)
    expect(decodeReplay('not json').ok).toBe(false)
  })
})

describe('フィクスチャ回帰（CI 必須）: エンジン変更で結果が変わったら落ちる', () => {
  const files = readdirSync(fixturesDir).filter((f) => f.endsWith('.json'))
  it('has the 4 representative replays', () => {
    expect(files.sort()).toEqual(['clear-optimal.json', 'fail-fake-close.json', 'fail-patience-zero.json', 'high-combo.json'])
  })
  for (const file of files) {
    it(`${file} replays to the recorded hash`, () => {
      const record = JSON.parse(readFileSync(join(fixturesDir, file), 'utf8')) as ReplayRecord
      const r = replay(record, deps())
      expect(r.ok).toBe(true)
      if (r.ok) expect(r.hash, `${file}: 挙動が変わった。意図的なら pnpm --filter @ad-jigoku/game-engine replay:fixtures で更新する`).toBe(record.finalStateHash)
    })
  }
  it('a deliberate logic change (tuning override) is detected as a hash mismatch', () => {
    const record = JSON.parse(readFileSync(join(fixturesDir, 'clear-optimal.json'), 'utf8')) as ReplayRecord
    const tampered: ReplayRecord = { ...record, config: { ...record.config, overrides: { PATIENCE_RECOVERY_PER_CLEAN_CLEAR: 4 } } }
    const r = replay(tampered, deps())
    expect(r.ok && r.matches).toBe(false)
  })
  it('fixtures cover clear / patience-zero / fake-close / high combo', () => {
    const read = (f: string) => JSON.parse(readFileSync(join(fixturesDir, f), 'utf8')) as ReplayRecord
    const clear = replay(read('clear-optimal.json'), deps())
    const zero = replay(read('fail-patience-zero.json'), deps())
    const fake = replay(read('fail-fake-close.json'), deps())
    const combo = replay(read('high-combo.json'), deps())
    expect(clear.ok && clear.run.state.phase).toBe('cleared')
    expect(zero.ok && zero.run.state.phase).toBe('failed')
    expect(fake.ok && fake.run.state.mistakes['fake-close']).toBeGreaterThan(0)
    expect(combo.ok && combo.run.state.combo.bestChain).toBeGreaterThanOrEqual(8)
  })
})

describe('バージョン不一致は明確なエラーで拒否', () => {
  const { record } = simulate(REPLAY_FIXTURE_CASES[0]!.config, 'optimal', FIXTURE_CATALOG_VERSION, { registries: fixtureRegistries(), maxSteps: 300 })
  it('engine mismatch', () => {
    const r = replay({ ...record, version: { ...record.version, engine: '9.9.9' } }, deps())
    expect(r).toMatchObject({ ok: false, reason: 'engine-version-mismatch' })
    if (!r.ok) expect(r.message).toContain('9.9.9')
  })
  it('catalog mismatch', () => {
    const r = replay({ ...record, version: { ...record.version, catalog: 'other' } }, deps())
    expect(r).toMatchObject({ ok: false, reason: 'catalog-version-mismatch' })
    if (!r.ok) expect(r.message).toContain('旧バージョン')
  })
  it('current engine version is recorded', () => {
    expect(record.version.engine).toBe(ENGINE_VERSION)
  })
})

describe('seed URL から同じステージ構成が再現される', () => {
  it('createRun without schedule generates the same schedule for the same seed URL', () => {
    const q = encodeSeedParams({ seed: 'share-me', stageId: 'stage-1', mode: 'story', catalogVersion: FIXTURE_CATALOG_VERSION })
    const d = decodeSeedParams(q, FIXTURE_CATALOG_VERSION)
    expect(d.ok).toBe(true)
    if (!d.ok) return
    const mk = () => createRun({ seed: d.link.seed, stageId: d.link.stageId, mode: d.link.mode, catalog: MINI_CATALOG, accessibility: REPLAY_FIXTURE_CASES[0]!.config.accessibility, device: 'desktop' }, fixtureRegistries())
    const a = mk()
    const b = mk()
    expect(a.state.schedule.length).toBeGreaterThan(0)
    expect(a.state.schedule).toEqual(b.state.schedule)
    expect(hashState(a)).toBe(hashState(b))
  })
})

describe('60fps / 30fps どちらの宿主で記録しても同じ結果', () => {
  function hostLoop(frameDt: number): string {
    // 宿主: rAF 相当のループ。advance() が固定ステップ数を決め、intent は step index で適用する
    const rec = createRecorder(REPLAY_FIXTURE_CASES[0]!.config, FIXTURE_CATALOG_VERSION, fixtureRegistries())
    let acc = 0
    const TOTAL_STEPS = 1000
    while (rec.run.state.step < TOTAL_STEPS && rec.run.state.phase === 'running') {
      const r = advance(acc, frameDt)
      acc = r.acc
      for (let i = 0; i < r.steps && rec.run.state.step < TOTAL_STEPS; i++) {
        const intents: Intent[] = [{ t: 'read' }]
        const target = rec.run.state.ads.filter((a) => a.lifecycle === 'closable').sort((a, b) => b.threat - a.threat)[0]
        if (target) intents.push({ t: 'point', target: { kind: 'ad', instanceId: target.instanceId, part: 'close' } })
        for (const it of intents) rec.apply(it)
        rec.tick()
      }
    }
    return rec.finish().finalStateHash
  }
  it('same hash at 60fps and 30fps', () => {
    expect(hostLoop(1000 / 60)).toBe(hostLoop(1000 / 30))
  })
})

describe('step() は再生中も純粋', () => {
  it('replaying the same record twice yields identical runs', () => {
    const { record } = simulate(REPLAY_FIXTURE_CASES[3]!.config, 'optimal', FIXTURE_CATALOG_VERSION, { registries: fixtureRegistries(), maxSteps: 900 })
    const a = replay(record, deps())
    const b = replay(record, deps())
    expect(a.ok && b.ok && a.hash === b.hash).toBe(true)
    // step は入力 run を変更しない
    if (a.ok) {
      const before = hashState(a.run)
      step(a.run, { t: 'tick' })
      expect(hashState(a.run)).toBe(before)
    }
  })
})
