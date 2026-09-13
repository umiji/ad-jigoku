import type { Registries } from '../sim/registries'
import { registerMvpShells } from '../sim/shells'
import type { Behavior } from '../sim/types'
import { closeDelayed, closeInstant } from './close'
import { persistSticky } from './persist'
import { spawnDelayed, spawnImmediate } from './spawn'
import { surfaceFullscreen } from './surface'

/**
 * 実装済み behavior の一覧。ここに載っているものだけがステージ生成器の候補になる（AD-2）。
 * 追加の手順は docs/design/BEHAVIOR_GUIDE.md。
 */
export const BASELINE_BEHAVIORS: readonly Behavior<unknown>[] = [
  spawnImmediate,
  spawnDelayed,
  surfaceFullscreen,
  closeInstant,
  closeDelayed,
  persistSticky,
] as Behavior<unknown>[]

export function registerBaselineBehaviors(registries: Registries): Registries {
  for (const b of BASELINE_BEHAVIORS) if (!registries.behaviors.has(b.id)) registries.behaviors.register(b)
  return registries
}

/** MVP シェル + 実装済み behavior をまとめて登録する（アプリ起動時 / テスト） */
export function registerMvp(registries: Registries): Registries {
  registerMvpShells(registries)
  registerBaselineBehaviors(registries)
  return registries
}

export { spawnImmediate, spawnDelayed, surfaceFullscreen, closeInstant, closeDelayed, persistSticky }
