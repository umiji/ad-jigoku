import { describe, expect, it } from 'vitest'
import { DEFAULT_TUNING } from '../config'
import { STEP_MS } from '../core/clock'
import { createRun, step } from '../run'
import type { ScheduledSpawn } from '../state/types'
import { generateStage, LOAD_WINDOW_MS, type GenerateInput } from './generate'
import { fixtureRegistries, MINI_CATALOG, pattern } from '../testing/mini-catalog'
import { frictionOf, hasDismissalAffordance, isImplemented, satisfiesSafe01, type GamePattern } from './rules'
import { decodeSeedParams, encodeSeedParams } from './seed-url'
import type { StageDefinition } from './types'

const stage: StageDefinition = {
  id: 'test-stage',
  name: { ja: 'テスト' },
  templates: [
    { id: 'opener', roles: [{ role: 'interrupt', categories: ['INT', 'OBS'], difficulty: { min: 1, max: 2 } }], spacingMs: { min: 2000, max: 3000 } },
    { id: 'pair', roles: [{ role: 'interrupt', categories: ['INT', 'OBS'], difficulty: { min: 1, max: 2 } }, { role: 'pressure', categories: ['OBS', 'CLS'], difficulty: { min: 2, max: 3 } }], spacingMs: { min: 1500, max: 2500 } },
    { id: 'trap', roles: [{ role: 'interrupt', categories: ['INT'] }, { role: 'trap', categories: ['DEC', 'CLS'], difficulty: { min: 4, max: 5 } }, { role: 'wildcard' }], spacingMs: { min: 1000, max: 2000 } },
  ],
  encounterGapMs: { min: 2000, max: 4000 },
  targetDifficulty: { min: 2, max: 3.5 },
  durationMs: 60000,
  contentLength: 40,
  escalation: { startIntensity: 0, endIntensity: 0.5 },
}

const base = (seed: string, extra: Partial<GenerateInput> = {}): GenerateInput => ({
  stageDef: stage,
  catalog: MINI_CATALOG,
  registries: fixtureRegistries(),
  tuning: DEFAULT_TUNING,
  seed,
  device: 'desktop',
  ...extra,
})

const NEVER = ['ATT-02', 'LAY-01', 'CLS-13', 'TIME-02', 'OBS-05', 'DEC-04']

