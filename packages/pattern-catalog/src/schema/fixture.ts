import { z } from 'zod'

/** FixtureFacet — PATTERN_SCHEMA.md §6 */
const fixtureBuilderIdSchema = z.string().regex(/^[a-z][a-z0-9-]*$/, 'FixtureBuilderId は kebab-case')

export const fixtureFacetSchema = z.object({
  /** このパターンを再現する最小の HTML/CSS/JS を生成する関数の ID */
  builderId: fixtureBuilderIdSchema,
  /** 生成されたフィクスチャに対して detector が返すべき結果 */
  expected: z.object({
    detected: z.literal(true),
    measuredValues: z.record(z.string(), z.object({ min: z.number().optional(), max: z.number().optional() })).optional(),
  }),
  /** 「検出されてはいけない」ネガティブケース。誤検出の回帰テスト用 */
  negativeCases: z.array(fixtureBuilderIdSchema).optional(),
})
export type FixtureFacet = z.infer<typeof fixtureFacetSchema>
