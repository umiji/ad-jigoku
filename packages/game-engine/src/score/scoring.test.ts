import type { PatternDefinition } from '@ad-jigoku/pattern-catalog'
import { describe, expect, it } from 'vitest'
import { DEFAULT_TUNING } from '../config'
import { noopPattern, noopRegistries, spawnAt, tick } from '../engine/flow.test'
import { createRun, hashState, step } from '../run'
import { baseConfig } from '../run.test'
import { ENTER_STEPS } from '../sim/spawn'
import type { Run, RunConfig, ScheduledSpawn } from '../state/types'
import { scoreBreakdown, sumBreakdown } from './breakdown'
import { onClearPoints } from './on-clear'

const mk = (id: PatternDefinition['id'], severity: number, axes: [number, number, number], effect: { onSpawn: number; onMistake: number; perSecondAlive: number }, extra: Partial<NonNullable<PatternDefinition['game']>> = {}): PatternDefinition => ({
  ...noopPattern,
  id,
  category: id.slice(0, id.indexOf('-')) as PatternDefinition['category'],
  severity,
  game: { ...noopPattern.game!, ...extra, interactionComplexity: axes[0] as 1, uncertainty: axes[1] as 1, timePressure: axes[2] as 1, patienceEffect: effect },
})

const catalog: PatternDefinition[] = [
  mk('INT-01', 10, [1, 1, 2], { onSpawn: 5, onMistake: 10, perSecondAlive: 1 }),
  mk('ATT-02', 13, [2, 1, 3], { onSpawn: 5, onMistake: 5, perSecondAlive: 3 }),
  mk('CLS-11', 18, [3, 4, 3], { onSpawn: 5, onMistake: 25, perSecondAlive: 0 }),
]
const sp = (patternId: PatternDefinition['id'], atStep: number, instanceId: string): ScheduledSpawn => ({ ...spawnAt(atStep, instanceId), patternId })
const config: RunConfig = { ...baseConfig, catalog, contentTotalLines: 20, expectedDurationMs: 30000 }

function closeAd(run: Run, id: string): Run {
  return step(run, { t: 'point', target: { kind: 'ad', instanceId: id, part: 'close' } }).run
}
function readToClear(run: Run): Run {
  let r = run
  for (let i = 0; i < 60 * 30 && r.state.phase === 'running'; i++) {
    r = step(r, { t: 'read' }).run
    r = step(r, { t: 'tick' }).run
  }
  return r
}

describe('onClear は難易度 3 軸の平均から導出（severity 非依存）', () => {
  it('BASE × mean(ic, unc, tp)', () => {
    expect(onClearPoints(catalog[0], DEFAULT_TUNING)).toBe(Math.round(100 * (4 / 3)))
    expect(onClearPoints(catalog[2], DEFAULT_TUNING)).toBe(Math.round(100 * (10 / 3)))
    expect(onClearPoints(undefined, DEFAULT_TUNING)).toBe(100)
  })

  it('severity を書き換えてもプレイヤーのスコアは 1 点も変わらない（GAME §9.1 / 必須テスト）', () => {
    const play = (cat: PatternDefinition[]) => {
      let run = createRun({ ...config, catalog: cat, schedule: [sp('INT-01', 1, 'a'), sp('CLS-11', 1, 'b')] }, noopRegistries())
      run = tick(run, 1 + ENTER_STEPS)
      run = closeAd(run, 'a')
      run = closeAd(run, 'b')
      run = readToClear(run)
      return run.state.score
    }
    const normal = play(catalog)
    const inflated = play(catalog.map((p) => ({ ...p, severity: Math.min(20, p.severity + 5) })))
    const deflated = play(catalog.map((p) => ({ ...p, severity: 0 })))
    expect(normal.total).toBeGreaterThan(0)
    expect(inflated).toEqual(normal)
    expect(deflated).toEqual(normal)
  })
})

describe('triage bonus（Prioritization）', () => {
  const schedule = [sp('ATT-02', 1, 'sound'), sp('CLS-11', 1, 'fake')]
  it('threat の高い広告（自動音声）を先に処理すると bonus、偽×を先に処理すると付かない', () => {
    let good = createRun({ ...config, schedule }, noopRegistries())
    good = tick(good, 1 + ENTER_STEPS)
    good = closeAd(good, 'sound')
    expect(good.state.score.triageBonus).toBe(DEFAULT_TUNING.SCORE_TRIAGE_BONUS)
    expect(good.state.log.some((l) => l.kind === 'triage')).toBe(true)
    good = closeAd(good, 'fake') // 残り 1 件: 判断不要なので bonus なし
    expect(good.state.score.triageBonus).toBe(DEFAULT_TUNING.SCORE_TRIAGE_BONUS)

    let bad = createRun({ ...config, schedule }, noopRegistries())
    bad = tick(bad, 1 + ENTER_STEPS)
    bad = closeAd(bad, 'fake')
    expect(bad.state.score.triageBonus).toBe(0)
    bad = closeAd(bad, 'sound')
    expect(bad.state.score.triageBonus).toBe(0)
    expect(good.state.score.total).toBeGreaterThan(bad.state.score.total)
  })
})

