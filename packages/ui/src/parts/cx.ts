/**
 * className の連結。CSS Modules のクラスは `string | undefined` なので落として繋ぐ。
 * clsx を足すほどの需要はない（依存を増やさない）。
 */
export function cx(...classNames: readonly (string | false | null | undefined)[]): string {
  return classNames.filter((name): name is string => typeof name === 'string' && name.length > 0).join(' ')
}
