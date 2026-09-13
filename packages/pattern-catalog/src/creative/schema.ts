import { z } from 'zod'

/**
 * Creative = 広告の「中身」（DECISIONS_v0.2 §1.4 / TASK-013D）。
 *
 * 広告インスタンス = Shell（見た目） × Behaviors（挙動） × **Creative（中身）**。
 * シェルが 8 種しかなくても「同じ広告ばかり」に見えないための唯一の変数がここ。
 *
 * 不変条件:
 * - 実在の企業 / 商品 / 有名人 / ドメインを書かない（DESIGN.md §3 MUST NOT 9）。
 *   `pnpm check-creatives` が NG ワードリストで機械的に落とす。
 * - `theme` は **色ではなく DESIGN.md の役割名**。生の色コードは持たせない（DESIGN.md §4）。
 */

/** 広告の題材カテゴリ。`CreativeSelector.kinds` の語彙（PATTERN_SCHEMA §3.3） */
export const CREATIVE_KINDS = [
  'sale',
  'notice',
  'download',
  'video',
  'app',
  'dating',
  'finance',
  'health',
  'game',
  'news',
  'survey',
  'subscription',
] as const
export type CreativeKind = (typeof CREATIVE_KINDS)[number]
export const creativeKindSchema = z.enum(CREATIVE_KINDS)

/**
 * タグの統制語彙。`CreativeSelector.tags` は「この全部を持つ Creative」を意味する（⊆ 判定）。
 * 自由文字列にすると誤字が静かに「該当なし」になるので enum で閉じる。
 */
export const CREATIVE_TAGS = [
  'urgent', // 今だけ / 期間限定
  'countdown', // あと3秒 / 残り時間表示
  'prize', // 当選 / プレゼント
  'warning', // 警告・重要なお知らせ風
  'system', // OS / ブラウザの通知に偽装した体裁
  'native', // 記事・おすすめ風（ネイティブ広告）
  'freebie', // 無料訴求
  'ranking', // ランキング / No.1 訴求
  'testimonial', // 体験談 / 個人の感想
  'recurring', // 継続課金・自動更新
  'download', // ダウンロード導線
  'video', // 動画・音声を伴う
  'quiz', // 診断・アンケート形式
  'mobile', // 小さい画面前提の体裁
  'desktop', // 広い画面前提の体裁
  'loud', // 派手・うるさい絵作り
] as const
export type CreativeTag = (typeof CREATIVE_TAGS)[number]
export const creativeTagSchema = z.enum(CREATIVE_TAGS)

/** DESIGN.md §4 の surface / accent 役割名。生の色は UI 側（tokens）が持つ */
export const CREATIVE_THEMES = ['popup', 'popupDark', 'danger', 'warning'] as const
export type CreativeTheme = (typeof CREATIVE_THEMES)[number]
export const creativeThemeSchema = z.enum(CREATIVE_THEMES)

/** `cr-<kind>-<連番4桁>` */
export const CREATIVE_ID_RE = /^cr-[a-z]+-\d{4}$/

export const creativeSchema = z.object({
  id: z.string().regex(CREATIVE_ID_RE, 'id は cr-<kind>-<4桁> の形（例: cr-sale-0012）'),
  kind: creativeKindSchema,
  tags: z.array(creativeTagSchema).min(1).max(5),
  /** 架空のブランド / 商品名。2..14 文字 */
  brand: z.string().min(2).max(14),
  headline: z.string().min(1).max(24),
  body: z.string().min(1).max(60).optional(),
  cta: z.string().min(1).max(12),
  legal: z.string().min(1).max(60).optional(),
  theme: creativeThemeSchema,
})
export type Creative = z.infer<typeof creativeSchema>

/** NG 検査と UI 描画の対象になるテキスト列。ここに増やすと検査対象も自動的に増える */
export const CREATIVE_TEXT_FIELDS = ['brand', 'headline', 'body', 'cta', 'legal'] as const
export type CreativeTextField = (typeof CREATIVE_TEXT_FIELDS)[number]
