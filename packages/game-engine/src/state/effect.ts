/**
 * Effect — 宿主への指示（GAME_ENGINE_DESIGN.md §10）。エンジンは返すだけで実行しない。
 * 音・振動の可否は宿主（＝ユーザー設定を知っている層）が判断する（SAFE-04）。
 */
export type SoundId = 'popup' | 'close' | 'smash' | 'error' | 'countdown' | 'combo' | 'rage'

export type Effect =
  | { kind: 'shake'; intensity: number }
  | { kind: 'smash'; instanceId: string }
  | { kind: 'sound'; id: SoundId }
  | { kind: 'stamp'; text: 'BLOCKED' | 'REPORTED' }
  | { kind: 'rage'; level: number }
  | { kind: 'toast'; text: string }
