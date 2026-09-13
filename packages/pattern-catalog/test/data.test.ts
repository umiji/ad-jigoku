import { describe, expect, it } from 'vitest'
import { loadCatalog } from '../src/data'
import { byId, resolveCompound, withDetectFacet, withGameFacet } from '../src/query'
import type { PatternCategoryCode, PatternId } from '../src/schema/common'
import { validateCatalog } from '../src/validate'
import catalogVersion from '../src/version.json'

/** AD_UX_PATTERN_CATALOG.md §2 のカテゴリ別件数（Markdown が正） */
const EXPECTED_COUNTS: Record<PatternCategoryCode, number> = {
  CLS: 14,
  INT: 10,
  OBS: 10,
  ACC: 8,
  DEC: 8,
  ATT: 7,
  TIME: 6,
  PER: 5,
  LAY: 6,
  MOB: 6,
  COM: 12,
}
const TOTAL = Object.values(EXPECTED_COUNTS).reduce((a, b) => a + b, 0)

/** GAME §23 の MVP セット。shell / behavior id は TASK-013A/B/C の実装契約なので固定する */
const MVP_GAME: { id: PatternId; shell?: string; behaviors: Record<string, string> }[] = [
  { id: 'INT-01', shell: 'popup', behaviors: { spawn: 'spawn:immediate', close: 'close:instant' } },
  { id: 'OBS-03', shell: 'stickyBanner', behaviors: { spawn: 'spawn:immediate', persist: 'persist:sticky' } },
  { id: 'CLS-01', shell: 'popup', behaviors: { spawn: 'spawn:immediate', close: 'close:tiny' } },
  { id: 'CLS-03', shell: 'popup', behaviors: { spawn: 'spawn:immediate', close: 'close:delayed' } },
  { id: 'CLS-05', shell: 'popup', behaviors: { spawn: 'spawn:immediate', close: 'close:moving' } },
  { id: 'CLS-11', shell: 'popup', behaviors: { spawn: 'spawn:immediate', close: 'close:fake' } },
  { id: 'ATT-01', shell: 'videoPlayer', behaviors: { spawn: 'spawn:delayed', attention: 'attention:autoplay-video' } },
  { id: 'ATT-02', shell: 'videoPlayer', behaviors: { spawn: 'spawn:delayed', attention: 'attention:auto-sound' } },
  { id: 'LAY-01', shell: 'inlineRect', behaviors: { spawn: 'spawn:delayed', instability: 'instability:shift' } },
  { id: 'OBS-01', shell: 'interstitial', behaviors: { spawn: 'spawn:immediate', surface: 'surface:fullscreen' } },
  { id: 'PER-01', shell: 'densityStack', behaviors: { spawn: 'spawn:immediate', persist: 'persist:respawn' } },
  { id: 'DEC-02', shell: 'fakeDownload', behaviors: { spawn: 'spawn:delayed', deception: 'deception:fake-download' } },
  { id: 'DEC-03', shell: 'fakePlay', behaviors: { spawn: 'spawn:delayed', deception: 'deception:fake-play' } },
  { id: 'PER-02', shell: 'densityStack', behaviors: { spawn: 'spawn:immediate', persist: 'persist:multi-layer' } },
  { id: 'OBS-09', shell: 'densityStack', behaviors: { spawn: 'spawn:immediate', persist: 'persist:multi-layer' } },
  { id: 'COM-03', behaviors: {} },
]

/** TASK-004 要件 4 の Phase 2 対象 */
const DETECT_PATTERNS: PatternId[] = [
  'OBS-01',
  'OBS-03',
  'OBS-04',
  'OBS-09',
  'CLS-01',
  'CLS-03',
  'INT-01',
  'INT-07',
  'ATT-01',
  'ATT-02',
  'LAY-01',
  'PER-01',
]

