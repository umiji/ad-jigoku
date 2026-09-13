/**
 * CLI: `pnpm catalog:coverage`
 * どのパターンが game / detect / improve / escape / fixture facet を持つかを表で出す
 * （PATTERN_SCHEMA §2.1「黙って無視されるのではなく、カバレッジレポートに未実装として出る」）。
 *
 * 判定はデータのみ。実装の有無（Shell/Behavior/Detector の registry）は見ない。
 */
import { loadCatalog } from '../src/data'
import type { PatternDefinition } from '../src/schema/pattern'

const FACETS = ['game', 'detect', 'improve', 'escape', 'fixture'] as const
type Facet = (typeof FACETS)[number]

const MARK_PRESENT = '○'
const MARK_ABSENT = '—'
const NAME_WIDTH = 30

/** 全角を2桁として数える簡易幅計算（表がずれないようにするため） */
function displayWidth(text: string): number {
  let width = 0
  for (const ch of text) width += /[ -~｡-ﾟ]/.test(ch) ? 1 : 2
  return width
}

function pad(text: string, width: number): string {
  const short = displayWidth(text) <= width ? text : truncate(text, width)
  return short + ' '.repeat(Math.max(0, width - displayWidth(short)))
}

function truncate(text: string, width: number): string {
  let out = ''
  for (const ch of text) {
    if (displayWidth(out + ch) > width - 1) return `${out}…`
    out += ch
  }
  return out
}

function mark(pattern: PatternDefinition, facet: Facet): string {
  return pattern[facet] === undefined ? MARK_ABSENT : MARK_PRESENT
}

export function formatCoverage(catalog: readonly PatternDefinition[]): string {
  const sorted = [...catalog].sort((a, b) => a.id.localeCompare(b.id))
  const header = `${pad('ID', 8)}${pad('name', NAME_WIDTH)}${FACETS.map((f) => pad(f, 9)).join('')}`
  const lines = [header, '-'.repeat(displayWidth(header))]
  for (const p of sorted) {
    lines.push(`${pad(p.id, 8)}${pad(p.name.ja, NAME_WIDTH)}${FACETS.map((f) => pad(mark(p, f), 9)).join('')}`)
  }
  lines.push('-'.repeat(displayWidth(header)))
  const totals = FACETS.map((f) => pad(`${catalog.filter((p) => p[f] !== undefined).length}/${catalog.length}`, 9)).join('')
  lines.push(`${pad('TOTAL', 8)}${pad(`${catalog.length} patterns`, NAME_WIDTH)}${totals}`)
  return lines.join('\n')
}

const entry = process.argv[1] ?? ''
if (entry.endsWith('catalog-coverage.ts')) {
  console.log(formatCoverage(loadCatalog()))
}
