import { FRAME_CAPABILITIES_BY_DEVICE } from '@ad-jigoku/game-engine'
import type { FrameCapability } from '@ad-jigoku/pattern-catalog'

/**
 * 端末プロファイル別の偽ブラウザ機能（DECISIONS_v0.2 §2.3 / TASK-014A 要件 2）。
 * 生成器の R8 はエンジン側の同じ表（stage/rules.ts）を使う。ここは UI が「何を描くか」を決めるための参照。
 */
export const FRAME_CAPABILITIES = FRAME_CAPABILITIES_BY_DEVICE

export function hasCapability(device: 'mobile' | 'desktop', cap: FrameCapability): boolean {
  return FRAME_CAPABILITIES[device].includes(cap)
}

/**
 * 偽 URL バーに出す架空アドレス（SAFE-12: 実在ドメインを表示しない）。
 * スキームも `hell://` にして「本物の URL ではない」ことを構造的に示す。
 */
export const FAKE_SCHEME = 'hell://'
export const FAKE_HOST = 'yomimono.jigoku'

export function fakeUrl(path: string): string {
  const clean = path.replace(/^\/+/, '')
  return `${FAKE_SCHEME}${FAKE_HOST}/${clean}`
}

/** 実在 TLD / 実在ドメインらしき文字列を含まないことの静的検査（テストと SAFE-12 e2e が使う） */
const REAL_TLD_RE = /\.(com|net|org|jp|co\.jp|io|dev|app|info|biz|me|tv|xyz|site|online)(\/|$)/i
const REAL_HOST_RE = /(google|apple|amazon|yahoo|facebook|instagram|twitter|x\.com|line\.me|rakuten|mercari|youtube|tiktok|microsoft|github|wikipedia)/i
export function looksLikeRealDomain(text: string): boolean {
  return REAL_TLD_RE.test(text) || REAL_HOST_RE.test(text) || /^https?:\/\//i.test(text)
}
