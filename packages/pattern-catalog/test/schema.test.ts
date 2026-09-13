import { describe, expect, it } from 'vitest'
import {
  PATTERN_CATEGORY_CODES,
  categoryOf,
  detectFacetSchema,
  escapeFacetSchema,
  escapeTechniqueSchema,
  fixtureFacetSchema,
  gameFacetSchema,
  improveFacetSchema,
  isPatternId,
  patternDefinitionSchema,
  patternIdSchema,
} from '../src/schema'
import { SAMPLES_ALL_CATEGORIES, SAMPLE_CLS_11, SAMPLE_COM_12 } from './samples'

describe('PatternId', () => {
  it('accepts every category prefix', () => {
    for (const code of PATTERN_CATEGORY_CODES) expect(patternIdSchema.safeParse(`${code}-01`).success).toBe(true)
  })
  it('rejects unknown prefix or malformed ids', () => {
    for (const bad of ['XXX-01', 'CLS-1', 'CLS01', 'cls-01', 'CLS-011']) expect(patternIdSchema.safeParse(bad).success).toBe(false)
    expect(isPatternId('FOO-01')).toBe(false)
  })
  it('categoryOf extracts the prefix', () => {
    expect(categoryOf('TIME-03')).toBe('TIME')
  })
})

describe('PatternDefinition', () => {
  it('represents all 11 categories including CLS-11 and COM-12', () => {
    const codes = new Set(SAMPLES_ALL_CATEGORIES.map((p) => p.category))
    expect([...codes].sort()).toEqual([...PATTERN_CATEGORY_CODES].sort())
    for (const p of SAMPLES_ALL_CATEGORIES) {
      const r = patternDefinitionSchema.safeParse(p)
      expect(r.success, `${p.id}: ${r.success ? '' : JSON.stringify(r.error.issues)}`).toBe(true)
    }
    expect(patternDefinitionSchema.parse(SAMPLE_CLS_11).game?.behaviors?.close?.id).toBe('close:fake')
    expect(patternDefinitionSchema.parse(SAMPLE_COM_12).composedOf).toHaveLength(3)
  })

  it('rejects category/id mismatch', () => {
    const r = patternDefinitionSchema.safeParse({ ...SAMPLE_CLS_11, category: 'INT' })
    expect(r.success).toBe(false)
  })

  it('COM-* game facet has no shell/behaviors; standalone patterns require both', () => {
    const comWithShell = { ...SAMPLE_COM_12, game: { ...SAMPLE_COM_12.game!, shell: 'popup', behaviors: {} } }
    expect(patternDefinitionSchema.safeParse(comWithShell).success).toBe(false)
    const { shell: _s, ...noShell } = SAMPLE_CLS_11.game!
    expect(patternDefinitionSchema.safeParse({ ...SAMPLE_CLS_11, game: noShell }).success).toBe(false)
  })

  it('requires composedOf for COM-* and forbids it elsewhere', () => {
    expect(patternDefinitionSchema.safeParse({ ...SAMPLE_COM_12, composedOf: undefined }).success).toBe(false)
    expect(patternDefinitionSchema.safeParse({ ...SAMPLE_CLS_11, composedOf: ['INT-01', 'PER-01'] }).success).toBe(false)
  })

  it('rejects severity outside 0-20 and gameDifficulty outside 1-5', () => {
    expect(patternDefinitionSchema.safeParse({ ...SAMPLE_CLS_11, severity: 21 }).success).toBe(false)
    expect(patternDefinitionSchema.safeParse({ ...SAMPLE_CLS_11, severity: 3.5 }).success).toBe(false)
    expect(patternDefinitionSchema.safeParse({ ...SAMPLE_CLS_11, gameDifficulty: 6 }).success).toBe(false)
  })

  it('rejects self-reference in incompatibleWith', () => {
    const bad = { ...SAMPLE_CLS_11, game: { ...SAMPLE_CLS_11.game!, incompatibleWith: ['CLS-11'] } }
    expect(patternDefinitionSchema.safeParse(bad).success).toBe(false)
  })
})