describe('loadCatalog', () => {
  it('parses every JSON file and returns the whole catalog', () => {
    expect(loadCatalog()).toHaveLength(TOTAL)
  })

  it('memoizes the parse (the second call returns the same array)', () => {
    expect(loadCatalog()).toBe(loadCatalog())
  })

  it('matches the per-category counts of the Markdown catalog', () => {
    const catalog = loadCatalog()
    for (const [code, count] of Object.entries(EXPECTED_COUNTS)) {
      expect({ code, count: catalog.filter((p) => p.category === code).length }).toEqual({ code, count })
    }
  })

  it('has unique IDs', () => {
    const ids = loadCatalog().map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('agrees with version.json patternCount', () => {
    expect(catalogVersion.patternCount).toBe(TOTAL)
  })

  it('gives every pattern at least one UX dimension', () => {
    const empty = loadCatalog().filter((p) => Object.keys(p.dimensions).length === 0)
    expect(empty.map((p) => p.id)).toEqual([])
  })

  it('marks every severity as a hypothesis (CATALOG 冒頭の但し書き)', () => {
    expect(loadCatalog().every((p) => p.severitySource === 'hypothesis')).toBe(true)
  })
})

describe('validateCatalog', () => {
  it('reports zero errors for the whole catalog', () => {
    const result = validateCatalog(loadCatalog())
    expect(result.errors).toEqual([])
  })

  it('reports no V-10 gameDifficulty deviation beyond ±1', () => {
    const result = validateCatalog(loadCatalog())
    expect(result.warnings.filter((w) => w.rule === 'V-10').map((w) => w.patternId)).toEqual([])
  })
})

describe('COM-* composedOf', () => {
  it('resolves every component to an existing pattern', () => {
    const catalog = loadCatalog()
    for (const com of catalog.filter((p) => p.category === 'COM')) {
      const parts = resolveCompound(catalog, com.id)
      expect({ id: com.id, resolved: parts.length > 0 }).toEqual({ id: com.id, resolved: true })
      expect(parts.every((part) => byId(catalog, part.id) !== undefined)).toBe(true)
    }
  })

  it('never composes a COM pattern out of itself', () => {
    const catalog = loadCatalog()
    for (const com of catalog.filter((p) => p.category === 'COM')) {
      expect(com.composedOf).not.toContain(com.id)
    }
  })
})

describe('MVP game facets (GAME §23)', () => {
  const catalog = loadCatalog()

  it('covers exactly the MVP set', () => {
    expect(withGameFacet(catalog).map((p) => p.id).sort()).toEqual(MVP_GAME.map((m) => m.id).sort())
  })

  it.each(MVP_GAME)('$id uses the agreed shell and behavior ids', ({ id, shell, behaviors }) => {
    const game = byId(catalog, id)?.game
    expect(game).toBeDefined()
    expect(game?.shell).toBe(shell)
    const actual = Object.fromEntries(Object.entries(game?.behaviors ?? {}).map(([slot, spec]) => [slot, spec?.id]))
    expect(actual).toEqual(behaviors)
  })

  it.each(MVP_GAME)('$id has a complete game facet', ({ id }) => {
    const game = byId(catalog, id)?.game
    expect(game?.playerActions.length).toBeGreaterThan(0)
    expect(game?.comboTags.length).toBeGreaterThan(0)
    expect(game?.education.ja.length).toBeGreaterThan(0)
    expect(game?.patienceEffect).toBeDefined()
    expect(game?.failureCondition).toBeDefined()
  })

  it.each(MVP_GAME)('$id has an improve facet with an ad-friendly alternative (V-09)', ({ id }) => {
    const improve = byId(catalog, id)?.improve
    expect(improve?.recommendations.length).toBeGreaterThan(0)
    expect(improve?.adFriendlyAlternative.ja.trim().length).toBeGreaterThan(0)
  })

  it('keeps incompatibleWith symmetric', () => {
    for (const p of withGameFacet(catalog)) {
      for (const other of p.game.incompatibleWith) {
        expect(byId(catalog, other)?.game?.incompatibleWith).toContain(p.id)
      }
    }
  })
})

describe('detect facets (Phase 2)', () => {
  const catalog = loadCatalog()

  it('covers exactly the Phase 2 set', () => {
    expect(withDetectFacet(catalog).map((p) => p.id).sort()).toEqual([...DETECT_PATTERNS].sort())
  })

  it('uses deterministic, score-contributing detectors only', () => {
    for (const p of withDetectFacet(catalog)) {
      expect({ id: p.id, confidence: p.detect.confidence, scoring: p.detect.scoreContributing }).toEqual({
        id: p.id,
        confidence: 'deterministic',
        scoring: true,
      })
      expect(p.detect.signals.length).toBeGreaterThan(0)
    }
  })

  it('gives every detector a unique id', () => {
    const ids = withDetectFacet(catalog).map((p) => p.detect.detectorId)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
