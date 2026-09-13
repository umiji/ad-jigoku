import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { findBrandViolations, parseNgWordList } from '../src/creative/ng-check'
import { CREATIVE_KINDS, CREATIVE_TAGS, type Creative, type CreativeKind } from '../src/creative/schema'
import { filterCreatives, loadCreatives, selectCreative } from '../src/creative/selector'

/** TASK-013D / Q4: Creative の初期目標件数（README §7 に記録） */
const TARGET_TOTAL = 300
const MIN_PER_KIND = 15
const MIN_BRANDS = 40
const MIN_LEGAL_RATIO = 0.6

const NG_WORDS_FILE = fileURLToPath(new URL('../../../data/ng-words/brands.json', import.meta.url))

const creative = (id: string, kind: CreativeKind, tags: Creative['tags'], brand: string): Creative => ({
  id,
  kind,
  tags,
  brand,
  headline: 'テスト見出し',
  cta: '確認する',
  theme: 'popup',
})

describe('creative データ', () => {
  const creatives = loadCreatives()

  it('全 JSON が creativeSchema を満たし、初期目標件数以上ある', () => {
    expect(creatives.length).toBeGreaterThanOrEqual(TARGET_TOTAL)
  })

  it('id が全ファイルを通して一意', () => {
    const ids = creatives.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('id の kind 部分が kind フィールドと一致する', () => {
    for (const c of creatives) expect(c.id.startsWith(`cr-${c.kind}-`)).toBe(true)
  })

  it('全 kind が最低件数を満たす', () => {
    for (const kind of CREATIVE_KINDS) {
      expect(creatives.filter((c) => c.kind === kind).length, kind).toBeGreaterThanOrEqual(MIN_PER_KIND)
    }
  })

  it('架空ブランドが十分な数ある（既視感対策 / C4）', () => {
    expect(new Set(creatives.map((c) => c.brand)).size).toBeGreaterThanOrEqual(MIN_BRANDS)
  })

  it('legal（小さい注釈）が 60% 以上に付いている', () => {
    const withLegal = creatives.filter((c) => c.legal !== undefined).length
    expect(withLegal / creatives.length).toBeGreaterThanOrEqual(MIN_LEGAL_RATIO)
  })

  it('tags は統制語彙のみ', () => {
    const allowed = new Set<string>(CREATIVE_TAGS)
    for (const c of creatives) for (const t of c.tags) expect(allowed.has(t), `${c.id}: ${t}`).toBe(true)
  })

  it('URL / ドメインらしき文字列を含まない', () => {
    const forbidden = /https?:|www\.|\.com|\.co\.jp|\.net|\.jp\b/i
    for (const c of creatives) {
      const text = [c.brand, c.headline, c.body ?? '', c.cta, c.legal ?? ''].join(' ')
      expect(forbidden.test(text), `${c.id}: ${text}`).toBe(false)
    }
  })

  it('kind ごとの theme 配分が DESIGN.md §4 の役割に沿っている', () => {
    const themesOf = (kind: CreativeKind) => new Set(creatives.filter((c) => c.kind === kind).map((c) => c.theme))
    // download / finance は「危険・警告」役の色が主。notice は白い popup 面が主
    expect([...themesOf('download')].some((t) => t === 'danger' || t === 'warning')).toBe(true)
    expect([...themesOf('finance')].some((t) => t === 'danger' || t === 'warning')).toBe(true)
    expect(themesOf('notice').has('popup')).toBe(true)
    expect(themesOf('video').has('popupDark')).toBe(true)
  })

  it('実在ブランド NG ワードを含まない（DESIGN.md §3 MUST NOT 9）', () => {
    const ng = parseNgWordList(JSON.parse(readFileSync(NG_WORDS_FILE, 'utf8')) as unknown)
    expect(findBrandViolations(creatives, ng.terms)).toEqual([])
  })

  it('loadCreatives() はメモ化され、同一配列を返す', () => {
    expect(loadCreatives()).toBe(creatives)
  })
})

describe('filterCreatives', () => {
  const pool: Creative[] = [
    creative('cr-sale-0001', 'sale', ['urgent', 'prize'], 'ホゲ商店'),
    creative('cr-sale-0002', 'sale', ['urgent'], 'ピヨ商店'),
    creative('cr-video-0001', 'video', ['video', 'urgent'], 'ナントカ動画'),
  ]

  it('セレクタ未指定なら全件', () => {
    expect(filterCreatives(pool)).toHaveLength(3)
    expect(filterCreatives(pool, {})).toHaveLength(3)
  })

  it('kinds は「いずれかに一致」（∩）', () => {
    expect(filterCreatives(pool, { kinds: ['video'] }).map((c) => c.id)).toEqual(['cr-video-0001'])
    expect(filterCreatives(pool, { kinds: ['sale', 'video'] })).toHaveLength(3)
  })

  it('tags は「全部を持っている」（⊆）', () => {
    expect(filterCreatives(pool, { tags: ['urgent'] })).toHaveLength(3)
    expect(filterCreatives(pool, { tags: ['urgent', 'prize'] }).map((c) => c.id)).toEqual(['cr-sale-0001'])
  })

  it('kinds と tags は AND', () => {
    expect(filterCreatives(pool, { kinds: ['sale'], tags: ['video'] })).toHaveLength(3) // 0 件 → 全件フォールバック
  })

  it('0 件になったら全件にフォールバックする（空の広告を出さない）', () => {
    expect(filterCreatives(pool, { kinds: ['dating'] })).toHaveLength(3)
    expect(filterCreatives(pool, { tags: ['ranking'] })).toHaveLength(3)
  })

  it('空プールは空のまま（フォールバック先がない）', () => {
    expect(filterCreatives([], { kinds: ['sale'] })).toEqual([])
  })
})

describe('selectCreative', () => {
  const creatives = loadCreatives()

  it('同じ index なら常に同じ Creative（決定論）', () => {
    for (const index of [0, 1, 7, 4242, 999_999]) {
      expect(selectCreative(creatives, undefined, index)).toBe(selectCreative(creatives, undefined, index))
    }
  })

  it('JSON のファイル順・配列順に依存しない（id で安定ソートしてから引く）', () => {
    const shuffled = [...creatives].reverse()
    for (const index of [0, 3, 55, 12_345]) {
      expect(selectCreative(shuffled, undefined, index).id).toBe(selectCreative(creatives, undefined, index).id)
    }
  })

  it('index が変われば十分ばらける', () => {
    const picked = new Set(Array.from({ length: 120 }, (_, i) => selectCreative(creatives, undefined, i * 7).id))
    expect(picked.size).toBeGreaterThanOrEqual(100)
  })

  it('セレクタの範囲内から選ぶ', () => {
    for (let i = 0; i < 50; i++) {
      expect(selectCreative(creatives, { kinds: ['finance'] }, i).kind).toBe('finance')
    }
  })

  it('プール長を超える index は剰余で回る', () => {
    const pool = filterCreatives(creatives, { kinds: ['news'] })
    const n = pool.length
    expect(selectCreative(creatives, { kinds: ['news'] }, 3).id).toBe(selectCreative(creatives, { kinds: ['news'] }, 3 + n).id)
  })

  it('空配列を渡したら投げる（黙って undefined を返さない）', () => {
    expect(() => selectCreative([], undefined, 0)).toThrow()
  })

  it('負数・非整数の index も決定的に丸める', () => {
    expect(selectCreative(creatives, undefined, -1).id).toBe(selectCreative(creatives, undefined, creatives.length - 1).id)
    expect(selectCreative(creatives, undefined, 2.9).id).toBe(selectCreative(creatives, undefined, 2).id)
  })
})
