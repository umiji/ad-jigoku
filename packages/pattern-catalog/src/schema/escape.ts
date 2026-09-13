import { z } from 'zod'

/** EscapeFacet — PATTERN_SCHEMA.md §5.5（v0.2 D6）。ユーザー向け「逃げ方」 */

export const escapeTechniqueIdSchema = z.string().regex(/^[a-z][a-z0-9-]*$/, 'EscapeTechniqueId は kebab-case')
export type EscapeTechniqueId = string

export const escapeFacetSchema = z.object({
  /** 推奨順。実体は data/escape-techniques.json（V-14 で参照先の存在を検査） */
  techniques: z.array(escapeTechniqueIdSchema).min(1),
  note: z.object({ ja: z.string().min(1) }).optional(),
})
export type EscapeFacet = z.infer<typeof escapeFacetSchema>

/** data/escape-techniques.json の1件 */
export const escapeTechniqueSchema = z.object({
  id: escapeTechniqueIdSchema,
  title: z.object({ ja: z.string().min(1) }),
  kind: z.enum(['immediate', 'preventive']),
  steps: z.array(z.object({ ja: z.string().min(1), device: z.enum(['both', 'mobile', 'desktop']) })).min(1),
  /** 常に true。サードパーティ広告ブロッカーは推奨しない（DECISIONS_v0.2 §6.4） */
  browserNative: z.literal(true),
})
export type EscapeTechnique = z.infer<typeof escapeTechniqueSchema>
