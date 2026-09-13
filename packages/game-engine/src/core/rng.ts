/**
 * シード分割 RNG（GAME_ENGINE_DESIGN.md §6 / ADR-002）。
 *
 * - `xmur3(seed + ':' + stream)` で 32bit 初期状態を作り、`mulberry32` で列を生成する
 * - ストリームは互いに独立。**新しいストリームを追加しても既存ストリームの出力列は 1 ビットも変わらない**
 *   （ストリーム名だけからシード派生するため）。これが seed challenge を壊さないための要件の核心
 * - 状態は uint32 1 個。GameState に載せられるので、任意のスナップショットからリプレイできる
 */

export const RNG_STREAMS = ['stage', 'timing', 'placement', 'deception', 'creative', 'jitter'] as const
export type RngStream = (typeof RNG_STREAMS)[number]

/** ストリーム別の内部状態（uint32）。GameState に格納してハッシュ対象にする */
export type RngState = Readonly<Partial<Record<RngStream, number>>>

/** 0 以上 1 未満の一様乱数を返す */
export type RngFn = () => number
export type Rng = (stream: RngStream) => RngFn

/** xmur3: 文字列 → 32bit ハッシュ生成器 */
export function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h ^= h >>> 16
    return h >>> 0
  }
}

/** mulberry32 の 1 ステップ。状態 a（uint32）から (次の状態, 値) を返す純粋関数 */
export function mulberry32Step(a: number): { next: number; value: number } {
  const next = (a + 0x6d2b79f5) >>> 0
  let t = next
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296
  return { next, value }
}

/** ストリームの初期状態。seed とストリーム名だけで決まる */
export function initialStreamState(seed: string, stream: RngStream): number {
  return xmur3(`${seed}:${stream}`)()
}

/**
 * 可変カーソル付き RNG。`step()` の中で「状態をローカルにコピー → 引く → 新 state に書き戻す」ために使う。
 * ストリームの状態は遅延初期化。未使用ストリームは state に現れない（＝追加しても既存 hash が変わらない）。
 */
export function createRngCursor(seed: string, state: RngState): { rng: Rng; snapshot(): RngState } {
  const local: Partial<Record<RngStream, number>> = { ...state }
  const rng: Rng = (stream) => () => {
    const current = local[stream] ?? initialStreamState(seed, stream)
    const { next, value } = mulberry32Step(current)
    local[stream] = next
    return value
  }
  return { rng, snapshot: () => ({ ...local }) }
}

/**
 * 単独利用向け（生成器やテスト）。閉包が内部状態を進める。
 * GameState に載せる必要がない箇所だけで使うこと。
 */
export function makeRng(seed: string): Rng {
  return createRngCursor(seed, {}).rng
}
