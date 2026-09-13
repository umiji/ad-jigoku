import type { PatternDefinition } from '@ad-jigoku/pattern-catalog'
import type { EngineTuning } from '../config'
import type { ActiveAd, GameState } from '../state/types'

/**
 * threat — Prioritization の脅威モデル（GAME_ENGINE_DESIGN §9.4 / DECISIONS_v0.2 §5.2）。
 *
 *   threat(ad) = drain(ad)    // patienceEffect.perSecondAlive（放置コスト）
 *              + block(ad)    // 本文を覆って progress を止めているか（0 or 定数）
 *              - trapRisk(ad) // 焦って触ると大ダメージ（onMistake が大きい）→ 後回しが正解
 *
 * 狙い: 自動音声 > 全画面 > 固定バナー > 偽×ポップアップ > 偽ダウンロード（触らない）の順になること。
 * 「近いものから押す」「全部即座に閉じる」が最適にならない。
 */
export function threatOf(ad: ActiveAd, pattern: PatternDefinition | undefined, tuning: EngineTuning): number {
  const pe = pattern?.game?.patienceEffect ?? { onSpawn: 0, onMistake: 0, perSecondAlive: 0 }
  const drain = pe.perSecondAlive
  const block = ad.blocksProgress ? tuning.THREAT_BLOCK_CONSTANT : 0
  const trapRisk = pe.onMistake * tuning.THREAT_TRAP_RISK_FACTOR
  return drain + block - trapRisk
}

export function computeThreats(state: GameState, byId: ReadonlyMap<string, PatternDefinition>, tuning: EngineTuning): GameState {
  let changed = false
  const ads = state.ads.map((ad) => {
    const t = ad.lifecycle === 'closing' ? 0 : threatOf(ad, byId.get(ad.patternId), tuning)
    if (t === ad.threat) return ad
    changed = true
    return { ...ad, threat: t }
  })
  return changed ? { ...state, ads } : state
}

/** その時点で最も threat の高い（放置が危険な）アクティブ広告。triage bonus の判定に使う（TASK-010） */
export function highestThreat(state: GameState): ActiveAd | undefined {
  let best: ActiveAd | undefined
  for (const ad of state.ads) {
    if (ad.lifecycle === 'closing') continue
    if (!best || ad.threat > best.threat) best = ad
  }
  return best
}
