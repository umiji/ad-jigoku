/**
 * ARCHITECTURE.md §5.1 の依存許可マトリクスと各 package.json を突き合わせる。
 *
 *   pattern-catalog   → (何にも依存しない。外部は zod のみ。TASK-003)
 *   game-engine       → pattern-catalog
 *   evaluator-core    → pattern-catalog
 *   hell-generator    → pattern-catalog
 *   ui                → pattern-catalog (型のみ)
 *   safety            → (テスト専用)
 *   apps/web          → pattern-catalog, game-engine, ui, evaluator-core
 *   apps/evaluator-worker → pattern-catalog, evaluator-core, hell-generator, playwright
 *
 * 禁止: packages/* → apps/*、game-engine → react/react-dom、evaluator-core → playwright。
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

export type PackageJson = {
  name: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

export type Violation = { pkg: string; dep: string; reason: string }

const SCOPE = '@ad-jigoku/'

/** 許可される workspace 依存（dependencies / peerDependencies を検査。devDependencies は対象外） */
export const ALLOWED_WORKSPACE_DEPS: Record<string, readonly string[]> = {
  '@ad-jigoku/pattern-catalog': [],
  '@ad-jigoku/game-engine': ['@ad-jigoku/pattern-catalog'],
  '@ad-jigoku/evaluator-core': ['@ad-jigoku/pattern-catalog'],
  '@ad-jigoku/hell-generator': ['@ad-jigoku/pattern-catalog'],
  '@ad-jigoku/ui': ['@ad-jigoku/pattern-catalog'],
  '@ad-jigoku/safety': [],
  '@ad-jigoku/web': [
    '@ad-jigoku/pattern-catalog',
    '@ad-jigoku/game-engine',
    '@ad-jigoku/ui',
    '@ad-jigoku/evaluator-core',
  ],
  '@ad-jigoku/evaluator-worker': [
    '@ad-jigoku/pattern-catalog',
    '@ad-jigoku/evaluator-core',
    '@ad-jigoku/hell-generator',
  ],
}

/** 外部依存の禁止リスト */
export const FORBIDDEN_EXTERNAL_DEPS: Record<string, readonly string[]> = {
  '@ad-jigoku/pattern-catalog': ['react', 'react-dom', 'playwright', 'playwright-core', 'next'],
  '@ad-jigoku/game-engine': ['react', 'react-dom', 'next', 'playwright', 'playwright-core'],
  '@ad-jigoku/evaluator-core': ['playwright', 'playwright-core', '@playwright/test', 'react', 'react-dom'],
  '@ad-jigoku/ui': ['@ad-jigoku/game-engine'],
}

/** pattern-catalog の外部依存は zod のみ（Shared Kernel。TASK-003 acceptance） */
export const EXTERNAL_ALLOWLIST: Record<string, readonly string[]> = {
  '@ad-jigoku/pattern-catalog': ['zod'],
}

export function checkPackage(pkg: PackageJson, isApp: boolean): Violation[] {
  const violations: Violation[] = []
  const deps = { ...(pkg.dependencies ?? {}), ...(pkg.peerDependencies ?? {}) }
  const allowedWs = ALLOWED_WORKSPACE_DEPS[pkg.name]
  const forbidden = FORBIDDEN_EXTERNAL_DEPS[pkg.name] ?? []
  const externalAllow = EXTERNAL_ALLOWLIST[pkg.name]

  for (const dep of Object.keys(deps)) {
    if (dep.startsWith(SCOPE)) {
      if (!isApp && dep === '@ad-jigoku/web') {
        violations.push({ pkg: pkg.name, dep, reason: 'packages/* は apps/* に依存できない' })
        continue
      }
      if (allowedWs === undefined) {
        violations.push({
          pkg: pkg.name,
          dep,
          reason: `未知のパッケージ ${pkg.name}。ALLOWED_WORKSPACE_DEPS に追加すること`,
        })
      } else if (!allowedWs.includes(dep)) {
        violations.push({ pkg: pkg.name, dep, reason: 'ARCHITECTURE §5.1 で許可されていない依存' })
      }
      continue
    }
    if (forbidden.includes(dep)) {
      violations.push({ pkg: pkg.name, dep, reason: '禁止された外部依存' })
    }
    if (externalAllow && !externalAllow.includes(dep)) {
      violations.push({ pkg: pkg.name, dep, reason: `外部依存は ${externalAllow.join(', ')} のみ許可` })
    }
  }
  return violations
}

export function readWorkspacePackages(root: string): { pkg: PackageJson; isApp: boolean }[] {
  const out: { pkg: PackageJson; isApp: boolean }[] = []
  for (const dir of ['packages', 'apps'] as const) {
    const base = join(root, dir)
    if (!existsSync(base)) continue
    for (const entry of readdirSync(base, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const file = join(base, entry.name, 'package.json')
      if (!existsSync(file)) continue
      out.push({ pkg: JSON.parse(readFileSync(file, 'utf8')) as PackageJson, isApp: dir === 'apps' })
    }
  }
  return out
}

export function checkAll(root: string): Violation[] {
  return readWorkspacePackages(root).flatMap(({ pkg, isApp }) => checkPackage(pkg, isApp))
}

const entry = process.argv[1]?.replace(/\\/g, '/') ?? ''
if (entry.endsWith('scripts/check-deps.ts')) {
  const violations = checkAll(process.cwd())
  if (violations.length === 0) {
    console.log('check-deps: OK (ARCHITECTURE §5.1 の依存方向を満たしています)')
  } else {
    for (const v of violations) console.error(`check-deps: ${v.pkg} -> ${v.dep}: ${v.reason}`)
    process.exit(1)
  }
}
