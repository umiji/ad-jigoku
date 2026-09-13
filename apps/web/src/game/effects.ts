import type { AccessibilityProfile, Effect, SoundId } from '@ad-jigoku/game-engine'

/**
 * Effect の実行（TASK-014 要件 6 / GAME_ENGINE_DESIGN §10）。エンジンは返すだけ、実行はここ。
 * - sound: `audioEnabled` が false なら握り潰す（SAFE-04）。実音源は TASK-031（今は no-op sink）
 * - shake / rage: reducedMotion で減衰
 * - stamp / smash / toast: 宿主の演出コールバックへ
 */
export type EffectSinks = {
  playSound?: (id: SoundId) => void
  shake?: (intensity: number) => void
  smash?: (instanceId: string) => void
  stamp?: (text: string) => void
  rage?: (level: number) => void
  toast?: (text: string) => void
}

export type EffectRunner = (effects: readonly Effect[], a11y: AccessibilityProfile) => void

export const REDUCED_MOTION_SHAKE_FACTOR = 0.3

export function createEffectRunner(sinks: EffectSinks): EffectRunner {
  return (effects, a11y) => {
    for (const e of effects) {
      switch (e.kind) {
        case 'sound':
          if (a11y.audioEnabled) sinks.playSound?.(e.id)
          break
        case 'shake':
          sinks.shake?.(a11y.reducedMotion ? e.intensity * REDUCED_MOTION_SHAKE_FACTOR : e.intensity)
          break
        case 'rage':
          // エンジン側で presentationLevel 済みだが、宿主でも念のため reducedMotion なら 1 に丸める
          sinks.rage?.(a11y.reducedMotion ? Math.min(1, e.level) : e.level)
          break
        case 'smash':
          sinks.smash?.(e.instanceId)
          break
        case 'stamp':
          sinks.stamp?.(e.text)
          break
        case 'toast':
          sinks.toast?.(e.text)
          break
        default:
          assertNever(e)
      }
    }
  }
}

function assertNever(x: never): never {
  throw new Error(`未処理の effect: ${JSON.stringify(x)}`)
}