describe('GameFacet', () => {
  const g = SAMPLE_CLS_11.game!
  it('accepts a complete facet', () => {
    expect(gameFacetSchema.safeParse(g).success).toBe(true)
  })
  it('rejects a behavior whose id does not belong to its slot (R1)', () => {
    const r = gameFacetSchema.safeParse({ ...g, behaviors: { close: { id: 'spawn:immediate' } } })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0]?.path).toEqual(['behaviors', 'close', 'id'])
  })
  it('rejects unknown slot, unknown combo tag, unknown player action', () => {
    expect(gameFacetSchema.safeParse({ ...g, behaviors: { teleport: { id: 'teleport:x' } } }).success).toBe(false)
    expect(gameFacetSchema.safeParse({ ...g, comboTags: ['not-a-tag'] }).success).toBe(false)
    expect(gameFacetSchema.safeParse({ ...g, playerActions: ['JUMP'] }).success).toBe(false)
  })
  it('rejects v0.1 fields (scoreEffect / simulatorId / mechanic are gone)', () => {
    // zod objects strip unknown keys by default; ensure they are not surfaced as data
    const parsed = gameFacetSchema.parse({ ...g, scoreEffect: { clear: 1 }, simulatorId: 'x' })
    expect('scoreEffect' in parsed).toBe(false)
    expect('simulatorId' in parsed).toBe(false)
  })
  it('accepts Range params and rejects inverted ranges', () => {
    expect(gameFacetSchema.safeParse({ ...g, behaviors: { close: { id: 'close:delayed', params: { delayMs: { min: 1000, max: 3000 } } } } }).success).toBe(true)
    expect(gameFacetSchema.safeParse({ ...g, behaviors: { close: { id: 'close:delayed', params: { delayMs: { min: 3000, max: 1000 } } } } }).success).toBe(false)
  })
})

describe('other facets', () => {
  it('DetectFacet validates signals and detectorId', () => {
    expect(detectFacetSchema.safeParse(SAMPLE_CLS_11.detect).success).toBe(true)
    expect(detectFacetSchema.safeParse({ ...SAMPLE_CLS_11.detect, signals: ['dom.magic'] }).success).toBe(false)
    expect(detectFacetSchema.safeParse({ ...SAMPLE_CLS_11.detect, signals: [] }).success).toBe(false)
  })
  it('ImproveFacet requires adFriendlyAlternative and at least one recommendation', () => {
    expect(improveFacetSchema.safeParse(SAMPLE_CLS_11.improve).success).toBe(true)
    expect(improveFacetSchema.safeParse({ ...SAMPLE_CLS_11.improve, adFriendlyAlternative: { ja: '' } }).success).toBe(false)
    expect(improveFacetSchema.safeParse({ ...SAMPLE_CLS_11.improve, recommendations: [] }).success).toBe(false)
  })
  it('EscapeFacet / EscapeTechnique enforce browserNative: true', () => {
    expect(escapeFacetSchema.safeParse(SAMPLE_CLS_11.escape).success).toBe(true)
    const t = { id: 'tap-backdrop', title: { ja: '背景をタップ' }, kind: 'immediate', steps: [{ ja: '広告の外側をタップする', device: 'both' }], browserNative: true }
    expect(escapeTechniqueSchema.safeParse(t).success).toBe(true)
    expect(escapeTechniqueSchema.safeParse({ ...t, browserNative: false }).success).toBe(false)
  })
  it('FixtureFacet requires expected.detected === true', () => {
    expect(fixtureFacetSchema.safeParse(SAMPLE_CLS_11.fixture).success).toBe(true)
    expect(fixtureFacetSchema.safeParse({ ...SAMPLE_CLS_11.fixture, expected: { detected: false } }).success).toBe(false)
  })
})
