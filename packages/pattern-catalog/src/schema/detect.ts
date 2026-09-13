import { z } from 'zod'

/** DetectFacet — PATTERN_SCHEMA.md §4 */

export const SIGNAL_REFS = [
  'dom.snapshot',
  'dom.boundingBoxes',
  'dom.computedStyles',
  'dom.zIndex',
  'viewport.size',
  'viewport.occlusion',
  'timeline.popupEvents',
  'timeline.closeDelay',
  'timeline.navigation',
  'media.autoplay',
  'media.audio',
  'perf.cls',
  'perf.lcp',
  'perf.longTasks',
  'network.requests',
  'a11y.tree',
  'screenshot.viewport',
  'screenshot.fullPage',
  'interaction.clickOutcome',
  'interaction.hitboxMap',
  'scroll.positionTimeline',
] as const
export type SignalRef = (typeof SIGNAL_REFS)[number]
export const signalRefSchema = z.enum(SIGNAL_REFS)

export const detectFacetSchema = z.object({
  /** CATALOG §5 のどの層で判定するか */
  layer: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  /** この検出器が必要とする Evidence の種類。Probe がこれを見て収集項目を決める */
  signals: z.array(signalRefSchema).min(1),
  detectorId: z.string().regex(/^[a-z][a-z0-9-]*$/, 'detectorId は kebab-case'),
  confidence: z.enum(['deterministic', 'heuristic', 'vision']),
  /** スコアに算入するか。vision は MVP では false（ARCHITECTURE §9.3） */
  scoreContributing: z.boolean(),
  thresholds: z.record(z.string(), z.number()).optional(),
})
export type DetectFacet = z.infer<typeof detectFacetSchema>
