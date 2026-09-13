import { BehaviorRegistry } from './behavior-registry'
import { ShellRegistry } from './shell-registry'

export type Registries = { shells: ShellRegistry; behaviors: BehaviorRegistry }

export function createRegistries(): Registries {
  return { shells: new ShellRegistry(), behaviors: new BehaviorRegistry() }
}

/**
 * 既定のレジストリ（アプリ起動時に 1 回だけ登録する）。
 * テストは `createRegistries()` で独立したレジストリを作ること。
 */
export const defaultRegistries: Registries = createRegistries()
