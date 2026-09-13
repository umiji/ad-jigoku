import { describe, expect, it } from 'vitest'
import { CatalogParseError, parseCatalog, parsePatterns } from '../src/load'
import { areCompatible, byCategory, byGameDifficulty, resolveCompound, withDetectFacet, withGameFacet } from '../src/query'
import { SAMPLES_ALL_CATEGORIES, SAMPLE_CLS_11, SAMPLE_INT_01 } from './samples'

describe('parsePatterns', () => {
  it('parses valid data', () => {
    expect(parsePatterns(SAMPLES_ALL_CATEGORIES)).toHaveLength(SAMPLES_ALL_CATEGORIES.length)
  })
  it('reports pattern id and field path on failure', () => {
    const broken = [{ ...SAMPLE_CLS_11, severity: 99 }, { ...SAMPLE_INT_01, game: { ...SAMPLE_INT_01.game, warning: 'loud' } }]
    let err: unknown
    try {
      parsePatterns(broken, 'cls.json')
    } catch (e) {
      err = e
    }
    expect(err).toBeInstanceOf(CatalogParseError)
    const e = err as CatalogParseError
    expect(e.message).toContain('cls.json')
    expect(e.issues).toContainEqual(expect.objectContaining({ patternId: 'CLS-11', path: 'severity' }))
    expect(e.issues).toContainEqual(expect.objectContaining({ patternId: 'INT-01', path: 'game.warning' }))
  })
  it('rejects non-array input', () => {
    expect(() => parsePatterns({})).toThrow(CatalogParseError)
  })
  it('parseCatalog rejects duplicate ids across files', () => {
    expect(() => parseCatalog([{ source: 'a', raw: [SAMPLE_CLS_11] }, { source: 'b', raw: [SAMPLE_CLS_11] }])).toThrow(/重複/)
  })
})

describe('query', () => {
  const catalog = SAMPLES_ALL_CATEGORIES
  it('byCategory / byGameDifficulty / facets', () => {
    expect(byCategory(catalog, 'PER').map((p) => p.id)).toEqual(['PER-01', 'PER-02'])
    expect(byGameDifficulty(catalog, { min: 5, max: 5 }).map((p) => p.id)).toEqual(['CLS-11', 'PER-02', 'COM-12'])
    expect(withGameFacet(catalog).map((p) => p.id)).toEqual(['CLS-11', 'INT-01', 'COM-12'])
    expect(withDetectFacet(catalog).map((p) => p.id)).toEqual(['CLS-11'])
  })

  it('areCompatible is symmetric and safe-side when only one direction is declared', () => {
    const a = { ...SAMPLE_CLS_11, game: { ...SAMPLE_CLS_11.game!, incompatibleWith: ['INT-01' as const] } }
    const b = SAMPLE_INT_01
    expect(areCompatible(a, b)).toBe(false)
    expect(areCompatible(b, a)).toBe(false)
    expect(areCompatible(SAMPLE_CLS_11, SAMPLE_INT_01)).toBe(true)
    expect(areCompatible(SAMPLE_INT_01, SAMPLE_CLS_11)).toBe(true)
    expect(areCompatible(a, a)).toBe(false)
  })

  it('resolveCompound expands composedOf and errors on missing refs / cycles', () => {
    expect(resolveCompound(catalog, 'COM-12').map((p) => p.id)).toEqual(['PER-01', 'PER-02', 'INT-01'])
    expect(() => resolveCompound(catalog, 'COM-99')).toThrow(/未知/)
    const cyc = [
      { ...catalog.find((p) => p.id === 'COM-12')!, composedOf: ['COM-11' as const, 'PER-01' as const] },
      { ...catalog.find((p) => p.id === 'COM-12')!, id: 'COM-11' as const, composedOf: ['COM-12' as const, 'PER-01' as const] },
      ...catalog.filter((p) => p.id !== 'COM-12'),
    ]
    expect(() => resolveCompound(cyc, 'COM-12')).toThrow(/循環/)
  })
})
