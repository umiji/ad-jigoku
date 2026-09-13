/**
 * `pnpm check-creatives` — Creative データに実在ブランドが混入していないか検査する
 * （TASK-013D 要件 3 / DESIGN.md §3 MUST NOT 9 / CLAUDE.md §2.2）。
 *
 * このプロダクトは広告のダークパターンを批判する立場である。実在の広告主を名指しで
 * 茶化した瞬間に、批判ではなく attack になり、信用も法務も死ぬ。
 * だから「人が気をつける」ではなく **CI で落とす**。
 *
 * 判定ロジック（正規化と部分一致）は `@ad-jigoku/pattern-catalog` の
 * `src/creative/ng-check.ts` に置いてある。ここはファイル読み込みと終了コードだけの薄い CLI。
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import {
  findBrandViolations,
  parseNgWordList,
  type BrandViolation,
  type NgWordList,
} from '../packages/pattern-catalog/src/creative/ng-check'
import { parseCreatives } from '../packages/pattern-catalog/src/creative/selector'

const NG_WORDS_PATH = join('data', 'ng-words', 'brands.json')
const CREATIVES_DIR = join('packages', 'pattern-catalog', 'data', 'creatives')

/** どのファイルの何が引っかかったかを出せるように、違反にファイル名を添える */
export type LocatedViolation = BrandViolation & { file: string }

export function readNgWords(root: string): NgWordList {
  return parseNgWordList(JSON.parse(readFileSync(join(root, NG_WORDS_PATH), 'utf8')) as unknown)
}

/** data/creatives/*.json を 1 ファイルずつ読んで検査する（ファイル名を違反に残すため） */
export function collectViolations(root: string, terms: readonly string[]): LocatedViolation[] {
  const dir = join(root, CREATIVES_DIR)
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
  return files.flatMap((f) => {
    const raw = JSON.parse(readFileSync(join(dir, f), 'utf8')) as unknown
    const creatives = parseCreatives(raw, `${CREATIVES_DIR}/${f}`)
    return findBrandViolations(creatives, terms).map((v) => ({ ...v, file: `data/creatives/${f}` }))
  })
}

export function formatViolations(violations: readonly LocatedViolation[]): string {
  return violations.map((v) => `  ${v.file} › ${v.id}.${v.field}: "${v.term}" が含まれている（値: "${v.value}"）`).join('\n')
}

export function runCreativeBrandCheck(root: string): number {
  const { terms, version, updated } = readNgWords(root)
  const violations = collectViolations(root, terms)
  if (violations.length > 0) {
    console.error(`check-creatives: 実在ブランドの疑いが ${violations.length} 件（NG リスト v${version} / ${updated}）`)
    console.error(formatViolations(violations))
    console.error('\n架空の名前に書き換えること。誤検知なら data/ng-words/brands.json から語を外すのではなく、')
    console.error('コピーのほうを変える（NG リストを緩めるのは最後の手段）。')
    return 1
  }
  console.log(`check-creatives: OK（NG ワード ${terms.length} 件 / v${version} ${updated} と照合、違反 0 件）`)
  return 0
}

const entry = process.argv[1] ?? ''
if (entry.endsWith('check-creative-brands.ts')) {
  process.exit(runCreativeBrandCheck(process.cwd()))
}
