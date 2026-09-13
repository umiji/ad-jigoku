/**
 * tokens/*.ts → styles/*.css の書き出し（ARCHITECTURE.md §10.1）。
 *
 *   pnpm --filter @ad-jigoku/ui tokens:build   生成物を書き出す
 *   pnpm --filter @ad-jigoku/ui tokens:check   生成物が最新かを検査（CI / 手編集の検出）
 *
 * 出力は 2 つ。どちらも同じ tokens/*.ts から作られるので値の二重定義にはならない。
 *   - styles/tokens.css          : 素の CSS カスタムプロパティ。CSS Modules / 生の CSS 用
 *   - styles/tailwind-theme.css  : Tailwind v4 の @theme。ユーティリティ生成用（OD-1）
 *
 * CSS の中身の組み立ては css-vars.ts（純粋関数）が持つ。
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildTailwindThemeCss, buildTokensCss } from './css-vars'

/**
 * 生成物の置き場。`import.meta.url` を文字列のまま `fileURLToPath` に渡す
 * （jsdom 環境の `URL` を経由すると壊れるため）。
 */
const STYLES_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'styles')

export const GENERATED_CSS_OUTPUTS = [
  {
    relativePath: 'styles/tokens.css',
    absolutePath: join(STYLES_DIR, 'tokens.css'),
    build: buildTokensCss,
  },
  {
    relativePath: 'styles/tailwind-theme.css',
    absolutePath: join(STYLES_DIR, 'tailwind-theme.css'),
    build: buildTailwindThemeCss,
  },
] as const

// ---- CLI -----------------------------------------------------------------

function readIfExists(path: string): string | null {
  try {
    return readFileSync(path, 'utf8')
  } catch {
    return null
  }
}

function runCli(checkOnly: boolean): void {
  const stale: string[] = []
  for (const output of GENERATED_CSS_OUTPUTS) {
    const next = output.build()
    if (!checkOnly) {
      writeFileSync(output.absolutePath, next, 'utf8')
      console.log(`tokens:build: wrote ${output.relativePath}`)
      continue
    }
    if (readIfExists(output.absolutePath) !== next) stale.push(output.relativePath)
  }
  if (!checkOnly) return
  if (stale.length > 0) {
    for (const path of stale) {
      console.error(`tokens:check: ${path} が tokens/*.ts と一致しません（手編集されていませんか）`)
    }
    console.error('tokens:check: `pnpm --filter @ad-jigoku/ui tokens:build` を実行してコミットしてください')
    process.exit(1)
  }
  console.log('tokens:check: OK (生成物は tokens/*.ts と一致しています)')
}

const entry = process.argv[1]?.replace(/\\/g, '/') ?? ''
if (entry.endsWith('tokens/build-css.ts')) {
  runCli(process.argv.includes('--check'))
}
