import type { ComboTag, PatternDefinition } from '@ad-jigoku/pattern-catalog'
import type { GameState } from '../state/types'

/** 現在アクティブな広告が持つコンボタグの集合（敵側コンボの判定材料） */
export function activeComboTags(state: GameState, byId: ReadonlyMap<string, PatternDefinition>): ComboTag[] {
  const tags = new Set<ComboTag>()
  for (const ad of state.ads) {
    if (ad.lifecycle === 'closing') continue
    for (const t of byId.get(ad.patternId)?.game?.comboTags ?? []) tags.add(t)
  }
  return [...tags].sort()
}
