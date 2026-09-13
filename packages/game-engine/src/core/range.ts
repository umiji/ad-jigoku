import type { Range } from '@ad-jigoku/pattern-catalog'
import type { RngFn } from './rng'

/** 整数範囲 [min, max] から一様抽選（両端含む）。min > max は入力エラー */
export function pickFromRange(range: Range, next: RngFn): number {
  const lo = Math.ceil(range.min)
  const hi = Math.floor(range.max)
  if (lo > hi) throw new RangeError(`pickFromRange: 不正な Range ${range.min}..${range.max}`)
  if (lo === hi) return lo
  return lo + Math.floor(next() * (hi - lo + 1))
}

/** number | Range を確定値に焼き込む（Range は生成時に 1 回だけ抽選する / PATTERN_SCHEMA §3.4） */
export function resolveParam(value: number | Range, next: RngFn): number {
  return typeof value === 'number' ? value : pickFromRange(value, next)
}

/** 配列から一様に 1 要素を選ぶ */
export function pickOne<T>(items: readonly T[], next: RngFn): T {
  if (items.length === 0) throw new RangeError('pickOne: 空配列')
  const item = items[Math.floor(next() * items.length)]
  return item as T
}
