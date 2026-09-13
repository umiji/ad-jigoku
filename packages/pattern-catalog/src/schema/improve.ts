import { z } from 'zod'

/** ImproveFacet — PATTERN_SCHEMA.md §5。PRODUCT §10 の Problem → Evidence → Why → Change → Impact を型にする */
export const improveFacetSchema = z.object({
  whyItHurts: z.object({ ja: z.string().min(1) }),
  recommendations: z
    .array(
      z.object({
        ja: z.string().min(1),
        effort: z.enum(['low', 'medium', 'high']),
        /** この修正で消えると期待される severity 分。Before/After の予測に使う */
        expectedSeverityReduction: z.number().min(0).max(20),
      }),
    )
    .min(1),
  /** 「広告を消せ」ではなく「こうすれば広告を出しつつ改善できる」を必ず1つ以上持つ（V-09 / PRODUCT §31） */
  adFriendlyAlternative: z.object({ ja: z.string().min(1) }),
})
export type ImproveFacet = z.infer<typeof improveFacetSchema>
