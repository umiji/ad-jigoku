/**
 * 状態ハッシュ（GAME_ENGINE_DESIGN.md §7.2 / TASK-005）。
 * - キー順を固定した安定シリアライズ
 * - 浮動小数は固定桁に丸めてプラットフォーム差を吸収
 * - FNV-1a 64bit（BigInt）
 */

export const FLOAT_DIGITS = 6

export function stableStringify(value: unknown): string {
  return serialize(value)
}

function serialize(value: unknown): string {
  if (value === null) return 'null'
  switch (typeof value) {
    case 'number':
      return serializeNumber(value)
    case 'string':
      return JSON.stringify(value)
    case 'boolean':
      return value ? 'true' : 'false'
    case 'undefined':
      return 'undefined'
    case 'bigint':
      return `${value.toString()}n`
    case 'object': {
      if (Array.isArray(value)) return `[${value.map(serialize).join(',')}]`
      const obj = value as Record<string, unknown>
      const keys = Object.keys(obj)
        .filter((k) => obj[k] !== undefined)
        .sort()
      return `{${keys.map((k) => `${JSON.stringify(k)}:${serialize(obj[k])}`).join(',')}}`
    }
    default:
      throw new TypeError(`hashState: シリアライズできない型 ${typeof value}`)
  }
}

function serializeNumber(n: number): string {
  if (Number.isNaN(n)) return 'NaN'
  if (!Number.isFinite(n)) return n > 0 ? 'Infinity' : '-Infinity'
  if (Number.isInteger(n)) return String(n)
  const rounded = Number(n.toFixed(FLOAT_DIGITS))
  // -0 と 0 を同一視
  return rounded === 0 ? '0' : String(rounded)
}

const FNV_OFFSET_64 = 0xcbf29ce484222325n
const FNV_PRIME_64 = 0x100000001b3n
const MASK_64 = 0xffffffffffffffffn

export function fnv1a64(input: string): string {
  let h = FNV_OFFSET_64
  for (let i = 0; i < input.length; i++) {
    h ^= BigInt(input.charCodeAt(i))
    h = (h * FNV_PRIME_64) & MASK_64
  }
  return h.toString(16).padStart(16, '0')
}

/** 任意の（プレーンな）オブジェクトの安定ハッシュ。GameState 全体（sim フィールド含む）に使う */
export function hashValue(value: unknown): string {
  return fnv1a64(stableStringify(value))
}
