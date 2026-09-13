import { z } from 'zod'
import { CREATIVE_TEXT_FIELDS, type Creative, type CreativeTextField } from './schema'

/**
 * 実在ブランド混入検査（TASK-013D 要件 3 / DESIGN.md §3 MUST NOT 9）。
 *
 * 「このプロダクトは広告のダークパターンを批判する立場」であって、実在の広告主を茶化す立場ではない。
 * 実在のブランド名が 1 件でも紛れ込んだ時点で法務リスクと信用の問題になるので、
 * **人間のレビューではなく CI で機械的に落とす**（`pnpm check-creatives`）。
 *
 * ロジックはここ（pattern-catalog 内）に置き、`scripts/check-creative-brands.ts` は
 * ファイル読み込みと終了コードだけを持つ薄い CLI にする。純粋関数なのでテストしやすい。
 */

/** ひらがな（U+3041..U+3096）→ カタカナ。表記ゆれ「あまぞん」を「アマゾン」に寄せる */
const HIRAGANA_RE = /[ぁ-ゖ]/g
/** 空白・句読点・記号。「ア・マ・ゾ・ン」「a m a z o n」のような分割回避を潰す */
const NOISE_RE = /[\s\p{P}\p{S}\p{C}]/gu

/**
 * NG 判定用の正規化。両辺（NG ワード / Creative のテキスト）に同じものを掛ける。
 *
 * 1. NFKC — 全角英数 `ａｍａｚｏｎ` と半角カタカナ `ｱﾏｿﾞﾝ`（濁点結合含む）を正規形へ
 * 2. 小文字化 — `AMAZON` / `Amazon`
 * 3. ひらがな → カタカナ — `あまぞん`
 * 4. 空白・記号の除去 — `amazon prime` / `ア・マ・ゾ・ン`
 *
 * 長音記号 `ー`（Lm）と繰り返し記号は**落とさない**。落とすと「コーヒー」が「コヒ」になり
 * 無関係な語と衝突する誤検知の温床になるため。
 */
export function normalizeForBrandCheck(input: string): string {
  return input
    .normalize('NFKC')
    .toLowerCase()
    .replace(HIRAGANA_RE, (ch) => String.fromCodePoint((ch.codePointAt(0) ?? 0) + 0x60))
    .replace(NOISE_RE, '')
}

export type BrandViolation = {
  id: string
  field: CreativeTextField
  /** 一致した NG ワード（正規化後の形） */
  term: string
  /** 元の値。何を直せばいいか分かるように原文を返す */
  value: string
}

/**
 * Creative 群から NG ワードに部分一致するものを全部返す。純粋関数。
 * 「最初の 1 件で止める」ことはしない。1 回の CI 実行で全件直せるようにするため。
 */
export function findBrandViolations(creatives: readonly Creative[], ngWords: readonly string[]): BrandViolation[] {
  const terms = ngWords
    .map((w) => normalizeForBrandCheck(w))
    .filter((w) => w.length > 0)
  if (terms.length === 0) return []

  const violations: BrandViolation[] = []
  for (const creative of creatives) {
    for (const field of CREATIVE_TEXT_FIELDS) {
      const value = creative[field]
      if (value === undefined) continue
      const haystack = normalizeForBrandCheck(value)
      for (const term of terms) {
        if (haystack.includes(term)) violations.push({ id: creative.id, field, term, value })
      }
    }
  }
  return violations
}

/** `data/ng-words/brands.json` の形。1 行 1 語で増やせる構造にしておく（TASK-013D 要件 3） */
export const ngWordListSchema = z.object({
  version: z.number().int().positive(),
  updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'updated は YYYY-MM-DD'),
  terms: z.array(z.string().min(1)).min(1),
})
export type NgWordList = z.infer<typeof ngWordListSchema>

export function parseNgWordList(raw: unknown): NgWordList {
  const result = ngWordListSchema.safeParse(raw)
  if (!result.success) throw new Error(`ng-words: 形式が不正\n${z.prettifyError(result.error)}`)
  return result.data
}
