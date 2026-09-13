/**
 * tokens/*.ts → CSS 文字列への変換（ARCHITECTURE.md §10.1）。
 *
 * ここは純粋関数だけ。ファイル入出力は build-css.ts が持つ。
 * 分けてあるのは、開発用のトークン一覧ページ（/dev/tokens）が
 * 「実際に生成される変数の一覧」をそのまま再利用できるようにするため。
 *
 * 出力は決定論的（グループ順は固定、グループ内は自然順ソート、LF、末尾改行 1 つ）。
 */
import { colors } from './colors'
import { easing, motion } from './motion'
import { shadow } from './shadow'
import { shape } from './shape'
import { container, spacingScale, target } from './spacing'
import { fontFamily, type } from './type'
import { zIndex } from './zIndex'

export type CssVar = { readonly name: string; readonly value: string }
export type CssGroup = { readonly title: string; readonly vars: readonly CssVar[] }

const INDENT = '  '

/** camelCase → kebab-case */
function kebab(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

/** `--space-4` と `--space-12` が辞書順で壊れないように、数値部分は数値として比較する */
export function compareTokenNames(a: string, b: string): number {
  const chunk = /(\d+)|(\D+)/g
  const left = a.match(chunk) ?? []
  const right = b.match(chunk) ?? []
  const shared = Math.min(left.length, right.length)
  for (let i = 0; i < shared; i += 1) {
    const l = left[i] ?? ''
    const r = right[i] ?? ''
    if (l === r) continue
    if (/^\d+$/.test(l) && /^\d+$/.test(r)) return Number(l) - Number(r)
    return l < r ? -1 : 1
  }
  return left.length - right.length
}

function sortVars(vars: readonly CssVar[]): CssVar[] {
  return [...vars].sort((a, b) => compareTokenNames(a.name, b.name))
}

// ---- グループごとの変数 --------------------------------------------------

/** DESIGN.md §4 */
function colorVars(): CssVar[] {
  return Object.entries(colors).flatMap(([role, entries]) =>
    Object.entries(entries).map(([key, value]) => ({
      name: `--color-${kebab(role)}-${kebab(key)}`,
      value,
    })),
  )
}

/** DESIGN.md §5 */
function fontVars(): CssVar[] {
  return [{ name: '--font-sans', value: fontFamily.sans }]
}

/** DESIGN.md §5。素の CSS 用は `--text-<name>-<property>` 形式 */
function typeVars(): CssVar[] {
  return Object.entries(type).flatMap(([name, scale]) =>
    Object.entries(scale).map(([property, value]) => ({
      name: `--text-${kebab(name)}-${kebab(property)}`,
      value: String(value),
    })),
  )
}

/** DESIGN.md §6 */
function spacingVars(prefix: string): CssVar[] {
  return spacingScale.map((step) => ({ name: `${prefix}${step}`, value: `${step}px` }))
}

/** DESIGN.md §6 Container */
function containerVars(): CssVar[] {
  return Object.entries(container).map(([key, value]) => ({
    name: `--container-${kebab(key)}`,
    value,
  }))
}

/** DESIGN.md §14 */
function motionVars(): CssVar[] {
  return Object.entries(motion).map(([key, value]) => ({ name: `--motion-${kebab(key)}`, value }))
}

/** DESIGN.md §14.1（追記提案 / TASK-013） */
function easingVars(): CssVar[] {
  return Object.entries(easing).map(([key, value]) => ({ name: `--ease-${kebab(key)}`, value }))
}

/** DESIGN.md §16.1（追記提案 / TASK-013） */
function shadowVars(): CssVar[] {
  return Object.entries(shadow).map(([key, value]) => ({ name: `--shadow-${kebab(key)}`, value }))
}

/** DESIGN.md §19。当たり判定の下限は 1 箇所だけに持つ */
function targetVars(): CssVar[] {
  return Object.entries(target).map(([key, value]) => ({ name: `--target-${kebab(key)}`, value }))
}

/** DESIGN.md §15 */
function zIndexVars(): CssVar[] {
  return Object.entries(zIndex).map(([key, value]) => ({
    name: `--z-${kebab(key)}`,
    value: String(value),
  }))
}

/** DESIGN.md §16。`baseRadius` → `--radius-base` */
function radiusVars(): CssVar[] {
  return Object.entries(shape).map(([key, value]) => ({
    name: `--radius-${kebab(key).replace(/-?radius$/, '')}`,
    value,
  }))
}

// ---- 出力 ----------------------------------------------------------------

function header(purpose: string): string {
  return [
    '/*',
    ' * このファイルは自動生成されています。手で編集しないでください。',
    ' *',
    ` * ${purpose}`,
    ' * source : packages/ui/tokens/*.ts (DESIGN.md §4,5,6,14,15,16)',
    ' * build  : pnpm --filter @ad-jigoku/ui tokens:build',
    ' * verify : pnpm --filter @ad-jigoku/ui tokens:check',
    ' */',
  ].join('\n')
}

function renderGroup(group: CssGroup): string[] {
  return [
    `${INDENT}/* ${group.title} */`,
    ...sortVars(group.vars).map((v) => `${INDENT}${v.name}: ${v.value};`),
  ]
}

function renderFile(purpose: string, open: string, groups: readonly CssGroup[], lead: readonly string[] = []): string {
  const body = groups.flatMap((group, i) =>
    i === 0 && lead.length === 0 ? renderGroup(group) : ['', ...renderGroup(group)],
  )
  return [header(purpose), '', open, ...lead, ...body, '}', ''].join('\n')
}

/** tokens.css に出る変数の全量。/dev/tokens はこれをそのまま表示する */
export function tokenCssGroups(): CssGroup[] {
  return [
    { title: 'Color — DESIGN.md §4', vars: colorVars() },
    { title: 'Typography — DESIGN.md §5', vars: [...fontVars(), ...typeVars()] },
    { title: 'Spacing / Layout — DESIGN.md §6', vars: [...spacingVars('--space-'), ...containerVars()] },
    { title: 'Motion — DESIGN.md §14 / §14.1', vars: [...motionVars(), ...easingVars()] },
    { title: 'Depth / Layering — DESIGN.md §15', vars: zIndexVars() },
    { title: 'Border / Radius / Shadow — DESIGN.md §16 / §16.1', vars: [...radiusVars(), ...shadowVars()] },
    { title: 'Target size — DESIGN.md §19', vars: targetVars() },
  ].map((group) => ({ ...group, vars: sortVars(group.vars) }))
}

/** 素の CSS カスタムプロパティ。Tailwind を通さない文脈（CSS Modules / 生の CSS）でも使える */
export function buildTokensCss(): string {
  return renderFile('デザイントークンの CSS カスタムプロパティ。', ':root {', tokenCssGroups())
}

/**
 * Tailwind v4 の @theme バインディング（OD-1 / ARCHITECTURE.md §10.3）。
 *
 * - `--*-*: initial` で Tailwind 既定のパレット / スケールを消す。
 *   これをしないと `bg-red-500` のような DESIGN.md 外の色が書けてしまう。
 * - `--text-<name>` は Tailwind v4 の修飾子構文（`--text-display--font-weight`）を使う。
 *   これで `text-display` 1 つに size / weight / line-height / letter-spacing が揃う。
 * - z-index と motion duration は Tailwind に対応する theme namespace が無いので、
 *   apps/web の globals.css で `@utility` として定義する（値は tokens.css の変数を参照）。
 */
export function buildTailwindThemeCss(): string {
  const textVars: CssVar[] = Object.entries(type).flatMap(([name, scale]) => {
    const base = `--text-${kebab(name)}`
    return Object.entries(scale).map(([property, value]) => ({
      name: property === 'size' ? base : `${base}--${property === 'weight' ? 'font-weight' : kebab(property)}`,
      value: String(value),
    }))
  })

  const groups: CssGroup[] = [
    { title: 'Color — DESIGN.md §4', vars: colorVars() },
    { title: 'Typography — DESIGN.md §5', vars: [...fontVars(), ...textVars] },
    { title: 'Spacing — DESIGN.md §6', vars: spacingVars('--spacing-') },
    { title: 'Container — DESIGN.md §6', vars: [{ name: '--container-content', value: container.maxWidth }] },
    { title: 'Border / Radius — DESIGN.md §16', vars: radiusVars() },
  ]

  const resets = ['--color-*', '--font-*', '--text-*', '--spacing-*', '--container-*', '--radius-*']
  const lead = [
    `${INDENT}/* Tailwind 既定値を捨てる。DESIGN.md に無い値を書けないようにするため */`,
    ...resets.map((reset) => `${INDENT}${reset}: initial;`),
  ]

  return renderFile('Tailwind v4 の @theme バインディング（OD-1）。', '@theme {', groups, lead)
}