describe('内訳・Clean Play・決定性', () => {
  it('内訳の合計が総得点と一致し、全項目が取得できる', () => {
    let run = createRun({ ...config, schedule: [sp('INT-01', 1, 'a')] }, noopRegistries())
    run = tick(run, 1 + ENTER_STEPS)
    run = closeAd(run, 'a')
    run = readToClear(run)
    expect(run.state.phase).toBe('cleared')
    const b = scoreBreakdown(run.state.score)
    expect(b.rows.map((r) => r.key)).toEqual(['completion', 'clearPoints', 'triageBonus', 'comboBonus', 'speedBonus', 'accuracyBonus', 'survivalBonus', 'damagePenalty', 'timePenalty'])
    expect(sumBreakdown(run.state.score)).toBe(run.state.score.total)
    expect(run.state.score.completion).toBe(DEFAULT_TUNING.SCORE_COMPLETION)
    expect(run.state.score.accuracyBonus).toBeGreaterThan(0)
  })

  it('Clean Play（ミス 0 + patience 満タン）で満額、ミスありなら 0', () => {
    let clean = createRun({ ...config, schedule: [] }, noopRegistries())
    clean = readToClear(clean)
    expect(clean.state.score.accuracyBonus).toBe(DEFAULT_TUNING.SCORE_CLEAN_PLAY_BONUS)

    let dirty = createRun({ ...config, schedule: [sp('INT-01', 1, 'a')] }, noopRegistries())
    dirty = tick(dirty, 1 + ENTER_STEPS)
    dirty = step(dirty, { t: 'point', target: { kind: 'ad', instanceId: 'a', part: 'cta' } }).run
    dirty = closeAd(dirty, 'a')
    dirty = readToClear(dirty)
    expect(dirty.state.score.accuracyBonus).toBe(0)
    expect(dirty.state.score.damagePenalty).toBe(DEFAULT_TUNING.SCORE_DAMAGE_PENALTY_PER_MISTAKE)
  })

  it('同一 seed / 同一入力で同一スコア・同一 hash', () => {
    const play = () => {
      let run = createRun({ ...config, schedule: [sp('INT-01', 1, 'a'), sp('ATT-02', 30, 'b')] }, noopRegistries())
      run = tick(run, 1 + ENTER_STEPS)
      run = closeAd(run, 'a')
      run = tick(run, 40)
      run = closeAd(run, 'b')
      return readToClear(run)
    }
    const a = play()
    const b = play()
    expect(a.state.score).toEqual(b.state.score)
    expect(hashState(a)).toBe(hashState(b))
  })
})

describe('戦略比較: optimal > naive > random-spam（GAME §24 Skill）', () => {
  // 「近い順」= 出現順（配列順）。各ウェーブで threat の低い罠（CLS-11）が先に出るので、naive は triage を外す
  const schedule = [sp('CLS-11', 1, 'f1'), sp('ATT-02', 1, 's1'), sp('CLS-11', 200, 'f2'), sp('INT-01', 200, 'p1'), sp('CLS-11', 400, 'f3'), sp('ATT-02', 400, 's2')]
  type Strategy = 'optimal' | 'naive' | 'spam'
  function play(strategy: Strategy): Run {
    let run = createRun({ ...config, schedule, contentTotalLines: 40 }, noopRegistries())
    let spamTick = 0
    for (let i = 0; i < 60 * 40 && run.state.phase === 'running'; i++) {
      run = step(run, { t: 'read' }).run
      run = step(run, { t: 'tick' }).run
      const active = run.state.ads.filter((a) => a.lifecycle !== 'closing')
      if (active.length === 0) continue
      if (strategy === 'spam') {
        // 何も考えず、見えている広告の部位を順繰りに連打する（偽× / CTA も押す）
        spamTick++
        const ad = active[spamTick % active.length]!
        const parts = ['close', 'fake-close', 'cta', 'close'] as const
        run = step(run, { t: 'point', target: { kind: 'ad', instanceId: ad.instanceId, part: parts[spamTick % parts.length]! } }).run
      } else if (strategy === 'naive') {
        // 閉じられるものを出現順（近い順）に閉じる。偽×は押さないが優先順位は考えない
        const closable = active.find((a) => a.lifecycle === 'closable')
        if (closable) run = step(run, { t: 'point', target: { kind: 'ad', instanceId: closable.instanceId, part: 'close' } }).run
      } else {
        // threat の高い順に閉じる
        const closable = [...active].filter((a) => a.lifecycle === 'closable').sort((a, b) => b.threat - a.threat)[0]
        if (closable) run = step(run, { t: 'point', target: { kind: 'ad', instanceId: closable.instanceId, part: 'close' } }).run
      }
    }
    return run
  }
  it('orders as optimal > naive > spam', () => {
    const optimal = play('optimal').state.score.total
    const naive = play('naive').state.score.total
    const spam = play('spam').state.score.total
    expect(optimal).toBeGreaterThan(naive)
    expect(naive).toBeGreaterThan(spam)
  })
})
