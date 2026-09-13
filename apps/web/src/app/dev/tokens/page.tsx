import type { Metadata } from 'next'
import { colors, easing, motion, shadow, shape, spacingScale, target, tokenCssGroups, zIndex } from '@ad-jigoku/ui/tokens'

/**
 * 開発用のトークン一覧（TASK-002 acceptance criteria）。
 *
 * DESIGN.md §4,5,6,14,15,16 の値が実際に何になっているかをブラウザで確認するためのページ。
 * ここ自体も DESIGN.md に従う（常にダーク / トークン以外の値を書かない / 角丸カードを並べない）。
 *
 * 色見本や spacing バーの寸法は `var(--...)` を直接参照している。
 * Tailwind のクラス名は静的解析されるため、トークンを動的に回すこの用途では使えない。
 * 生の値（`#FF3B30` や `24px`）を書いているわけではないので DESIGN.md §4 には違反しない。
 */
export const metadata: Metadata = {
  title: 'Design tokens — 広告地獄',
  description: 'DESIGN.md のトークン一覧（開発用）',
}

const SECTION_LABEL = 'text-ad-meta uppercase text-text-secondary'
const CODE = 'text-ad-legal text-text-secondary'

/** DESIGN.md §5 のヒエラルキー。Tailwind のクラス名は静的に書く必要がある */
const TYPE_SAMPLES = [
  { name: 'display', className: 'text-display', sample: '広告地獄' },
  { name: 'h1', className: 'text-h1', sample: 'ようこそ、広告地獄へ。' },
  { name: 'h2', className: 'text-h2', sample: '閉じると、次の説明が出る' },
  { name: 'ad-headline', className: 'text-ad-headline', sample: '今すぐ無料で受け取る' },
  { name: 'body', className: 'text-body', sample: '広告を閉じることが、説明を読むことになる。' },
  { name: 'ad-meta', className: 'text-ad-meta', sample: 'SPONSORED — 広告地獄ネットワーク' },
  { name: 'ad-legal', className: 'text-ad-legal', sample: '※ これは実在しない架空の広告です。' },
] as const

/** DESIGN.md §16 */
const SHAPE_SAMPLES = [
  { name: 'base', className: 'rounded-base', value: shape.baseRadius },
  { name: 'popup', className: 'rounded-popup', value: shape.popupRadius },
  { name: 'button', className: 'rounded-button', value: shape.buttonRadius },
  { name: 'card', className: 'rounded-card', value: shape.cardRadius },
] as const

/** DESIGN.md §16.1（追記提案 / TASK-013） */
const SHADOW_SAMPLES = [
  { name: 'popup', className: 'shadow-popup', value: shadow.popup },
  { name: 'sticky', className: 'shadow-sticky', value: shadow.sticky },
] as const

function Section({ title, source, children }: { title: string; source: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border-subtle pt-24 pb-32">
      <p className={SECTION_LABEL}>{source}</p>
      <h2 className="text-h2 mb-24">{title}</h2>
      {children}
    </section>
  )
}