describe('generateStage — 決定性と多様性', () => {
  it('same seed → same ScheduledSpawn[]', () => {
    const a = generateStage(base('hell-42'))
    const b = generateStage(base('hell-42'))
    expect(a.spawns).toEqual(b.spawns)
    expect(a.templateIds).toEqual(['opener', 'pair', 'trap'])
  })

  it('100 seeds → duplicate rate < 5%', () => {
    const seen = new Map<string, number>()
    for (let i = 0; i < 100; i++) {
      const key = generateStage(base(`seed-${i}`)).spawns.map((s) => `${s.patternId}@${s.atStep}`).join('|')
      seen.set(key, (seen.get(key) ?? 0) + 1)
    }
    const duplicates = 100 - seen.size
    expect(duplicates).toBeLessThan(5)
  })

  it('never picks unimplemented / unsafe / over-friction / no-game patterns (AD-2, R2, R4, R6)', () => {
    for (let i = 0; i < 200; i++) {
      const r = generateStage(base(`s${i}`))
      for (const s of r.spawns) expect(NEVER, `seed s${i} picked ${s.patternId}`).not.toContain(s.patternId)
    }
  })

  it('R8: frame requirement excludes MOB-05 on mobile but allows it on desktop', () => {
    const mobileIds = new Set<string>()
    const desktopIds = new Set<string>()
    const wild: StageDefinition = { ...stage, templates: [{ id: 'w', roles: [{ role: 'wildcard' }, { role: 'wildcard' }, { role: 'wildcard' }], spacingMs: { min: 3000, max: 3000 } }], targetDifficulty: { min: 0, max: 5 } }
    for (let i = 0; i < 150; i++) {
      generateStage(base(`m${i}`, { stageDef: wild, device: 'mobile' })).spawns.forEach((s) => mobileIds.add(s.patternId))
      generateStage(base(`m${i}`, { stageDef: wild, device: 'desktop' })).spawns.forEach((s) => desktopIds.add(s.patternId))
    }
    expect(mobileIds.has('MOB-05')).toBe(false)
    expect(desktopIds.has('MOB-05')).toBe(true)
  })

  it('R3: incompatible pairs never appear together in one encounter', () => {
    const wild: StageDefinition = { ...stage, templates: [{ id: 'w', roles: [{ role: 'wildcard', categories: ['OBS'] }, { role: 'wildcard', categories: ['OBS'] }], spacingMs: { min: 500, max: 500 } }], targetDifficulty: { min: 0, max: 5 } }
    for (let i = 0; i < 100; i++) {
      const ids = generateStage(base(`inc${i}`, { stageDef: wild })).spawns.map((s) => s.patternId)
      expect(ids.includes('OBS-01') && ids.includes('OBS-03')).toBe(false)
    }
  })

  it('bakes Range params into concrete values (no re-roll at runtime)', () => {
    const r = generateStage(base('bake'))
    const delayed = r.spawns.find((s) => s.patternId === 'CLS-03' || s.patternId === 'INT-02' || s.patternId === 'DEC-02')
    if (delayed) {
      for (const b of Object.values(delayed.behaviors)) for (const v of Object.values(b!.params)) expect(typeof v).toBe('number')
    }
    for (const s of r.spawns) expect(Number.isInteger(s.atStep)).toBe(true)
  })

  it('forcedPatterns always appear (first interrupt role) and allowedPatterns restrict the pool', () => {
    for (let i = 0; i < 50; i++) {
      const r = generateStage(base(`f${i}`, { stageDef: { ...stage, forcedPatterns: ['CLS-03'] } }))
      expect(r.spawns[0]?.patternId).toBe('CLS-03')
      const only = generateStage(base(`a${i}`, { stageDef: { ...stage, allowedPatterns: ['INT-01', 'INT-02'], targetDifficulty: { min: 0, max: 5 } } }))
      for (const s of only.spawns) expect(['INT-01', 'INT-02']).toContain(s.patternId)
    }
  })

  it('COM patterns expand into their components spawned almost simultaneously', () => {
    const com: StageDefinition = { ...stage, templates: [{ id: 'c', roles: [{ role: 'finale', categories: ['COM'] }], spacingMs: { min: 1000, max: 1000 } }], targetDifficulty: { min: 0, max: 5 } }
    const r = generateStage(base('com', { stageDef: com }))
    expect(r.spawns.map((s) => s.patternId).sort()).toEqual(['INT-01', 'OBS-03'])
    expect(r.spawns.every((s) => s.role?.includes('COM-03'))).toBe(true)
    const steps = r.spawns.map((s) => s.atStep)
    expect(Math.abs(steps[0]! - steps[1]!) * STEP_MS).toBeLessThan(1000)
  })

  it('R5 / concurrency: never more than maxConcurrent spawns inside the load window; load stays within budget', () => {
    const dense: StageDefinition = { ...stage, templates: [{ id: 'd', roles: Array.from({ length: 6 }, () => ({ role: 'wildcard' as const })), spacingMs: { min: 0, max: 0 } }], targetDifficulty: { min: 0, max: 5 } }
    for (let i = 0; i < 30; i++) {
      const r = generateStage(base(`dense${i}`, { stageDef: dense, device: 'mobile' }))
      const sorted = [...r.spawns].sort((a, b) => a.atStep - b.atStep)
      for (let k = 0; k < sorted.length; k++) {
        const t = sorted[k]!.atStep * STEP_MS
        // 出現から LOAD_WINDOW_MS の間は存在するとみなす → 時刻 t に存在する広告数 ≤ 上限
        const present = sorted.filter((s) => t - s.atStep * STEP_MS >= 0 && t - s.atStep * STEP_MS <= LOAD_WINDOW_MS + STEP_MS)
        expect(present.length).toBeLessThanOrEqual(DEFAULT_TUNING.MAX_CONCURRENT_ADS.mobile)
      }
      if (r.spawns.length >= 3) expect(r.warnings.some((w) => w.code === 'R5-delayed')).toBe(true)
    }
  })

  it('R7: 1000 seeds → difficulty within target band ± tolerance for > 97% (rest are relaxed with a warning)', () => {
    let outliers = 0
    for (let i = 0; i < 1000; i++) {
      const r = generateStage(base(`d${i}`))
      const inBand = r.difficulty >= stage.targetDifficulty.min - DEFAULT_TUNING.DIFFICULTY_TOLERANCE && r.difficulty <= stage.targetDifficulty.max + DEFAULT_TUNING.DIFFICULTY_TOLERANCE
      if (!inBand) {
        outliers++
        expect(r.warnings.some((w) => w.code === 'R7-relaxed')).toBe(true)
      }
    }
    expect(outliers / 1000).toBeLessThan(0.03)
  })

  it('SAFE-01: every generated spawn becomes closable within MAX_CLOSE_DELAY_MS when run through the engine (1000 seeds)', { timeout: 60000 }, () => {
    const regs = fixtureRegistries()
    for (let i = 0; i < 1000; i++) {
      const r = generateStage(base(`safe${i}`, { registries: regs }))
      let run = createRun({ seed: `safe${i}`, mode: 'story', stageId: stage.id, catalog: MINI_CATALOG, accessibility: { reducedMotion: false, pointerPrecision: 'fine', audioEnabled: false, extendedTimeouts: false }, device: 'desktop', schedule: r.spawns }, regs)
      const lastStep = Math.max(...r.spawns.map((s) => s.atStep)) + 1
      for (let k = 0; k < lastStep; k++) {
        run = step(run, { t: 'tick' }).run
        for (const ad of run.state.ads) {
          expect(Number.isFinite(ad.closableAtStep)).toBe(true)
          expect((ad.closableAtStep - ad.spawnedAtStep) * STEP_MS).toBeLessThanOrEqual(DEFAULT_TUNING.MAX_CLOSE_DELAY_MS + STEP_MS)
        }
        // 閉じられる広告は閉じて先に進む（同時上限で schedule が詰まらないように）
        for (const ad of run.state.ads) if (ad.lifecycle === 'closable') run = step(run, { t: 'point', target: { kind: 'ad', instanceId: ad.instanceId, part: 'close' } }).run
      }
    }
  })

  it('story templates are fixed: same 起承転結 (template order) with different contents across seeds', () => {
    const a = generateStage(base('story-a'))
    const b = generateStage(base('story-b'))
    expect(a.templateIds).toEqual(b.templateIds)
    // 役割スロット列（e<enc>-r<role>）は同じ。中身（パターン）だけ変わる。COM 展開で件数は変わりうる
    const slots = (r: typeof a) => [...new Set(r.spawns.map((s) => s.instanceId.split('-').slice(0, 2).join('-')))]
    expect(slots(a)).toEqual(slots(b))
    expect(a.spawns.map((s) => `${s.role}`.split(':')[0])).toEqual(expect.arrayContaining(b.spawns.map((s) => `${s.role}`.split(':')[0])))
    expect(a.spawns.map((s) => s.patternId)).not.toEqual(b.spawns.map((s) => s.patternId))
  })

  it('loose mode (endless) grows the template count per wave', () => {
    const w0 = generateStage(base('e', { mode: 'loose', wave: 0 }))
    const w2 = generateStage(base('e', { mode: 'loose', wave: 2 }))
    expect(w2.templateIds.length).toBeGreaterThan(w0.templateIds.length)
  })
})

