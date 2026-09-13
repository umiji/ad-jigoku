import { SLOTS, type FrameCapability, type PatternDefinition, type PatternId, type Slot } from '@ad-jigoku/pattern-catalog'
import type { EngineTuning } from '../config'
import type { Registries } from '../sim/registries'

/**
 * 合成妥当性ルール R1〜R8（GAME_ENGINE_DESIGN.md §8.2）。
 * R1 スロット排他は型（Partial<Record<Slot, …>>）で構造的に保証されるのでここには無い。
 */

export type GamePattern = PatternDefinition & { game: NonNullable<PatternDefinition['game']> }

export function isGamePattern(p: PatternDefinition): p is GamePattern {
  return p.game !== undefined
}

/** COM は composedOf の構成要素（それぞれ shell を持つ）に展開して扱う */
export function componentsOf(p: GamePattern, byId: ReadonlyMap<string, PatternDefinition>): GamePattern[] {
  if (p.category !== 'COM') return [p]
  return (p.composedOf ?? []).map((id) => byId.get(id)).filter((c): c is GamePattern => c !== undefined && isGamePattern(c) && c.category !== 'COM')
}

export function usedSlots(p: GamePattern): Slot[] {
  return SLOTS.filter((s) => p.game.behaviors?.[s] !== undefined)
}

/** AD-2 + R2: shell が登録済みで supports ⊇ 使用スロット、かつ全 behavior が登録済み */
export function isImplemented(p: GamePattern, registries: Registries): boolean {
  const shellId = p.game.shell
  if (!shellId || !registries.shells.has(shellId)) return false
  const shell = registries.shells.resolve(shellId)
  for (const slot of usedSlots(p)) {
    if (!shell.supports.includes(slot)) return false
    const spec = p.game.behaviors?.[slot]
    if (!spec || !registries.behaviors.has(spec.id)) return false
  }
  return true
}

/** R3: ペア非互換（対称。片方向でも非互換とみなす） */
export function isPairCompatible(a: PatternDefinition, b: PatternDefinition): boolean {
  if (a.id === b.id) return false
  return !(a.game?.incompatibleWith.includes(b.id) || b.game?.incompatibleWith.includes(a.id))
}

/** R4: 1 広告内の Σ behavior.friction */
export function frictionOf(p: GamePattern, registries: Registries): number {
  let sum = 0
  for (const slot of usedSlots(p)) {
    const spec = p.game.behaviors?.[slot]
    if (spec && registries.behaviors.has(spec.id)) sum += registries.behaviors.resolve(spec.id, slot).friction
  }
  return sum
}

/** R5: 認知負荷 */
export function loadOf(p: GamePattern, registries: Registries): number {
  let sum = 0
  for (const slot of usedSlots(p)) {
    const spec = p.game.behaviors?.[slot]
    if (spec && registries.behaviors.has(spec.id)) sum += registries.behaviors.resolve(spec.id, slot).load
  }
  return Math.max(1, sum)
}

/**
 * R6b: SAFE-01 の「閉じられる」を構造で保証する。
 * シェルに close 部位があるか、パターンが「押さないのが正解」（correctInaction → REPORT で処理できる）であること。
 * どちらも無い広告は、時間が来ても画面から消す手段がない。
 */
export function hasDismissalAffordance(p: GamePattern, registries: Registries): boolean {
  if (p.game.correctInaction) return true
  const shellId = p.game.shell
  if (!shellId || !registries.shells.has(shellId)) return false
  return registries.shells.resolve(shellId).parts.includes('close')
}

/** R6: SAFE-01。宣言された遅延（close:delayed 等の delayMs / maxCloseDelayMsOverride）が上限以内 */
export function satisfiesSafe01(p: GamePattern, tuning: EngineTuning): boolean {
  const cap = tuning.MAX_CLOSE_DELAY_MS
  if ((p.game.maxCloseDelayMsOverride ?? 0) > cap) return false
  for (const slot of usedSlots(p)) {
    const params = p.game.behaviors?.[slot]?.params ?? {}
    for (const [k, v] of Object.entries(params)) {
      if (!/delay|wait/i.test(k)) continue
      const max = typeof v === 'number' ? v : v.max
      if (max > cap) return false
    }
  }
  return true
}

/** R8: frame 要件 ⊆ プロファイルの capability */
export function satisfiesFrame(p: GamePattern, capabilities: readonly FrameCapability[]): boolean {
  return (p.game.frame ?? []).every((f) => capabilities.includes(f))
}

export const FRAME_CAPABILITIES_BY_DEVICE: Record<'mobile' | 'desktop', readonly FrameCapability[]> = {
  mobile: ['back', 'url', 'scrollContainer', 'linkNav'],
  desktop: ['back', 'url', 'tabs', 'scrollContainer', 'linkNav', 'textInput'],
}

export type CandidateFilter = {
  registries: Registries
  tuning: EngineTuning
  capabilities: readonly FrameCapability[]
  byId: ReadonlyMap<string, PatternDefinition>
  /** 同時に成立している（同エンカウンター内の）既選択パターン */
  chosen: readonly PatternDefinition[]
  allowed?: readonly PatternId[]
}

/** 候補パターンを R2/R3/R4/R6/R8 と AD-2 で絞る */
export function passesStaticRules(p: GamePattern, f: CandidateFilter): boolean {
  if (f.allowed && !f.allowed.includes(p.id)) return false
  const comps = componentsOf(p, f.byId)
  if (comps.length === 0) return false
  for (const c of comps) {
    if (!isImplemented(c, f.registries)) return false
    if (!hasDismissalAffordance(c, f.registries)) return false
    if (frictionOf(c, f.registries) > f.tuning.FRICTION_CAP) return false
    if (!satisfiesSafe01(c, f.tuning)) return false
    if (!satisfiesFrame(c, f.capabilities)) return false
  }
  if (!satisfiesFrame(p, f.capabilities)) return false
  for (const other of f.chosen) {
    if (!isPairCompatible(p, other)) return false
    for (const c of comps) if (c.id !== other.id && !isPairCompatible(c, other)) return false
  }
  // COM の構成要素同士も互換であること
  for (let i = 0; i < comps.length; i++) for (let j = i + 1; j < comps.length; j++) if (!isPairCompatible(comps[i]!, comps[j]!)) return false
  return true
}
