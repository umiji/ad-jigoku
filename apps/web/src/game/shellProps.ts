import type { ActiveAd, ViewState } from '@ad-jigoku/game-engine'
import { STEP_MS } from '@ad-jigoku/game-engine'

/**
 * ViewState → Shell コンポーネントへ渡す props の変換（TASK-014 要件 5）。
 * **ここで挙動判断をしない。** ViewState の反映だけ。reducedMotion のときは動きのある cue を落とす。
 *
 * Shell コンポーネント（packages/ui/shells/<id>）の props 契約:
 *   ShellProps = {
 *     instanceId, lifecycle, sizeHint, stackIndex,
 *     parts: AdPartState[]（visible / enabled / emphasis / hitboxScale / anchor）,
 *     motion: MotionCue[]（reducedMotion 適用済み）,
 *     countdown?: { remainingMs }, badge?: string, offset?: { yPercent }, anchor?,
 *     creativeIndex: number（013D の selectCreative に渡す）,
 *     reducedMotion: boolean,
 *   }
 * shell はこれと `data-target` / `data-instance` 属性だけで描画する。
 */
export type ShellProps = {
  instanceId: string
  lifecycle: ActiveAd['lifecycle']
  sizeHint: ViewState['sizeHint']
  surface: ViewState['surface']
  stackIndex: number
  parts: ViewState['parts']
  motion: ViewState['motion']
  countdown?: { remainingMs: number } | undefined
  badge?: string | undefined
  offset?: { yPercent: number } | undefined
  anchor?: { xPercent: number; yPercent: number } | undefined
  creativeIndex: number
  reducedMotion: boolean
  /** 出現からの経過（ms）。演出用 */
  ageMs: number
}

const MOTION_ONLY_CUES = new Set<ViewState['motion'][number]>(['shake', 'drift', 'sticky-track', 'pulse'])

export function shellPropsOf(ad: ActiveAd, step: number, reducedMotion: boolean): ShellProps {
  const v = ad.view
  const motion = reducedMotion ? v.motion.filter((m) => !MOTION_ONLY_CUES.has(m)) : v.motion
  return {
    instanceId: ad.instanceId,
    lifecycle: ad.lifecycle,
    sizeHint: v.sizeHint,
    surface: v.surface,
    stackIndex: v.stackIndex,
    parts: v.parts,
    motion,
    countdown: v.countdown,
    badge: v.badge,
    offset: reducedMotion ? undefined : v.offset,
    anchor: v.anchor,
    creativeIndex: ad.creativeIndex,
    reducedMotion,
    ageMs: Math.max(0, (step - ad.spawnedAtStep) * STEP_MS),
  }
}
