import { z } from 'zod'

/** CATALOG §2 の 11 カテゴリ（A..K） */
export const PATTERN_CATEGORY_CODES = [
  'CLS', // A. Close / Dismiss Friction
  'INT', // B. Unexpected Interruption
  'OBS', // C. Screen Obstruction
  'ACC', // D. Interaction / Accidental Click
  'DEC', // E. Deceptive / Camouflaged
  'ATT', // F. Motion / Audio / Attention Hijacking
  'TIME', // G. Timing / Waiting
  'PER', // H. Persistence / Recurrence
  'LAY', // I. Layout / Visual Stability
  'MOB', // J. Mobile-specific
  'COM', // K. Compound / Combo
] as const

export type PatternCategoryCode = (typeof PATTERN_CATEGORY_CODES)[number]
export const patternCategoryCodeSchema = z.enum(PATTERN_CATEGORY_CODES)

/** "CLS-11" | "INT-03" | "COM-07" ... カタログと 1:1。プレフィックスを型で制約する */
export type PatternId = `${PatternCategoryCode}-${string}`

const PATTERN_ID_RE = new RegExp(`^(${PATTERN_CATEGORY_CODES.join('|')})-\\d{2}$`)

export const patternIdSchema = z
  .string()
  .regex(PATTERN_ID_RE, 'PatternId は <CATEGORY>-NN 形式（例: CLS-11）')
  .transform((s) => s as PatternId)

export function isPatternId(value: string): value is PatternId {
  return PATTERN_ID_RE.test(value)
}

export function categoryOf(id: PatternId): PatternCategoryCode {
  return id.slice(0, id.indexOf('-')) as PatternCategoryCode
}

/** CATALOG §1.2 の9次元 */
export const UX_DIMENSIONS = [
  'interruption',
  'obstruction',
  'interactionFriction',
  'deception',
  'attentionHijacking',
  'persistence',
  'timeCost',
  'mobileImpact',
  'cumulativeEffect',
] as const
export type UxDimension = (typeof UX_DIMENSIONS)[number]
export const uxDimensionSchema = z.enum(UX_DIMENSIONS)

/** RNG がこの範囲からシードで抽選する（生成時に1回だけ確定。PATTERN_SCHEMA §3.4） */
export const rangeSchema = z
  .object({ min: z.number(), max: z.number() })
  .refine((r) => r.min <= r.max, { message: 'Range は min <= max' })
export type Range = z.infer<typeof rangeSchema>

export const localizedTextSchema = z.object({ ja: z.string().min(1), en: z.string().min(1).optional() })
export type LocalizedText = z.infer<typeof localizedTextSchema>

export const oneToFiveSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)])
export type OneToFive = z.infer<typeof oneToFiveSchema>
