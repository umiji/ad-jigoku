import type { PatternCategoryCode, PatternId } from './schema/common'
import type { PatternDefinition } from './schema/pattern'

/** フィルタ・互換性判定 API（TASK-003 要件 4）。全て純粋関数。 */

export function byId(catalog: readonly PatternDefinition[], id: PatternId): PatternDefinition | undefined {
  return catalog.find((p) => p.id === id)
}

export function byCategory(catalog: readonly PatternDefinition[], code: PatternCategoryCode): PatternDefinition[] {
  return catalog.filter((p) => p.category === code)
}

export function byGameDifficulty(
  catalog: readonly PatternDefinition[],
  range: { min: number; max: number },
): PatternDefinition[] {
  return catalog.filter((p) => p.gameDifficulty >= range.min && p.gameDifficulty <= range.max)
}

export type WithGameFacet = PatternDefinition & { game: NonNullable<PatternDefinition['game']> }
export type WithDetectFacet = PatternDefinition & { detect: NonNullable<PatternDefinition['detect']> }

export function withGameFacet(catalog: readonly PatternDefinition[]): WithGameFacet[] {
  return catalog.filter((p): p is WithGameFacet => p.game !== undefined)
}

export function withDetectFacet(catalog: readonly PatternDefinition[]): WithDetectFacet[] {
  return catalog.filter((p): p is WithDetectFacet => p.detect !== undefined)
}

/**
 * `incompatibleWith` の双方向判定。どちらか一方が相手を挙げていれば非互換（V-04 は対称性を CI で強制するが、
 * 判定側は片方向でも安全側に倒す）。
 */
export function areCompatible(a: PatternDefinition, b: PatternDefinition): boolean {
  if (a.id === b.id) return false
  const aList = a.game?.incompatibleWith ?? []
  const bList = b.game?.incompatibleWith ?? []
  return !aList.includes(b.id) && !bList.includes(a.id)
}

/**
 * `composedOf` を再帰的に展開し、構成要素の PatternDefinition 群を返す（順序は出現順、重複除去）。
 * 参照先が存在しない場合はエラー（V-03 が CI で先に落とすが、実行時にも黙って無視しない）。
 */
export function resolveCompound(catalog: readonly PatternDefinition[], id: PatternId): PatternDefinition[] {
  const root = byId(catalog, id)
  if (!root) throw new Error(`resolveCompound: 未知の PatternId ${id}`)
  const out: PatternDefinition[] = []
  const seen = new Set<PatternId>()
  const visit = (p: PatternDefinition, trail: PatternId[]) => {
    for (const childId of p.composedOf ?? []) {
      if (trail.includes(childId)) throw new Error(`resolveCompound: 循環参照 ${[...trail, childId].join(' -> ')}`)
      const child = byId(catalog, childId)
      if (!child) throw new Error(`resolveCompound: ${p.id} の composedOf に未知の ${childId}`)
      if (!seen.has(child.id)) {
        seen.add(child.id)
        out.push(child)
      }
      visit(child, [...trail, childId])
    }
  }
  visit(root, [id])
  return out
}
