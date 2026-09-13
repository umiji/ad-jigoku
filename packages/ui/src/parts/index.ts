/**
 * 広告の部位（parts）の allowlist（TASK-013 / DESIGN.md §21 component vocabulary）。
 *
 * ここに無いものを外に出さない。シェル（TASK-013A/B/C）と LP（TASK-033+）は
 * **この語彙だけ**を組み合わせて広告を作る。新しい部位が要るなら、まず DESIGN.md §21 を直す。
 *
 * 部位はすべて presentational。挙動（閉じるタイミング・移動・再出現）は持たない。
 */
export { AdBody, type AdBodyProps } from './AdBody'
export { AdCountdown, type AdCountdownProps } from './AdCountdown'
export { AdCreative, type AdCreativeProps } from './AdCreative'
export { AdCTA, type AdCTAProps } from './AdCTA'
export { AdHeadline, type AdHeadlineProps } from './AdHeadline'
export { AdLegal, type AdLegalProps } from './AdLegal'
export { AdMeta, type AdMetaProps } from './AdMeta'
export { CloseButton, type CloseButtonProps } from './CloseButton'
export { FakeCloseButton, type FakeCloseButtonProps } from './FakeCloseButton'
export { adCopy, fillCopy, type AdCopy } from './copy'
export {
  resolvePartState,
  type AdPart,
  type AdPartState,
  type Countdown,
  type CreativeContent,
  type CreativeTheme,
  type Emphasis,
  type MotionCue,
  type PartAnchor,
  type PartViewProps,
} from './types'
