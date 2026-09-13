import acc from '../data/patterns/acc.json'
import att from '../data/patterns/att.json'
import cls from '../data/patterns/cls.json'
import com from '../data/patterns/com.json'
import dec from '../data/patterns/dec.json'
import int from '../data/patterns/int.json'
import lay from '../data/patterns/lay.json'
import mob from '../data/patterns/mob.json'
import obs from '../data/patterns/obs.json'
import per from '../data/patterns/per.json'
import time from '../data/patterns/time.json'
import { parseCatalog } from './load'
import type { PatternDefinition } from './schema/pattern'

/**
 * カタログ本体を静的 import で束ねる（TASK-004 要件 7）。
 * game-engine / apps/web は fs を使わずにカタログを読めなければならない（ブラウザで動く / ADR-002）。
 * ファイルの並びは data/patterns/*.json の ASCII 順。
 */
const CATALOG_FILES: readonly { source: string; raw: unknown }[] = [
  { source: 'data/patterns/acc.json', raw: acc },
  { source: 'data/patterns/att.json', raw: att },
  { source: 'data/patterns/cls.json', raw: cls },
  { source: 'data/patterns/com.json', raw: com },
  { source: 'data/patterns/dec.json', raw: dec },
  { source: 'data/patterns/int.json', raw: int },
  { source: 'data/patterns/lay.json', raw: lay },
  { source: 'data/patterns/mob.json', raw: mob },
  { source: 'data/patterns/obs.json', raw: obs },
  { source: 'data/patterns/per.json', raw: per },
  { source: 'data/patterns/time.json', raw: time },
]

let cached: PatternDefinition[] | undefined

/**
 * 全パターンを返す。zod parse は初回のみ（2回目以降は同一配列を返す）。
 * parse に失敗した場合は CatalogParseError を投げる（黙って部分的なカタログを返さない）。
 */
export function loadCatalog(): PatternDefinition[] {
  cached ??= parseCatalog(CATALOG_FILES)
  return cached
}

/** テスト用: メモ化を捨てる。プロダクションコードから呼ばない */
export function resetCatalogCache(): void {
  cached = undefined
}
