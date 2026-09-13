import type { ComboTag, PatternDefinition } from '@ad-jigoku/pattern-catalog'
import { describe, expect, it } from 'vitest'
import { DEFAULT_TUNING } from '../config'
import { noopPattern, noopRegistries, spawnAt, tick } from '../engine/flow.test'
import { createRun, step } from '../run'
import { baseConfig } from '../run.test'
import { ENTER_STEPS } from '../sim/spawn'
import type { Run, RunConfig, ScheduledSpawn } from '../state/types'
import { COMBO_DEFINITIONS, matchCombos } from './detect'

const tagged = (id: PatternDefinition['id'], tags: ComboTag[]): PatternDefinition => ({
  ...noopPattern,
  id,
  category: id.slice(0, id.indexOf('-')) as PatternDefinition['category'],
  game: { ...noopPattern.game!, comboTags: tags, patienceEffect: { onSpawn: 1, onMistake: 5, perSecondAlive: 0 } },
})

describe('敵側コンボ（タグ集合マッチ）', () => {
  it('GAME §10 の 4 つが定義どおりの日本語名で検出される', () => {
    expect(COMBO_DEFINITIONS.map((d) => d.name.ja)).toEqual(['閉じさせる気がない', '逃げても無駄', '何を押してるんだ', '広告地獄'])
    expect(matchCombos(['popup', 'fake-close', 'delayed-close']).map((d) => d.id)).toEqual(['no-intention-to-close'])
    expect(matchCombos(['sticky', 'popup', 'respawn']).map((d) => d.id)).toEqual(['no-escape'])
    expect(matchCombos(['fake-download', 'fake-play', 'invisible-hitbox']).map((d) => d.id)).toEqual(['what-are-you-pressing'])
    expect(matchCombos(['fullscreen', 'auto-sound', 'moving-close', 'respawn']).map((d) => d.id)).toEqual(['ad-hell'])
    expect(matchCombos(['popup', 'fake-close'])).toEqual([])
  })

  it('タグベースなので、同じタグを持つ新パターンを足しても定義を触らずに成立する', () => {
    const catalog = [tagged('INT-01', ['popup']), tagged('CLS-11', ['fake-close']), tagged('TIME-01', ['delayed-close']), tagged('CLS-99', ['popup', 'fake-close', 'delayed-close'])]
    const sp = (patternId: PatternDefinition['id'], id: string): ScheduledSpawn => ({ ...spawnAt(1, id), patternId })
    const config: RunConfig = { ...baseConfig, catalog, device: 'desktop' }
    let run = createRun({ ...config, schedule: [sp('INT-01', 'a'), sp('CLS-11', 'b'), sp('TIME-01', 'c')] }, noopRegistries())
    run = tick(run)
    expect(run.state.combo.namedCombo).toBe('閉じさせる気がない')
    expect(run.state.combo.namedCombosSeen).toEqual(['閉じさせる気がない'])
    expect(run.state.log.some((l) => l.kind === 'combo' && l.detail === 'enemy:閉じさせる気がない')).toBe(true)
    // 新パターン 1 つで同じコンボ
    let solo = createRun({ ...config, schedule: [sp('CLS-99', 'z')] }, noopRegistries())
    solo = tick(solo)
    expect(solo.state.combo.namedCombo).toBe('閉じさせる気がない')
    // 閉じると解除
    solo = tick(solo, ENTER_STEPS)
    solo = step(solo, { t: 'point', target: { kind: 'ad', instanceId: 'z', part: 'close' } }).run
    solo = tick(solo)
    expect(solo.state.combo.namedCombo).toBeUndefined()
  })
})

describe('プレイヤー側コンボ（chain）と RAGE', () => {
  const catalog = [tagged('INT-01', ['popup'])]
  const config: RunConfig = { ...baseConfig, catalog, device: 'desktop' }
  const many = (n: number): ScheduledSpawn[] => Array.from({ length: n }, (_, i) => ({ ...spawnAt(1 + i * 20, `ad${i}`) }))

  function chainRun(n: number, reducedMotion = false): { run: Run; rageEffects: number[] } {
    let run = createRun({ ...config, schedule: many(n), accessibility: { ...baseConfig.accessibility, reducedMotion } }, noopRegistries())
    const rageEffects: number[] = []
    for (let i = 0; i < 20 * n + ENTER_STEPS + 5; i++) {
      const r = step(run, { t: 'tick' })
      run = r.run
      for (const e of r.effects) if (e.kind === 'rage') rageEffects.push(e.level)
      for (const ad of run.state.ads) if (ad.lifecycle === 'closable') run = step(run, { t: 'point', target: { kind: 'ad', instanceId: ad.instanceId, part: 'close' } }).run
    }
    return { run, rageEffects }
  }

  it('chain は連続成功で伸び、ミスで 0 に戻る。敵側コンボ名とは別物', () => {
    const { run } = chainRun(3)
    expect(run.state.combo.chain).toBe(3)
    expect(run.state.combo.bestChain).toBe(3)
    expect(run.state.combo.namedCombo).toBeUndefined() // popup 単独では敵側コンボは成立しない
    expect(run.state.score.comboBonus).toBe(DEFAULT_TUNING.SCORE_CHAIN_STEP * (1 + 2))
    let broken = createRun({ ...config, schedule: many(1) }, noopRegistries())
    broken = tick(broken, 1 + ENTER_STEPS)
    broken = step(broken, { t: 'point', target: { kind: 'ad', instanceId: 'ad0', part: 'cta' } }).run
    expect(broken.state.combo.chain).toBe(0)
  })

  it('RAGE は閾値で発動し、level に上限がある', () => {
    const n = DEFAULT_TUNING.RAGE_CHAIN_THRESHOLD * (DEFAULT_TUNING.RAGE_LEVEL_MAX + 3)
    const { run, rageEffects } = chainRun(n)
    expect(run.state.rage.active).toBe(true)
    expect(run.state.rage.level).toBe(DEFAULT_TUNING.RAGE_LEVEL_MAX)
    expect(Math.max(...rageEffects)).toBeLessThanOrEqual(DEFAULT_TUNING.RAGE_LEVEL_MAX)
    expect(run.state.log.some((l) => l.kind === 'rage')).toBe(true)
    const { run: low } = chainRun(DEFAULT_TUNING.RAGE_CHAIN_THRESHOLD - 1)
    expect(low.state.rage.active).toBe(false)
  })

  it('reducedMotion で演出 level は下がるが、スコアは変わらない（a11y が不利にならない）', () => {
    const n = DEFAULT_TUNING.RAGE_CHAIN_THRESHOLD * (DEFAULT_TUNING.RAGE_LEVEL_MAX + 1)
    const normal = chainRun(n, false)
    const reduced = chainRun(n, true)
    expect(Math.max(...reduced.rageEffects)).toBeLessThan(Math.max(...normal.rageEffects))
    expect(reduced.run.state.score).toEqual(normal.run.state.score)
    expect(reduced.run.state.rage.level).toBe(normal.run.state.rage.level)
  })
})
