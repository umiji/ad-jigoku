import { z } from 'zod'
import { localizedTextSchema, oneToFiveSchema, patternIdSchema, rangeSchema } from './common'

/**
 * GameFacet — PATTERN_SCHEMA.md §3（v0.2: Shell × Behaviors × Creative の2軸+データ / ADR-009）
 */

/** 挙動スロット。1 スロット 1 挙動（DECISIONS_v0.2 §1.2） */
export const SLOTS = [
  'spawn', // いつ出るか
  'surface', // どこに・どの大きさで
  'close', // どう閉じる／閉じにくいか
  'persist', // 閉じた後どうなるか
  'attention', // 注意をどう奪うか
  'instability', // レイアウトをどう揺らすか
  'deception', // 何に偽装するか
  'hitbox', // 当たり判定をどう歪めるか
] as const
export type Slot = (typeof SLOTS)[number]
export const slotSchema = z.enum(SLOTS)

/** ShellRegistry のキー。実体の存在は V-05 で registry 注入により検査する */
export const shellIdSchema = z.string().regex(/^[a-z][a-zA-Z0-9]*$/, 'ShellId は camelCase（例: popup, stickyBanner）')
export type ShellId = string

/** BehaviorId は `<slot>:<name>`（例: close:delayed）。スロットと ID の整合を型/検証で守る */
export const behaviorIdSchema = z
  .string()
  .regex(/^(spawn|surface|close|persist|attention|instability|deception|hitbox):[a-z][a-z0-9-]*$/, 'BehaviorId は <slot>:<kebab-name>')
export type BehaviorId = string

export const behaviorSpecSchema = z.object({
  id: behaviorIdSchema,
  params: z.record(z.string(), z.union([z.number(), rangeSchema])).optional(),
})
export type BehaviorSpec = z.infer<typeof behaviorSpecSchema>

/** Creative（中身）の抽選条件。データ本体は TASK-013D */
export const creativeSelectorSchema = z.object({
  /** 例: 'sale' | 'notice' | 'download' | 'video' | 'app' ... 013D のカテゴリ語彙 */
  kinds: z.array(z.string().min(1)).optional(),
  tags: z.array(z.string().min(1)).optional(),
})
export type CreativeSelector = z.infer<typeof creativeSelectorSchema>

/** 偽ブラウザ枠の機能（DECISIONS_v0.2 §2.3 / ADR-010） */
export const FRAME_CAPABILITIES = ['back', 'url', 'tabs', 'scrollContainer', 'textInput', 'linkNav'] as const
export type FrameCapability = (typeof FRAME_CAPABILITIES)[number]
export const frameCapabilitySchema = z.enum(FRAME_CAPABILITIES)

export const PLAYER_ACTIONS = ['CLOSE', 'SMASH', 'DODGE', 'FOCUS', 'REPORT', 'ESCAPE', 'IGNORE'] as const
export type PlayerAction = (typeof PLAYER_ACTIONS)[number]
export const playerActionSchema = z.enum(PLAYER_ACTIONS)

export const failureConditionSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('patience-zero') }),
  z.object({ kind: z.literal('wrong-target') }),
  z.object({ kind: z.literal('timeout'), ms: z.number().int().positive() }),
  z.object({ kind: z.literal('progress-blocked'), ms: z.number().int().positive() }),
])
export type FailureCondition = z.infer<typeof failureConditionSchema>

/**
 * コンボタグ（GAME §10）。コンボ判定はパターン ID ではなくタグ集合で行う（GAME_ENGINE_DESIGN §9.3）。
 * 新しいタグは自由に増やしてよいが、typo を防ぐためここに列挙する。
 */
export const COMBO_TAGS = [
  'popup',
  'interstitial',
  'fullscreen',
  'sticky',
  'sticky-video',
  'delayed-close',
  'tiny-close',
  'moving-close',
  'fake-close',
  'fake-download',
  'fake-play',
  'fake-next',
  'fake-nav',
  'invisible-hitbox',
  'autoplay-video',
  'auto-sound',
  'layout-shift',
  'respawn',
  'multi-layer',
  'density',
  'countdown',
  'native',
  'scroll-hijack',
  'back-intercept',
  'exit-intent',
  'flashing',
] as const
export type ComboTag = (typeof COMBO_TAGS)[number]
export const comboTagSchema = z.enum(COMBO_TAGS)

export const patienceEffectSchema = z.object({
  onSpawn: z.number().min(0).max(100),
  onMistake: z.number().min(0).max(100),
  /** 放置コスト。Prioritization の threat 計算の入力（GAME_ENGINE_DESIGN §9.4） */
  perSecondAlive: z.number().min(0).max(100),
})
export type PatienceEffect = z.infer<typeof patienceEffectSchema>

export const gameFacetSchema = z
  .object({
    /**
     * shell / behaviors は単独パターン（非 COM）では必須。
     * COM-*（Compound）は専用の Shell/Behavior を持たず、生成器が `composedOf` の構成要素を同時に起動する
     * （GAME_ENGINE_DESIGN §7.1）。整合性は patternDefinitionSchema 側で検査する。
     */
    shell: shellIdSchema.optional(),
    behaviors: z.partialRecord(slotSchema, behaviorSpecSchema).optional(),
    creative: creativeSelectorSchema.optional(),
    frame: z.array(frameCapabilitySchema).optional(),

    playerActions: z.array(playerActionSchema).min(1),
    correctInaction: z.boolean().optional(),
    failureCondition: failureConditionSchema,
    warning: z.enum(['none', 'subtle', 'explicit']),

    interactionComplexity: oneToFiveSchema,
    uncertainty: oneToFiveSchema,
    timePressure: oneToFiveSchema,

    comboTags: z.array(comboTagSchema),
    incompatibleWith: z.array(patternIdSchema),

    patienceEffect: patienceEffectSchema,
    education: z.object({ ja: z.string().min(1) }),
    maxCloseDelayMsOverride: z.number().int().positive().optional(),
    // scoreEffect は廃止（DECISIONS_v0.2 §5.3）。onClear は難易度3軸から導出する
  })
  .superRefine((g, ctx) => {
    // BehaviorSpec の id プレフィックスがキーのスロットと一致すること（R1 スロット排他を型+検証で守る）
    for (const [slot, spec] of Object.entries(g.behaviors ?? {})) {
      if (spec && !spec.id.startsWith(`${slot}:`)) {
        ctx.addIssue({
          code: 'custom',
          path: ['behaviors', slot, 'id'],
          message: `behavior id "${spec.id}" はスロット "${slot}" に属していない`,
        })
      }
    }
  })
export type GameFacet = z.infer<typeof gameFacetSchema>

/** localizedTextSchema は definition 用に再エクスポート（facet 内の education は ja のみ） */
export { localizedTextSchema }