describe('rendezvous hashing — seed の安定性', () => {
  it('adding one pattern changes ONLY the slots the new pattern wins; per-slot preservation ≈ 1 - 1/(n+1)', () => {
    // HRW の性質: 追加パターンが上位に入ったスロット以外は 1 ビットも変わらない。
    // 「seed 全体の > 80% が保存」はカタログが大きい（候補 n が多い）ときの目安。ミニカタログ（interrupt 候補 4 件）では
    // 1 スロットあたり 1/(4+1) = 20% が変わりうるので、ここでは per-slot の不変性を検証する。
    const extra = pattern({ id: 'INT-03', category: 'INT', difficulty: 2, shell: 'popup', behaviors: { spawn: { id: 'spawn:immediate' }, close: { id: 'close:instant' } }, comboTags: ['popup'] })
    let slotsTotal = 0
    let slotsPreserved = 0
    for (let i = 0; i < 200; i++) {
      const before = generateStage(base(`stab${i}`)).spawns
      const after = generateStage(base(`stab${i}`, { catalog: [...MINI_CATALOG, extra] })).spawns
      const slotOf = (id: string) => id.split('-').slice(0, 2).join('-')
      const beforeBySlot = new Map(before.map((s) => [slotOf(s.instanceId), s.patternId]))
      const afterBySlot = new Map(after.map((s) => [slotOf(s.instanceId), s.patternId]))
      for (const [slot, pid] of beforeBySlot) {
        slotsTotal++
        const next = afterBySlot.get(slot)
        if (next === pid) {
          slotsPreserved++
          continue
        }
        // 変わってよいのは (a) 新パターンが勝ったスロット、(b) 同じエンカウンター内で (a) が起きて
        // 「同一パターンは 1 エンカウンターに 1 回」の制約が外れた結果として別パターンが繰り上がったスロット
        const enc = slot.split('-')[0]
        const newPatternWonInEncounter = [...afterBySlot].some(([k, v]) => k.startsWith(`${enc}-`) && v === 'INT-03')
        expect(next === 'INT-03' || newPatternWonInEncounter, `seed stab${i} slot ${slot}: ${pid} → ${next}`).toBe(true)
      }
    }
    expect(slotsPreserved / slotsTotal).toBeGreaterThan(0.75)
  })
})

