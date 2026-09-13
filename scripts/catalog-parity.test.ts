import { describe, expect, it } from 'vitest'
import { parseCatalogMarkdown, parityReport } from './catalog-parity'
import type { PatternDefinition } from '../packages/pattern-catalog/src/schema/pattern'

const FIXTURE = `# AD_UX_PATTERN_CATALOG.md

## 1. Scoring Model

| Score | Severity | 意味 |
|---:|---|---|
| 0-3 | Trivial | ほぼ影響なし |

## A. Close / Dismiss Friction

| ID | Pattern | 定義 | Severity | Game Difficulty | Detection候補 |
|---|---|---|---:|---:|---|
| CLS-01 | Tiny Close | 閉じるボタンが極端に小さい | 5 | 2 | DOMサイズ/視覚検出 |
| CLS-11 | Fake Close | 閉じるように見える要素が広告クリック等を発生させる | 18 | 5 | Click outcome |

## K. Compound / Combo Patterns

| ID | Pattern | 定義 | Base Severity | Game Difficulty |
|---|---|---|---:|---:|
| COM-01 | Popup + Tiny Close | ポップアップ＋極小× | 14 | 4 |
`

const pattern = (id: string, category: string, severity: number, gameDifficulty: number): PatternDefinition =>
  ({
    id,
    category,
    name: { ja: 'テスト', en: 'Test' },
    definition: { ja: 'テストの定義' },
    severity,
    severitySource: 'hypothesis',
    gameDifficulty,
    dimensions: { interruption: 1 },
    ...(category === 'COM' ? { composedOf: ['CLS-01', 'CLS-11'] } : {}),
  }) as PatternDefinition

const JSON_CATALOG: PatternDefinition[] = [
  pattern('CLS-01', 'CLS', 5, 2),
  pattern('CLS-11', 'CLS', 18, 5),
  pattern('COM-01', 'COM', 14, 4),
]

describe('parseCatalogMarkdown', () => {
  it('extracts id / severity / gameDifficulty from the pattern tables', () => {
    // Arrange / Act
    const entries = parseCatalogMarkdown(FIXTURE)

    // Assert
    expect(entries).toEqual([
      { id: 'CLS-01', severity: 5, gameDifficulty: 2 },
      { id: 'CLS-11', severity: 18, gameDifficulty: 5 },
      { id: 'COM-01', severity: 14, gameDifficulty: 4 },
    ])
  })

  it('reads the COM table "Base Severity" column as severity', () => {
    const com = parseCatalogMarkdown(FIXTURE).find((e) => e.id === 'COM-01')
    expect(com?.severity).toBe(14)
  })

  it('ignores non-pattern tables such as the scoring model table', () => {
    const ids = parseCatalogMarkdown(FIXTURE).map((e) => e.id)
    expect(ids).not.toContain('0-3')
    expect(ids).toHaveLength(3)
  })

  it('throws when the same ID appears twice', () => {
    const dupe = FIXTURE + '\n| ID | Pattern | 定義 | Severity | Game Difficulty |\n|---|---|---|---:|---:|\n| CLS-01 | Dup | x | 1 | 1 |\n'
    expect(() => parseCatalogMarkdown(dupe)).toThrow(/CLS-01/)
  })

  it('throws when a severity cell is not a number', () => {
    const broken = FIXTURE.replace('| CLS-01 | Tiny Close | 閉じるボタンが極端に小さい | 5 |', '| CLS-01 | Tiny Close | 閉じるボタンが極端に小さい | ？ |')
    expect(() => parseCatalogMarkdown(broken)).toThrow(/CLS-01/)
  })
})

describe('parityReport', () => {
  it('reports no diff when Markdown and JSON agree', () => {
    const report = parityReport(JSON_CATALOG, parseCatalogMarkdown(FIXTURE))
    expect(report.fixes).toEqual([])
    expect(report.result.errors).toEqual([])
  })

  it('reports a mutated severity as "fix the JSON to the Markdown value"', () => {
    // Arrange: Markdown says 9, JSON still says 5
    const mutated = FIXTURE.replace('| CLS-01 | Tiny Close | 閉じるボタンが極端に小さい | 5 |', '| CLS-01 | Tiny Close | 閉じるボタンが極端に小さい | 9 |')

    // Act
    const report = parityReport(JSON_CATALOG, parseCatalogMarkdown(mutated))

    // Assert
    expect(report.fixes).toContain('Markdown が正: JSON の CLS-01.severity を 9 に直す')
    expect(report.result.errors.some((e) => e.rule === 'V-02')).toBe(true)
  })

  it('reports a mutated gameDifficulty', () => {
    const mutated = FIXTURE.replace('| CLS-11 | Fake Close | 閉じるように見える要素が広告クリック等を発生させる | 18 | 5 |', '| CLS-11 | Fake Close | 閉じるように見える要素が広告クリック等を発生させる | 18 | 3 |')
    const report = parityReport(JSON_CATALOG, parseCatalogMarkdown(mutated))
    expect(report.fixes).toContain('Markdown が正: JSON の CLS-11.gameDifficulty を 3 に直す')
  })

  it('reports a pattern that exists only in the Markdown', () => {
    const added = FIXTURE + '\n| ID | Pattern | 定義 | Severity | Game Difficulty |\n|---|---|---|---:|---:|\n| CLS-02 | Low-Contrast Close | 低コントラスト | 6 | 2 |\n'
    const report = parityReport(JSON_CATALOG, parseCatalogMarkdown(added))
    expect(report.fixes).toContain('Markdown が正: JSON に CLS-02 を追加する（severity=6 gameDifficulty=2）')
  })

  it('reports a pattern that exists only in the JSON', () => {
    const report = parityReport([...JSON_CATALOG, pattern('CLS-13', 'CLS', 10, 4)], parseCatalogMarkdown(FIXTURE))
    expect(report.fixes).toContain('Markdown が正: JSON の CLS-13 を削除する（Markdown に存在しない）')
  })
})
