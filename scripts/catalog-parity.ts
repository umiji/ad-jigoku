/**
 * `pnpm catalog:parity` — Markdown ↔ JSON の整合検査（ADR-001 / V-01, V-02）。
 *
 * docs/requirements/AD_UX_PATTERN_CATALOG.md が人間の source of truth、
 * packages/pattern-catalog/data/patterns/*.json が機械の source of truth。
 * 乖離したら **Markdown が正**。このスクリプトは「JSON をどう直すか」を出力して exit 1 する。
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { CatalogParseError, parseCatalog } from '../packages/pattern-catalog/src/load'
import type { PatternDefinition } from '../packages/pattern-catalog/src/schema/pattern'
import { formatValidation, validateCatalog } from '../packages/pattern-catalog/src/validate'
import type { MarkdownCatalogEntry, ValidationResult } from '../packages/pattern-catalog/src/validate'

const PATTERN_ID_RE = /^(CLS|INT|OBS|ACC|DEC|ATT|TIME|PER|LAY|MOB|COM)-\d{2}$/
const SEVERITY_HEADERS = ['Severity', 'Base Severity']
const GAME_DIFFICULTY_HEADER = 'Game Difficulty'
const SEPARATOR_CELL_RE = /^:?-{2,}:?$/

type ColumnIndex = { id: number; severity: number; gameDifficulty: number }

/** `| a | b | c |` を ['a','b','c'] にする。テーブル行でなければ undefined */
function splitTableRow(line: string): string[] | undefined {
  const trimmed = line.trim()
  if (!trimmed.startsWith('|')) return undefined
  const body = trimmed.endsWith('|') ? trimmed.slice(1, -1) : trimmed.slice(1)
  return body.split('|').map((cell) => cell.trim())
}

/** パターン表のヘッダ行か判定し、必要な列位置を返す。他の表（Scoring Model 等）は undefined */
function readHeader(cells: readonly string[]): ColumnIndex | undefined {
  const id = cells.indexOf('ID')
  const severity = cells.findIndex((c) => SEVERITY_HEADERS.includes(c))
  const gameDifficulty = cells.indexOf(GAME_DIFFICULTY_HEADER)
  if (id < 0 || severity < 0 || gameDifficulty < 0) return undefined
  return { id, severity, gameDifficulty }
}

function toScore(raw: string | undefined, id: string, column: string): number {
  const value = Number(raw)
  if (raw === undefined || raw === '' || !Number.isFinite(value)) {
    throw new Error(`catalog-parity: ${id} の ${column} 列が数値でない: "${raw ?? ''}"`)
  }
  return value
}

/**
 * AD_UX_PATTERN_CATALOG.md §2 の全パターン表から {id, severity, gameDifficulty} を抽出する。
 * COM 表は Severity 列の見出しが "Base Severity" なので両方受け付ける。純粋関数（テスト対象）。
 */
export function parseCatalogMarkdown(markdown: string): MarkdownCatalogEntry[] {
  const entries: MarkdownCatalogEntry[] = []
  const seen = new Set<string>()
  let columns: ColumnIndex | undefined

  for (const line of markdown.split(/\r?\n/)) {
    const cells = splitTableRow(line)
    if (!cells) {
      columns = undefined
      continue
    }
    if (cells.every((c) => SEPARATOR_CELL_RE.test(c))) continue
    if (!columns) {
      columns = readHeader(cells)
      continue
    }
    const id = cells[columns.id] ?? ''
    if (!PATTERN_ID_RE.test(id)) continue
    if (seen.has(id)) throw new Error(`catalog-parity: Markdown に ID が重複している: ${id}`)
    seen.add(id)
    entries.push({
      id,
      severity: toScore(cells[columns.severity], id, 'Severity'),
      gameDifficulty: toScore(cells[columns.gameDifficulty], id, GAME_DIFFICULTY_HEADER),
    })
  }
  return entries
}

export type ParityReport = { result: ValidationResult; fixes: string[] }

/** V-01 / V-02 の差分を「JSON をどう直すか」に翻訳する。純粋関数（テスト対象） */
export function parityReport(catalog: readonly PatternDefinition[], markdown: readonly MarkdownCatalogEntry[]): ParityReport {
  const result = validateCatalog(catalog, { markdown })
  const byId = new Map(catalog.map((p) => [p.id as string, p]))
  const fixes: string[] = []

  for (const m of markdown) {
    const p = byId.get(m.id)
    if (!p) {
      fixes.push(`Markdown が正: JSON に ${m.id} を追加する（severity=${m.severity} gameDifficulty=${m.gameDifficulty}）`)
      continue
    }
    if (p.severity !== m.severity) fixes.push(`Markdown が正: JSON の ${m.id}.severity を ${m.severity} に直す`)
    if (p.gameDifficulty !== m.gameDifficulty) fixes.push(`Markdown が正: JSON の ${m.id}.gameDifficulty を ${m.gameDifficulty} に直す`)
  }

  const inMarkdown = new Set(markdown.map((m) => m.id))
  for (const p of catalog) {
    if (!inMarkdown.has(p.id)) fixes.push(`Markdown が正: JSON の ${p.id} を削除する（Markdown に存在しない）`)
  }
  return { result, fixes }
}

export function readJsonCatalog(dataDir: string): PatternDefinition[] {
  if (!existsSync(dataDir)) throw new Error(`catalog-parity: データディレクトリがない: ${dataDir}`)
  const files = readdirSync(dataDir)
    .filter((f) => f.endsWith('.json'))
    .sort()
  return parseCatalog(files.map((f) => ({ source: `data/patterns/${f}`, raw: JSON.parse(readFileSync(join(dataDir, f), 'utf8')) as unknown })))
}

export function runParity(root: string): number {
  const markdownFile = join(root, 'docs', 'requirements', 'AD_UX_PATTERN_CATALOG.md')
  const markdown = parseCatalogMarkdown(readFileSync(markdownFile, 'utf8'))
  const catalog = readJsonCatalog(join(root, 'packages', 'pattern-catalog', 'data', 'patterns'))
  const { result, fixes } = parityReport(catalog, markdown)

  if (fixes.length > 0) {
    console.error(`catalog:parity: Markdown ${markdown.length} 件 / JSON ${catalog.length} 件 — ${fixes.length} 件の乖離`)
    for (const fix of fixes) console.error(`  ${fix}`)
    const text = formatValidation(result)
    if (text) console.error(text)
    return 1
  }
  console.log(`catalog:parity: OK (${markdown.length} patterns, Markdown ↔ JSON 一致)`)
  return 0
}

const entry = process.argv[1] ?? ''
if (entry.endsWith('catalog-parity.ts')) {
  try {
    process.exit(runParity(process.cwd()))
  } catch (e) {
    if (e instanceof CatalogParseError) {
      console.error(e.message)
      process.exit(1)
    }
    throw e
  }
}