describe('rules helpers', () => {
  const regs = fixtureRegistries()
  const byId = (id: string) => MINI_CATALOG.find((p) => p.id === id) as GamePattern
  it('isImplemented / frictionOf / satisfiesSafe01', () => {
    expect(isImplemented(byId('INT-01'), regs)).toBe(true)
    expect(isImplemented(byId('ATT-02'), regs)).toBe(false)
    expect(isImplemented(byId('LAY-01'), regs)).toBe(false)
    expect(frictionOf(byId('CLS-13'), regs)).toBe(9)
    expect(satisfiesSafe01(byId('TIME-02'), DEFAULT_TUNING)).toBe(false)
    expect(satisfiesSafe01(byId('CLS-03'), DEFAULT_TUNING)).toBe(true)
    // R6b: 閉じる手段（close 部位 or correctInaction）
    expect(hasDismissalAffordance(byId('INT-01'), regs)).toBe(true)
    expect(hasDismissalAffordance(byId('DEC-02'), regs)).toBe(true)
    expect(hasDismissalAffordance(byId('DEC-04'), regs)).toBe(false)
  })
})

describe('seed URL', () => {
  it('round-trips and flags catalog version mismatch explicitly', () => {
    const q = encodeSeedParams({ seed: 'abc', stageId: 'stage-1', mode: 'story', catalogVersion: '0.1.0' })
    expect(q).toBe('s=abc&st=stage-1&m=story&cv=0.1.0')
    const ok = decodeSeedParams(`?${q}`, '0.1.0')
    expect(ok).toEqual({ ok: true, link: { seed: 'abc', stageId: 'stage-1', mode: 'story', catalogVersion: '0.1.0' }, catalogMismatch: false })
    const old = decodeSeedParams(q, '0.2.0')
    expect(old.ok && old.catalogMismatch).toBe(true)
    if (old.ok && old.catalogMismatch) expect(old.message).toContain('旧バージョン')
    expect(decodeSeedParams('?s=only', '0.1.0').ok).toBe(false)
  })
})

describe('spawns feed the engine', () => {
  it('a generated schedule spawns ads in order when ticked', () => {
    const regs = fixtureRegistries()
    const r = generateStage(base('feed', { registries: regs }))
    let run = createRun({ seed: 'feed', mode: 'story', stageId: stage.id, catalog: MINI_CATALOG, accessibility: { reducedMotion: false, pointerPrecision: 'fine', audioEnabled: false, extendedTimeouts: false }, device: 'desktop', schedule: r.spawns }, regs)
    const first: ScheduledSpawn = [...r.spawns].sort((a, b) => a.atStep - b.atStep)[0]!
    for (let k = 0; k < first.atStep; k++) run = step(run, { t: 'tick' }).run
    expect(run.state.ads[0]?.patternId).toBe(first.patternId)
  })
})
