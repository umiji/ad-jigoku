/**
 * 広告のシェル（TASK-013A / 013B）。DESIGN.md §8 の面を作る側。
 *
 * **各シェルは独立モジュール**（DECISIONS_v0.2.md §1.3）。共通の土台コンポーネントは作らない。
 * 共有するのは src/parts/ の部位だけで、組み方・面の形・影は各シェルが自分で持つ。
 *
 * 挙動（いつ出るか / どう閉じにくいか / 再出現するか）はここには無い。Behavior 側の責務。
 */
export { DensityStack } from './densityStack/DensityStack'
export { densityStackDescriptor } from './densityStack/descriptor'
export { InlineRect } from './inlineRect/InlineRect'
export { inlineRectDescriptor } from './inlineRect/descriptor'
export { Interstitial } from './interstitial/Interstitial'
export { interstitialDescriptor } from './interstitial/descriptor'
export { Popup } from './popup/Popup'
export { popupDescriptor } from './popup/descriptor'
export { StickyBanner } from './stickyBanner/StickyBanner'
export { stickyBannerDescriptor } from './stickyBanner/descriptor'
export { VideoPlayer } from './videoPlayer/VideoPlayer'
export { videoPlayerDescriptor } from './videoPlayer/descriptor'
export { SHELL_COMPONENTS, SHELL_DESCRIPTORS } from './registry'
export type { Lifecycle, ShellDescriptor, ShellProps, SizeHint, Surface } from './types'
