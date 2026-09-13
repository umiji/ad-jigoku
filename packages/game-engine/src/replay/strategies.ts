import type { Intent } from '../state/intent'
import type { GameState } from '../state/types'

/**
 * ヘッドレス戦略（`pnpm game:simulate` / フィクスチャ生成 / テスト共用）。
 * 各戦略は「この tick の前に送る intent 列」を返す純粋関数。
 */
export type StrategyId = 'optimal' | 'naive' | 'spam' | 'idle' | 'fake-close-victim'

export type Strategy = (state: GameState, tick: number) => Intent[]

const active = (state: GameState) => state.ads.filter((a) => a.lifecycle !== 'closing')
const closeIntent = (instanceId: string): Intent => ({ t: 'point', target: { kind: 'ad', instanceId, part: 'close' } })

export const STRATEGIES: Record<StrategyId, Strategy> = {
  /** threat の高い順に、閉じられるものを閉じる。常に読む。設問は正答 */
  optimal: (state) => {
    const intents: Intent[] = [{ t: 'read' }]
    const target = active(state)
      .filter((a) => a.lifecycle === 'closable')
      .sort((a, b) => b.threat - a.threat)[0]
    if (target) intents.push(closeIntent(target.instanceId))
    return intents
  },
  /** 出現順に閉じる。優先順位は考えない */
  naive: (state) => {
    const intents: Intent[] = [{ t: 'read' }]
    const target = active(state).find((a) => a.lifecycle === 'closable')
    if (target) intents.push(closeIntent(target.instanceId))
    return intents
  },
  /** 何も考えず部位を連打（偽× / CTA も押す） */
  spam: (state, tick) => {
    const ads = active(state)
    if (ads.length === 0) return [{ t: 'read' }]
    const ad = ads[tick % ads.length]!
    const parts = ['close', 'fake-close', 'cta', 'close'] as const
    return [{ t: 'read' }, { t: 'point', target: { kind: 'ad', instanceId: ad.instanceId, part: parts[tick % parts.length]! } }]
  },
  /** 何もしない（patience 0 で失敗する記録用） */
  idle: () => [{ t: 'read' }],
  /** 偽× を押しに行く（fake close で失敗する記録用） */
  'fake-close-victim': (state) => {
    const intents: Intent[] = [{ t: 'read' }]
    for (const ad of active(state)) {
      if (ad.view.parts.some((p) => p.part === 'fake-close' || p.part === 'decoy')) intents.push({ t: 'point', target: { kind: 'ad', instanceId: ad.instanceId, part: 'fake-close' } })
      else if (ad.lifecycle === 'closable') intents.push(closeIntent(ad.instanceId))
    }
    return intents
  },
}

export function isStrategyId(x: string): x is StrategyId {
  return x in STRATEGIES
}
