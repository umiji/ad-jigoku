import { z } from 'zod'
import {
  categoryOf,
  localizedTextSchema,
  oneToFiveSchema,
  patternCategoryCodeSchema,
  patternIdSchema,
  uxDimensionSchema,
} from './common'
import { detectFacetSchema } from './detect'
import { escapeFacetSchema } from './escape'
import { fixtureFacetSchema } from './fixture'
import { gameFacetSchema } from './game'
import { improveFacetSchema } from './improve'

/** PatternDefinition — PATTERN_SCHEMA.md §2 */
export const patternDefinitionSchema = z
  .object({
    id: patternIdSchema,
    category: patternCategoryCodeSchema,
    name: z.object({ ja: z.string().min(1), en: z.string().min(1) }),
    definition: localizedTextSchema,

    /** CATALOG §1.1。0-20。仮説値であることを severitySource で明示する */
    severity: z.number().int().min(0).max(20),
    severitySource: z.enum(['hypothesis', 'calibrated']),

    /** CATALOG §1.3。UX Severity とは独立軸 */
    gameDifficulty: oneToFiveSchema,

    /** どの次元に効くパターンか。スコア内訳の説明に使う */
    dimensions: z.partialRecord(uxDimensionSchema, z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)])),

    /** COM-* のみ。構成要素 */
    composedOf: z.array(patternIdSchema).min(2).optional(),

    /** デバイス別の Severity 差分（CATALOG §10 Q3。MVP では空） */
    deviceModifier: z.object({ mobile: z.number().optional(), desktop: z.number().optional() }).optional(),

    game: gameFacetSchema.optional(),
    detect: detectFacetSchema.optional(),
    improve: improveFacetSchema.optional(),
    escape: escapeFacetSchema.optional(),
    fixture: fixtureFacetSchema.optional(),

    references: z.array(z.object({ label: z.string().min(1), url: z.string().url() })).optional(),
  })
  .superRefine((p, ctx) => {
    if (categoryOf(p.id) !== p.category) {
      ctx.addIssue({ code: 'custom', path: ['category'], message: `category "${p.category}" が id "${p.id}" のプレフィックスと一致しない` })
    }
    if (p.category === 'COM' && !p.composedOf) {
      ctx.addIssue({ code: 'custom', path: ['composedOf'], message: 'COM-* は composedOf が必須' })
    }
    if (p.category !== 'COM' && p.composedOf) {
      ctx.addIssue({ code: 'custom', path: ['composedOf'], message: 'composedOf は COM-* のみ' })
    }
    if (p.game) {
      if (p.category === 'COM') {
        if (p.game.shell !== undefined || p.game.behaviors !== undefined)
          ctx.addIssue({ code: 'custom', path: ['game', 'shell'], message: 'COM-* は専用の shell / behaviors を持たない（composedOf を同時起動する。GAME_ENGINE_DESIGN §7.1）' })
      } else {
        if (p.game.shell === undefined) ctx.addIssue({ code: 'custom', path: ['game', 'shell'], message: '単独パターンの game facet は shell が必須' })
        if (p.game.behaviors === undefined) ctx.addIssue({ code: 'custom', path: ['game', 'behaviors'], message: '単独パターンの game facet は behaviors が必須' })
      }
    }
    if (p.game?.incompatibleWith.includes(p.id)) {
      ctx.addIssue({ code: 'custom', path: ['game', 'incompatibleWith'], message: '自分自身を incompatibleWith に含められない' })
    }
  })

export type PatternDefinition = z.infer<typeof patternDefinitionSchema>

/** JSON ファイル1つ = 1カテゴリ分の配列 */
export const patternFileSchema = z.array(patternDefinitionSchema)
