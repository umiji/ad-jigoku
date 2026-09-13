import { xmur3 } from '../core/rng'

/**
 * rendezvous (HRW) hashing（GAME_ENGINE_DESIGN.md §8.4）。
 * 候補ごとに w = hash(seed, stream, key, candidateId) を計算し、最大の候補を採る。
 * 配列インデックス抽選と違い、カタログにパターンを追加しても「新パターンの w が上位に入った場合」しか
 * 既存 seed の結果が変わらない。共有された Seed Challenge を壊さないための仕組み。
 */
export function rendezvousWeight(seed: string, stream: string, key: string, candidateId: string): number {
  return xmur3(`${seed}:${stream}:${key}:${candidateId}`)() / 4294967296
}

export function rendezvousPick<T>(
  candidates: readonly T[],
  idOf: (c: T) => string,
  seed: string,
  stream: string,
  key: string,
  /** 候補ごとの重み（>0）。重み付き rendezvous: w' = -ln(u) / weight（小さいほど優先） */
  weightOf: (c: T) => number = () => 1,
): T | undefined {
  let best: T | undefined
  let bestScore = Infinity
  for (const c of candidates) {
    const u = rendezvousWeight(seed, stream, key, idOf(c))
    const w = Math.max(1e-9, weightOf(c))
    const score = -Math.log(Math.max(u, 1e-12)) / w
    if (score < bestScore) {
      bestScore = score
      best = c
    }
  }
  return best
}
