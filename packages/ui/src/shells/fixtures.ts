/**
 * シェルの単体テスト用のダミー props。**テスト専用**（`index.ts` からは公開しない）。
 *
 * 本番の Creative は `@ad-jigoku/pattern-catalog` の `loadCreatives()` が持つ。
 * ここにあるのは「シェルが props をどう描くか」を確かめるための最小のデータで、
 * 実在ブランドは入れない（DESIGN.md §3 MUST NOT 9）。
 */
import type { Creative } from '@ad-jigoku/pattern-catalog'
import type { AdPart, AdPartState, ShellProps } from './types'

export const FIXTURE_CREATIVE: Creative = {
  id: 'cr-sale-0001',
  kind: 'sale',
  tags: ['urgent'],
  brand: 'ホゲホゲ市場',
  headline: '本日限り 全品半額',
  body: '在庫がなくなり次第、静かに終了します',
  cta: '今すぐ見る',
  legal: '※一部対象外の商品があります',
  theme: 'popup',
}

export const FIXTURE_CREATIVE_DARK: Creative = {
  id: 'cr-video-0002',
  kind: 'video',
  tags: ['video'],
  brand: 'ムゲン動画',
  headline: '続きは動画で',
  body: '最後まで無料で見られます',
  cta: '再生する',
  theme: 'popupDark',
}

export function partState(part: AdPart, overrides: Partial<Omit<AdPartState, 'part'>> = {}): AdPartState {
  return { part, visible: true, enabled: true, emphasis: 1, hitboxScale: 1, ...overrides }
}

/** すべての部位を「見える / 押せる / 通常」で並べた既定。個別の状態は overrides で差し替える */
export function shellProps(overrides: Partial<ShellProps> = {}): ShellProps {
  return {
    instanceId: 'ad-1',
    lifecycle: 'closable',
    sizeHint: 'medium',
    surface: 'overlay',
    stackIndex: 0,
    parts: (['label', 'body', 'media', 'cta', 'legal', 'close'] as const).map((part) => partState(part)),
    motion: [],
    creative: FIXTURE_CREATIVE,
    creativeIndex: 0,
    reducedMotion: false,
    ageMs: 0,
    ...overrides,
  }
}
