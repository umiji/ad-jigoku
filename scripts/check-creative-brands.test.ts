import { describe, expect, it } from 'vitest'
import { findBrandViolations, normalizeForBrandCheck, parseNgWordList } from '../packages/pattern-catalog/src/creative/ng-check'
import type { Creative } from '../packages/pattern-catalog/src/creative/schema'
import { formatViolations, readNgWords, runCreativeBrandCheck } from './check-creative-brands'

const NG = ['amazon', 'アマゾン', 'ヤマト運輸', 'ＰａｙＰａｙ', 'adsense']

const creative = (over: Partial<Creative>): Creative => ({
  id: 'cr-sale-0001',
  kind: 'sale',
  tags: ['urgent'],
  brand: 'ホゲホゲ商店',
  headline: '今だけ半額です',
  cta: '今すぐ確認',
  theme: 'popup',
  ...over,
})

describe('normalizeForBrandCheck', () => {
  it('全角英数を半角にして小文字化する（NFKC）', () => {
    expect(normalizeForBrandCheck('ａｍａｚｏｎ')).toBe('amazon')
    expect(normalizeForBrandCheck('AMAZON')).toBe('amazon')
  })

  it('空白と記号を落とす', () => {
    expect(normalizeForBrandCheck('a m a z o n')).toBe('amazon')
    expect(normalizeForBrandCheck('Amazon, Prime!')).toBe('amazonprime')
    expect(normalizeForBrandCheck('ア・マ・ゾ・ン')).toBe('アマゾン')
  })

  it('半角カタカナを全角にする', () => {
    expect(normalizeForBrandCheck('ｱﾏｿﾞﾝ')).toBe('アマゾン')
  })

  it('ひらがなをカタカナに寄せる', () => {
    expect(normalizeForBrandCheck('あまぞん')).toBe('アマゾン')
    expect(normalizeForBrandCheck('ぱいぱい')).toBe('パイパイ')
  })

  it('長音・繰り返し記号は残す（別語になるのを防ぐ）', () => {
    expect(normalizeForBrandCheck('コーヒー')).toBe('コーヒー')
  })
})

describe('findBrandViolations', () => {
  it('brand フィールドの実在ブランドを検出する', () => {
    const found = findBrandViolations([creative({ brand: 'Amazon' })], NG)
    expect(found).toEqual([{ id: 'cr-sale-0001', field: 'brand', term: 'amazon', value: 'Amazon' }])
  })

  it('カタカナ表記・全角表記・空白入りも検出する', () => {
    const cases = ['アマゾン', 'ａｍａｚｏｎ', 'amazon prime', 'ｱﾏｿﾞﾝ', 'あまぞん']
    for (const headline of cases) {
      expect(findBrandViolations([creative({ headline })], NG), headline).toHaveLength(1)
    }
  })

  it('body / cta / legal も検査する', () => {
    expect(findBrandViolations([creative({ body: 'ヤマト運輸より不在通知' })], NG)[0]?.field).toBe('body')
    expect(findBrandViolations([creative({ cta: 'PayPayで払う' })], NG)[0]?.field).toBe('cta')
    expect(findBrandViolations([creative({ legal: '※adsense 提供' })], NG)[0]?.field).toBe('legal')
  })

  it('無関係な架空語は落とさない', () => {
    const clean = [
      creative({ brand: 'ホゲホゲ銀行', headline: 'あなたにおすすめの案件', body: '量子スリッパが今だけ無料', legal: '※個人の感想です' }),
      creative({ id: 'cr-sale-0002', brand: 'アマノジャク堂', headline: 'ポイント10倍' }),
    ]
    expect(findBrandViolations(clean, NG)).toEqual([])
  })

  it('1 レコードに複数違反があれば全部返す', () => {
    const found = findBrandViolations([creative({ brand: 'Amazon', headline: 'アマゾン特売' })], NG)
    expect(found).toHaveLength(2)
  })

  it('NG リストが空なら何も検出しない', () => {
    expect(findBrandViolations([creative({ brand: 'Amazon' })], [])).toEqual([])
  })
})

describe('parseNgWordList', () => {
  it('version / updated / terms を検証する', () => {
    const list = parseNgWordList({ version: 1, updated: '2026-09-13', terms: ['amazon'] })
    expect(list.terms).toEqual(['amazon'])
  })

  it('壊れた JSON は投げる', () => {
    expect(() => parseNgWordList({ terms: 'amazon' })).toThrow()
    expect(() => parseNgWordList({ version: 1, updated: '2026-09-13', terms: [''] })).toThrow()
  })
})

describe('CLI', () => {
  it('リポジトリの NG リストは十分な件数があり、重複もソート崩れもない', () => {
    const { terms } = readNgWords(process.cwd().endsWith('scripts') ? '..' : '.')
    expect(terms.length).toBeGreaterThanOrEqual(150)
    expect(new Set(terms.map((t) => t.toLowerCase())).size).toBe(terms.length)
    expect([...terms].sort()).toEqual(terms)
  })

  it('実データは違反ゼロで exit 0', () => {
    expect(runCreativeBrandCheck(process.cwd().endsWith('scripts') ? '..' : '.')).toBe(0)
  })

  it('formatViolations はファイル / id / フィールド / 一致語を出す', () => {
    const text = formatViolations([{ file: 'data/creatives/sale.json', id: 'cr-sale-0001', field: 'brand', term: 'amazon', value: 'Amazon' }])
    expect(text).toContain('data/creatives/sale.json')
    expect(text).toContain('cr-sale-0001')
    expect(text).toContain('brand')
    expect(text).toContain('amazon')
  })
})
