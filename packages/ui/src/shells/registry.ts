import type { ComponentType } from 'react'
import type { ShellId } from '@ad-jigoku/pattern-catalog'
import { DensityStack } from './densityStack/DensityStack'
import { densityStackDescriptor } from './densityStack/descriptor'
import { InlineRect } from './inlineRect/InlineRect'
import { inlineRectDescriptor } from './inlineRect/descriptor'
import { Interstitial } from './interstitial/Interstitial'
import { interstitialDescriptor } from './interstitial/descriptor'
import { Popup } from './popup/Popup'
import { popupDescriptor } from './popup/descriptor'
import { StickyBanner } from './stickyBanner/StickyBanner'
import { stickyBannerDescriptor } from './stickyBanner/descriptor'
import { VideoPlayer } from './videoPlayer/VideoPlayer'
import { videoPlayerDescriptor } from './videoPlayer/descriptor'
import type { ShellDescriptor, ShellProps } from './types'

/**
 * シェルの登録（TASK-013A req.5）。**起動時に 1 回。重複 ID は作らない。**
 *
 * `SHELL_DESCRIPTORS` は engine の `MVP_SHELLS`（packages/game-engine/src/sim/shells.ts）と
 * `parts` / `supports` が一致していなければならない。一致は宿主側のテスト
 * （apps/web/src/game/shells.test.ts）が機械的に検査する。
 *
 * `fakeDownload` / `fakePlay` は TASK-013C。engine には宣言があるが UI 実装はまだ無く、
 * 宿主の AdLayer が GenericShell にフォールバックする。
 */
export const SHELL_DESCRIPTORS: readonly ShellDescriptor[] = [
  popupDescriptor,
  interstitialDescriptor,
  stickyBannerDescriptor,
  inlineRectDescriptor,
  videoPlayerDescriptor,
  densityStackDescriptor,
]

export const SHELL_COMPONENTS: Readonly<Record<ShellId, ComponentType<ShellProps>>> = {
  popup: Popup,
  interstitial: Interstitial,
  stickyBanner: StickyBanner,
  inlineRect: InlineRect,
  videoPlayer: VideoPlayer,
  densityStack: DensityStack,
}