function ColorSwatches() {
  const entries = Object.entries(colors).flatMap(([role, group]) =>
    Object.entries(group).map(([key, value]) => ({ role, key, value })),
  )
  return (
    <ul role="list" className="grid grid-cols-2 gap-16">
      {entries.map(({ role, key, value }) => {
        const cssVar = `--color-${role}-${key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`
        return (
          <li key={cssVar} className="border border-border-subtle">
            <div
              className="h-64 w-full border-b border-border-subtle"
              style={{ backgroundColor: `var(${cssVar})` }}
            />
            <div className="p-12">
              <p className="text-body">
                {role}.{key}
              </p>
              <p className={CODE}>{value}</p>
              <p className={CODE}>{cssVar}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function SpacingBars() {
  return (
    <ul role="list" className="flex flex-col gap-8">
      {spacingScale.map((step) => (
        <li key={step} className="flex items-center gap-16">
          <span className={`${CODE} w-48`}>{step}</span>
          <span
            className="h-8 bg-accent-electric"
            style={{ width: `var(--space-${step})` }}
          />
        </li>
      ))}
    </ul>
  )
}

function TokenTable({ rows }: { rows: readonly { label: string; value: string; cssVar: string }[] }) {
  return (
    <ul role="list" className="flex flex-col gap-8">
      {rows.map((row) => (
        <li key={row.cssVar} className="flex flex-wrap items-baseline gap-16 border-b border-border-subtle pb-8">
          <span className="text-body">{row.label}</span>
          <span className="text-ad-headline text-accent-warning">{row.value}</span>
          <span className={CODE}>{row.cssVar}</span>
        </li>
      ))}
    </ul>
  )
}

export default function DevTokensPage() {
  const generatedCount = tokenCssGroups().reduce((total, group) => total + group.vars.length, 0)

  return (
    <main className="container-gutter mx-auto max-w-content py-48">
      <p className={SECTION_LABEL}>DEV ONLY — DESIGN.md §4,5,6,14,15,16</p>
      <h1 className="text-h1">デザイントークン</h1>
      <p className="text-body text-text-secondary mt-16 mb-16">
        値の実体は <code>packages/ui/tokens/*.ts</code>。CSS は生成物なので手で編集しない。
        新しい色が必要になったら、まず <code>DESIGN.md</code> を直す。
      </p>
      <p className={CODE}>生成される CSS カスタムプロパティ: {generatedCount} 個 / テーマ切り替えなし（常にダーク）</p>

      <Section title="Color" source="DESIGN.md §4">
        <ColorSwatches />
      </Section>

      <Section title="Typography" source="DESIGN.md §5">
        <ul role="list" className="flex flex-col gap-24">
          {TYPE_SAMPLES.map((sample) => (
            <li key={sample.name}>
              <p className={CODE}>{sample.name}</p>
              <p className={sample.className}>{sample.sample}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Spacing" source="DESIGN.md §6">
        <SpacingBars />
      </Section>

      <Section title="Motion" source="DESIGN.md §14 / §14.1">
        <TokenTable
          rows={[
            ...Object.entries(motion).map(([key, value]) => ({
              label: key,
              value,
              cssVar: `--motion-${key}`,
            })),
            ...Object.entries(easing).map(([key, value]) => ({
              label: `easing.${key}`,
              value,
              cssVar: `--ease-${key}`,
            })),
          ]}
        />
      </Section>

      <Section title="Depth / Layering" source="DESIGN.md §15">
        <TokenTable
          rows={Object.entries(zIndex).map(([key, value]) => ({
            label: key,
            value: String(value),
            cssVar: `--z-${key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`,
          }))}
        />
      </Section>

      <Section title="Border / Radius / Shadow" source="DESIGN.md §16 / §16.1">
        <ul role="list" className="flex flex-wrap gap-24">
          {SHAPE_SAMPLES.map((sampleShape) => (
            <li key={sampleShape.name}>
              <div className={`h-96 w-96 bg-bg-elevated border border-border-subtle ${sampleShape.className}`} />
              <p className="text-body mt-8">{sampleShape.name}</p>
              <p className={CODE}>{sampleShape.value}</p>
            </li>
          ))}
        </ul>
        <ul role="list" className="mt-32 flex flex-wrap gap-48">
          {SHADOW_SAMPLES.map((sampleShadow) => (
            <li key={sampleShadow.name}>
              <div className={`h-96 w-128 bg-bg-elevated rounded-popup ${sampleShadow.className}`} />
              <p className="text-body mt-16">shadow.{sampleShadow.name}</p>
              <p className={CODE}>{sampleShadow.value}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Target size" source="DESIGN.md §19">
        <TokenTable
          rows={Object.entries(target).map(([key, value]) => ({
            label: `target.${key}`,
            value,
            cssVar: '--target-tap-min',
          }))}
        />
        <p className="text-body text-text-secondary mt-16">
          見た目が小さい × でも当たり判定はこれを下回らない（DESIGN_REQUIREMENTS §5.3 Pattern C）。
        </p>
      </Section>
    </main>
  )
}
