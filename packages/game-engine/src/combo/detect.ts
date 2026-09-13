import type { ComboTag, PatternDefinition } from '@ad-jigoku/pattern-catalog'
import definitions from './definitions.json'
import type { GameState } from '../state/types'
import { activeComboTags } from './tags'

/**
 * コンボ（GAME §10 / GAME_ENGINE_DESIGN §9.3 / TASK-011）。
 * 2 種類を区別する:
 * - 敵側コンボ: 広告の組み合わせ（comboTags の集合）が同時成立した。名前が出る。プレイヤーは褒められない
 * - プレイヤー側コンボ: 連続で正しく処理した chain。スコアボーナス
 * 判定は **タグの集合マッチ**。パターン ID を直接指定しない（パターンが増えても定義を書き換えない）。
 */
export type ComboDefinition = { id: string; name: { ja: string }; requires: ComboTag[] }

export const COMBO_DEFINITIONS: readonly ComboDefinition[] = definitions as ComboDefinition[]

export function matchCombos(tags: readonly ComboTag[], defs: readonly ComboDefinition[] = COMBO_DEFINITIONS): ComboDefinition[] {
  const set = new Set(tags)
  return defs.filter((d) => d.requires.every((t) => set.has(t)))
}

/** 毎 tick: 敵側コンボの成立状況を更新する。新規成立時は log に 'combo' を積む */
export function updateEnemyCombo(state: GameState, byId: ReadonlyMap<string, PatternDefinition>): GameState {
  const tags = activeComboTags(state, byId)
  const matched = matchCombos(tags)
  // 最も要求タグ数が多い（=最も凶悪な）ものを代表名にする
  const top = matched.sort((a, b) => b.requires.length - a.requires.length)[0]
  const namedCombo = top?.name.ja
  const sameTags = tags.length === state.combo.activeTags.length && tags.every((t, i) => t === state.combo.activeTags[i])
  if (sameTags && namedCombo === state.combo.namedCombo) return state
  const seen = namedCombo && !state.combo.namedCombosSeen.includes(namedCombo) ? [...state.combo.namedCombosSeen, namedCombo] : state.combo.namedCombosSeen
  const log = namedCombo && namedCombo !== state.combo.namedCombo ? [...state.log, { step: state.step, kind: 'combo' as const, detail: `enemy:${namedCombo}` }] : state.log
  const combo = { ...state.combo, activeTags: tags, namedCombosSeen: seen, ...(namedCombo ? { namedCombo } : {}) }
  if (!namedCombo) delete combo.namedCombo
  return { ...state, combo, log }
}

/** プレイヤー側 chain を 1 つ進める（正しい処理のたびに呼ぶ）。ミス時のリセットは engine/outcome.ts */
export function advanceChain(state: GameState): GameState {
  const chain = state.combo.chain + 1
  return { ...state, combo: { ...state.combo, chain, bestChain: Math.max(state.combo.bestChain, chain) } }
}
