import { z } from 'zod'
import { patternDefinitionSchema, type PatternDefinition } from './schema/pattern'

export class CatalogParseError extends Error {
  constructor(
    message: string,
    public readonly issues: readonly { patternId: string; path: string; message: string }[],
  ) {
    super(message)
    this.name = 'CatalogParseError'
  }
}

/**
 * 生の JSON（配列）を PatternDefinition[] に検証・変換する。
 * parse 失敗時は「どのパターンのどのフィールドか」が分かるエラーを投げる（TASK-003 要件 3）。
 * 純粋関数。ファイル読み込みは呼び出し側（bin/ や apps 側）の責務。
 */
export function parsePatterns(raw: unknown, source = '<memory>'): PatternDefinition[] {
  if (!Array.isArray(raw)) {
    throw new CatalogParseError(`${source}: パターンファイルは配列でなければならない`, [])
  }
  const issues: { patternId: string; path: string; message: string }[] = []
  const out: PatternDefinition[] = []
  raw.forEach((item, index) => {
    const result = patternDefinitionSchema.safeParse(item)
    if (result.success) {
      out.push(result.data)
      return
    }
    const patternId = typeof item === 'object' && item !== null && 'id' in item && typeof item.id === 'string' ? item.id : `#${index}`
    for (const issue of result.error.issues) {
      issues.push({ patternId, path: issue.path.map(String).join('.') || '(root)', message: issue.message })
    }
  })
  if (issues.length > 0) {
    const lines = issues.map((i) => `  - ${i.patternId} › ${i.path}: ${i.message}`)
    throw new CatalogParseError(`${source}: ${issues.length} 件のスキーマ違反\n${lines.join('\n')}`, issues)
  }
  return out
}

/** 複数ファイル分をまとめて parse し、ID 重複も検査する */
export function parseCatalog(files: readonly { source: string; raw: unknown }[]): PatternDefinition[] {
  const all = files.flatMap((f) => parsePatterns(f.raw, f.source))
  const seen = new Set<string>()
  const dupes: string[] = []
  for (const p of all) {
    if (seen.has(p.id)) dupes.push(p.id)
    seen.add(p.id)
  }
  if (dupes.length > 0) {
    throw new CatalogParseError(
      `重複した PatternId: ${dupes.join(', ')}`,
      dupes.map((id) => ({ patternId: id, path: 'id', message: '重複' })),
    )
  }
  return all
}

export function formatZodError(error: z.ZodError): string {
  return z.prettifyError(error)
}
