import type { CreativeSelector } from '../schema/game'
import app from '../../data/creatives/app.json'
import dating from '../../data/creatives/dating.json'
import download from '../../data/creatives/download.json'
import finance from '../../data/creatives/finance.json'
import game from '../../data/creatives/game.json'
import health from '../../data/creatives/health.json'
import news from '../../data/creatives/news.json'
import notice from '../../data/creatives/notice.json'
import sale from '../../data/creatives/sale.json'
import subscription from '../../data/creatives/subscription.json'
import survey from '../../data/creatives/survey.json'
import video from '../../data/creatives/video.json'
import { creativeSchema, type Creative } from './schema'

/**
 * Creative の読み込みと抽選（TASK-013D / DECISIONS_v0.2 §1.4）。
 *
 * **ここに乱数はない。** エンジンがステージ生成時に `rng('creative')` で引いた
 * `creativeIndex`（0..999999）が `ScheduledSpawn` に焼かれていて（`stage/generate.ts`）、
 * UI はその index を持ってここに来る。実行中に引き直さないことで
 * 「同じ seed なら同じ広告」（決定論 / ADR-002）が壊れない。
 */

const CREATIVE_FILES: readonly { source: string; raw: unknown }[] = [
  { source: 'data/creatives/app.json', raw: app },
  { source: 'data/creatives/dating.json', raw: dating },
  { source: 'data/creatives/download.json', raw: download },
  { source: 'data/creatives/finance.json', raw: finance },
  { source: 'data/creatives/game.json', raw: game },
  { source: 'data/creatives/health.json', raw: health },
  { source: 'data/creatives/news.json', raw: news },
  { source: 'data/creatives/notice.json', raw: notice },
  { source: 'data/creatives/sale.json', raw: sale },
  { source: 'data/creatives/subscription.json', raw: subscription },
  { source: 'data/creatives/survey.json', raw: survey },
  { source: 'data/creatives/video.json', raw: video },
]

export class CreativeParseError extends Error {
  constructor(
    message: string,
    public readonly issues: readonly { creativeId: string; path: string; message: string }[],
  ) {
    super(message)
    this.name = 'CreativeParseError'
  }
}

/** 生 JSON（配列）を Creative[] にする。どのレコードのどのフィールドが悪いか分かる形で投げる */
export function parseCreatives(raw: unknown, source = '<memory>'): Creative[] {
  if (!Array.isArray(raw)) throw new CreativeParseError(`${source}: Creative ファイルは配列でなければならない`, [])
  const issues: { creativeId: string; path: string; message: string }[] = []
  const out: Creative[] = []
  raw.forEach((item, index) => {
    const result = creativeSchema.safeParse(item)
    if (result.success) {
      out.push(result.data)
      return
    }
    const creativeId =
      typeof item === 'object' && item !== null && 'id' in item && typeof item.id === 'string' ? item.id : `#${index}`
    for (const issue of result.error.issues) {
      issues.push({ creativeId, path: issue.path.map(String).join('.') || '(root)', message: issue.message })
    }
  })
  if (issues.length > 0) {
    const lines = issues.map((i) => `  - ${i.creativeId} › ${i.path}: ${i.message}`)
    throw new CreativeParseError(`${source}: ${issues.length} 件のスキーマ違反\n${lines.join('\n')}`, issues)
  }
  return out
}

/** 複数ファイルをまとめて parse し、id 重複も検査する */
export function parseCreativeFiles(files: readonly { source: string; raw: unknown }[]): Creative[] {
  const all = files.flatMap((f) => parseCreatives(f.raw, f.source))
  const seen = new Set<string>()
  const dupes: string[] = []
  for (const c of all) {
    if (seen.has(c.id)) dupes.push(c.id)
    seen.add(c.id)
  }
  if (dupes.length > 0) {
    throw new CreativeParseError(
      `重複した Creative id: ${dupes.join(', ')}`,
      dupes.map((id) => ({ creativeId: id, path: 'id', message: '重複' })),
    )
  }
  return all
}

let cached: Creative[] | undefined

/** 全 Creative を返す。zod parse は初回のみ（loadCatalog と同じ方針。ブラウザで動くよう静的 import） */
export function loadCreatives(): Creative[] {
  cached ??= parseCreativeFiles(CREATIVE_FILES)
  return cached
}

/** テスト用: メモ化を捨てる。プロダクションコードから呼ばない */
export function resetCreativeCache(): void {
  cached = undefined
}

/**
 * `CreativeSelector` で絞り込む。
 * - `kinds`: kind がそのどれかに一致（∩）
 * - `tags`: セレクタの tags を**全部**持っている（⊆）
 * - 条件なし → 全件
 * - 0 件になったら**全件にフォールバックする**。中身のない広告を出すくらいなら
 *   題材が合っていない広告を出すほうがマシ（プールが空のときだけ空を返す）。
 */
export function filterCreatives(creatives: readonly Creative[], selector?: CreativeSelector): Creative[] {
  const all = [...creatives]
  const kinds = selector?.kinds
  const tags = selector?.tags
  if ((kinds === undefined || kinds.length === 0) && (tags === undefined || tags.length === 0)) return all

  const matched = all.filter((c) => {
    if (kinds !== undefined && kinds.length > 0 && !kinds.includes(c.kind)) return false
    if (tags !== undefined && tags.length > 0 && !tags.every((t) => (c.tags as readonly string[]).includes(t))) return false
    return true
  })
  return matched.length > 0 ? matched : all
}

/**
 * `creativeIndex` から 1 件を決定論的に選ぶ。**純粋関数。乱数を引かない。**
 *
 * 並びは id の昇順に正規化してから剰余を取る。こうしておくと
 * 「JSON ファイルの並び順を変えただけで同じ seed のリプレイが変わる」事故が起きない。
 */
export function selectCreative(
  creatives: readonly Creative[],
  selector: CreativeSelector | undefined,
  creativeIndex: number,
): Creative {
  const pool = filterCreatives(creatives, selector).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  if (pool.length === 0) throw new Error('selectCreative: Creative プールが空。データが読めていない')
  if (!Number.isFinite(creativeIndex)) throw new Error(`selectCreative: creativeIndex が数値でない: ${creativeIndex}`)
  const n = pool.length
  const i = ((Math.trunc(creativeIndex) % n) + n) % n
  const picked = pool[i]
  if (picked === undefined) throw new Error(`selectCreative: index ${i} が範囲外（pool=${n}）`)
  return picked
}

/** 型だけ再輸出（selector を使う側が schema/game を直接触らなくていいように） */
export type { CreativeSelector }
