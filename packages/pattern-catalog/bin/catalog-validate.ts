/**
 * CLI: `pnpm catalog:validate`
 * data/patterns/*.json を読み、zod parse + V-01..V-14（データ単体で検査可能なもの）を実行する。
 * 実装の存在確認（V-05/06/07/13）は registry を持つ側（game-engine のテスト）で行う。
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { parseCatalog, CatalogParseError } from '../src/load'
import { formatValidation, validateCatalog } from '../src/validate'
import { escapeTechniqueSchema } from '../src/schema/escape'

const pkgRoot = resolve(import.meta.dirname, '..')
const dataDir = join(pkgRoot, 'data', 'patterns')
const verbose = process.argv.includes('--verbose')

const files = existsSync(dataDir)
  ? readdirSync(dataDir)
      .filter((f) => f.endsWith('.json'))
      .sort()
  : []

try {
  const catalog = parseCatalog(files.map((f) => ({ source: `data/patterns/${f}`, raw: JSON.parse(readFileSync(join(dataDir, f), 'utf8')) })))

  const techniquesFile = join(pkgRoot, 'data', 'escape-techniques.json')
  const escapeTechniques = existsSync(techniquesFile)
    ? new Set((JSON.parse(readFileSync(techniquesFile, 'utf8')) as unknown[]).map((t) => escapeTechniqueSchema.parse(t).id))
    : undefined

  const result = validateCatalog(catalog, escapeTechniques ? { impl: { escapeTechniques } } : {})
  const text = formatValidation(result, { includeInfo: verbose })
  if (text) console.log(text)
  console.log(`catalog:validate: ${catalog.length} patterns, ${result.errors.length} errors, ${result.warnings.length} warnings`)
  process.exit(result.errors.length > 0 ? 1 : 0)
} catch (e) {
  if (e instanceof CatalogParseError) {
    console.error(e.message)
    process.exit(1)
  }
  throw e
}
