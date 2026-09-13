import { describe, expect, it } from 'vitest'
import { computeGameDifficulty } from '../src/derived'
import type { Slot } from '../src/schema/game'
import { validateCatalog } from '../src/validate'
import { SAMPLES_ALL_CATEGORIES, SAMPLE_CLS_11, SAMPLE_COM_12, SAMPLE_INT_01 } from './samples'

const rules = (r: ReturnType<typeof validateCatalog>) => [...r.errors, ...r.warnings].map((i) => i.rule)

describe('validateCatalog V-01..V-14', () => {
  it('passes on the sample catalog (data-only rules)', () => {
    const r = validateCatalog(SAMPLES_ALL_CATEGORIES)
    expect(r.errors).toEqual([])
  })

  it('V-01: id set mismatch between Markdown and JSON', () => {
    const md = SAMPLES_ALL_CATEGORIES.map((p) => ({ id: p.id, severity: p.severity, gameDifficulty: p.gameDifficulty }))
    expect(validateCatalog(SAMPLES_ALL_CATEGORIES, { markdown: md }).errors).toEqual([])
    const missing = validateCatalog(SAMPLES_ALL_CATEGORIES, { markdown: [...md, { id: 'CLS-01', severity: 5, gameDifficulty: 2 }] })
    expect(rules(missing)).toContain('V-01')
    const extra = validateCatalog(SAMPLES_ALL_CATEGORIES, { markdown: md.slice(1) })
    expect(rules(extra)).toContain('V-01')
  })

  it('V-02: severity / gameDifficulty mismatch (Markdown が正)', () => {
    const md = SAMPLES_ALL_CATEGORIES.map((p) => ({ id: p.id, severity: p.id === 'CLS-11' ? 17 : p.severity, gameDifficulty: p.gameDifficulty }))
    const r = validateCatalog(SAMPLES_ALL_CATEGORIES, { markdown: md })
    expect(r.errors.map((e) => e.rule)).toEqual(['V-02'])
    expect(r.errors[0]?.message).toContain('Markdown が正')
  })

  it('V-03: composedOf reference must exist', () => {
    const r = validateCatalog([SAMPLE_COM_12])
    expect(rules(r)).toContain('V-03')
  })

  it('V-04: incompatibleWith must be symmetric', () => {
    const a = { ...SAMPLE_CLS_11, game: { ...SAMPLE_CLS_11.game!, incompatibleWith: ['INT-01' as const] } }
    expect(rules(validateCatalog([a, SAMPLE_INT_01]))).toContain('V-04')
    const b = { ...SAMPLE_INT_01, game: { ...SAMPLE_INT_01.game!, incompatibleWith: ['CLS-11' as const] } }
    expect(validateCatalog([a, b]).errors).toEqual([])
  })

  it('V-05 / V-13 / V-07: shell + behavior registries (injected)', () => {
    const shells = new Map<string, readonly Slot[]>([['popup', ['spawn', 'close', 'deception', 'hitbox']]])
    const behaviors = new Map<string, Slot>([
      ['spawn:immediate', 'spawn'],
      ['close:fake', 'close'],
      ['close:instant', 'close'],
    ])
    const ok = validateCatalog([SAMPLE_CLS_11, SAMPLE_INT_01], { impl: { shells, behaviors } })
    expect(ok.errors).toEqual([])

    const unknownShell = { ...SAMPLE_CLS_11, game: { ...SAMPLE_CLS_11.game!, shell: 'toast' } }
    expect(rules(validateCatalog([unknownShell, SAMPLE_INT_01], { impl: { shells, behaviors } }))).toContain('V-05')

    const unsupportedSlot = { ...SAMPLE_CLS_11, game: { ...SAMPLE_CLS_11.game!, behaviors: { ...SAMPLE_CLS_11.game!.behaviors, persist: { id: 'persist:sticky' } } } }
    const r = validateCatalog([unsupportedSlot, SAMPLE_INT_01], { impl: { shells, behaviors: new Map<string, Slot>([...behaviors, ['persist:sticky', 'persist']]) } })
    expect(rules(r)).toContain('V-13')

    const orphan = validateCatalog([SAMPLE_CLS_11, SAMPLE_INT_01], { impl: { shells: new Map<string, readonly Slot[]>([...shells, ['interstitial', ['spawn', 'surface']]]), behaviors } })
    expect(rules(orphan)).toContain('V-07')
  })

  it('V-06 / V-07: detector registry', () => {
    expect(rules(validateCatalog([SAMPLE_CLS_11], { impl: { detectors: new Set(['other']) } }))).toEqual(expect.arrayContaining(['V-06', 'V-07']))
    expect(validateCatalog([SAMPLE_CLS_11], { impl: { detectors: new Set(['fake-close-click-outcome']) } }).errors).toEqual([])
  })

  it('V-08: maxCloseDelayMsOverride must not exceed the global cap (SAFE-01)', () => {
    const r = validateCatalog([SAMPLE_COM_12, SAMPLE_INT_01], { maxCloseDelayMs: 5000 })
    expect(rules(r)).toContain('V-08')
  })

  it('V-09: adFriendlyAlternative must not be blank', () => {
    const p = { ...SAMPLE_INT_01, improve: { ...SAMPLE_CLS_11.improve!, adFriendlyAlternative: { ja: '   ' } } }
    expect(rules(validateCatalog([p]))).toContain('V-09')
  })

  it('V-10: derived gameDifficulty deviation > 1 warns (not error)', () => {
    // INT-01: axes (1,1,2), severity 10 → derived 1; catalog 2 → within ±1 → no warn
    expect(computeGameDifficulty(SAMPLE_INT_01)).toBe(1)
    const skewed = { ...SAMPLE_INT_01, gameDifficulty: 4 as const }
    const r = validateCatalog([skewed])
    expect(r.errors).toEqual([])
    expect(r.warnings.map((w) => w.rule)).toContain('V-10')
  })

  it('V-11: detect.signals must be collectable', () => {
    const r = validateCatalog([SAMPLE_CLS_11], { collectableSignals: new Set(['dom.boundingBoxes']) })
    expect(rules(r)).toContain('V-11')
  })

  it('V-12: hypothesis severity is surfaced as info', () => {
    expect(validateCatalog([SAMPLE_INT_01]).infos.map((i) => i.rule)).toContain('V-12')
  })

  it('V-14: escape techniques must exist', () => {
    const r = validateCatalog([SAMPLE_CLS_11], { impl: { escapeTechniques: new Set(['tap-backdrop']) } })
    expect(rules(r)).toContain('V-14')
    expect(validateCatalog([SAMPLE_CLS_11], { impl: { escapeTechniques: new Set(['tap-backdrop', 'browser-back-once']) } }).errors).toEqual([])
  })
})

describe('computeGameDifficulty', () => {
  it('derives 5 for CLS-11 and 5 for COM-12, undefined without game facet', () => {
    expect(computeGameDifficulty(SAMPLE_CLS_11)).toBe(5)
    expect(computeGameDifficulty(SAMPLE_COM_12)).toBe(5)
    expect(computeGameDifficulty({ ...SAMPLE_INT_01, game: undefined })).toBeUndefined()
  })
})
