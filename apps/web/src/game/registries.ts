import { defaultRegistries, registerMvp, type Registries } from '@ad-jigoku/game-engine'

/**
 * アプリ起動時に 1 回だけ Shell / Behavior を登録する（TASK-013A 要件 5 / TASK-017）。
 * エンジン側宣言（MVP_SHELLS）と UI 側シェルコンポーネント（packages/ui/shells）の一致は
 * `shells.test.ts` が検査する。
 */
let registered: Registries | null = null

export function appRegistries(): Registries {
  if (!registered) registered = registerMvp(defaultRegistries)
  return registered
}
