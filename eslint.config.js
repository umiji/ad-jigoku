// @ts-check
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import globals from 'globals'

/**
 * ARCHITECTURE.md §5.1 の依存方向を ESLint で機械的に強制する。
 * - game-engine / pattern-catalog: React / DOM / 時刻 / 乱数 / タイマー禁止（ADR-002）
 * - evaluator-core: Playwright 禁止（ADR-004）
 * - packages/*: apps/* への依存禁止
 * DESIGN.md §21 の禁止コンポーネント名（CoolCard 等）もここで落とす（TASK-002）。
 */

const FORBIDDEN_COMPONENT_NAMES = ['CoolCard', 'ModernCard', 'PremiumCard', 'GlassCard', 'FeatureCard']

const FORBIDDEN_COMPONENT_SELECTORS = FORBIDDEN_COMPONENT_NAMES.flatMap((name) => [
  {
    selector: `Identifier[name='${name}']`,
    message: `${name} は DESIGN.md §21 で禁止された名前。canonical component を使う`,
  },
  {
    selector: `JSXIdentifier[name='${name}']`,
    message: `${name} は DESIGN.md §21 で禁止された名前。canonical component を使う`,
  },
])

/** 純粋層（pattern-catalog / game-engine）で禁止するグローバル */
const PURE_LAYER_RESTRICTED_GLOBALS = [
  { name: 'Date', message: '時刻を読まない。step()/tick で時間を進める（ADR-002）' },
  { name: 'setTimeout', message: 'タイマー禁止（ADR-002）' },
  { name: 'setInterval', message: 'タイマー禁止（ADR-002）' },
  { name: 'clearTimeout', message: 'タイマー禁止（ADR-002）' },
  { name: 'clearInterval', message: 'タイマー禁止（ADR-002）' },
  { name: 'requestAnimationFrame', message: 'rAF は宿主（apps/web）の責務（ADR-002）' },
  { name: 'performance', message: '時刻を読まない（ADR-002）' },
  { name: 'window', message: 'DOM 禁止（ADR-002）' },
  { name: 'document', message: 'DOM 禁止（ADR-002）' },
  { name: 'navigator', message: 'DOM 禁止（ADR-002）' },
  { name: 'localStorage', message: 'DOM 禁止（ADR-002）' },
]

const APPS_PATTERNS = ['@ad-jigoku/web', '@ad-jigoku/web/*', '**/apps/*']

/** className / class に渡される文字列（JSX 属性と clsx 等のオブジェクト引数の両方を拾う） */
const CLASS_ATTRIBUTE_SELECTORS = [
  "JSXAttribute[name.name='className']",
  "JSXAttribute[name.name='class']",
  "Property[key.name='className']",
]

/** 上記の中にある「文字列リテラル」と「テンプレートリテラルの静的部分」を指す selector 生成器 */
const CLASS_VALUE_SELECTORS = CLASS_ATTRIBUTE_SELECTORS.flatMap((attribute) => [
  (pattern) => `${attribute} Literal[value=${pattern}]`,
  (pattern) => `${attribute} TemplateElement[value.raw=${pattern}]`,
])

/** Tailwind の任意値記法 `w-[123px]` / `bg-[#ff0000]` / `[color:red]` */
const ARBITRARY_VALUE_PATTERN = String.raw`/\[[^\]]*\]/`
const ARBITRARY_VALUE_MESSAGE =
  'Tailwind の任意値記法は禁止（ARCHITECTURE §10.3 / OD-1）。tokens に無い値が必要なら DESIGN.md を先に直す'

/** `z-10` / `z-9999` のような z-index 直書き。z-index は DESIGN.md §15 のトークンのみ */
const RAW_Z_INDEX_PATTERN = String.raw`/(^|\s)-?z-\d+(\s|$)/`
const RAW_Z_INDEX_MESSAGE =
  'z-index の数値直書きは禁止（DESIGN.md §15）。globals.css の z-* ユーティリティ（トークン）を使う'

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/out/**',
      '**/dist/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/next-env.d.ts',
      '**/playwright-report/**',
      '**/test-results/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,js,mjs,cjs}'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser, ...globals.es2022 },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: APPS_PATTERNS, message: 'packages/* から apps/* への依存は禁止（ARCHITECTURE §5.1）' },
          ],
        },
      ],
    },
  },
  {
    // ---- 純粋層: pattern-catalog / game-engine ----
    files: ['packages/game-engine/**/*.ts', 'packages/pattern-catalog/**/*.ts'],
    ignores: ['**/*.test.ts', '**/vitest.config.ts', '**/bin/**', '**/scripts/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'react', message: '純粋層は React を import しない（ADR-002）' },
            { name: 'react-dom', message: '純粋層は React を import しない（ADR-002）' },
          ],
          patterns: [
            {
              group: ['react/*', 'react-dom/*', 'next', 'next/*', '@ad-jigoku/ui', '@ad-jigoku/ui/*', ...APPS_PATTERNS],
              message: '純粋層は UI / apps に依存しない（ARCHITECTURE §5.1）',
            },
          ],
        },
      ],
      'no-restricted-globals': ['error', ...PURE_LAYER_RESTRICTED_GLOBALS],
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: '乱数は ctx.rng(stream) 経由のみ（ADR-002）' },
        { object: 'globalThis', property: 'Date', message: '時刻を読まない（ADR-002）' },
        { object: 'crypto', property: 'getRandomValues', message: '乱数は ctx.rng(stream) 経由のみ（ADR-002）' },
      ],
    },
  },
  {
    // ---- evaluator-core: Playwright 禁止（観測と判定の分離 / ADR-004）----
    files: ['packages/evaluator-core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'playwright', message: 'evaluator-core は Playwright を import しない（ADR-004）' },
            { name: 'playwright-core', message: 'evaluator-core は Playwright を import しない（ADR-004）' },
            { name: '@playwright/test', message: 'evaluator-core は Playwright を import しない（ADR-004）' },
          ],
          patterns: [
            {
              group: ['playwright/*', 'playwright-core/*', ...APPS_PATTERNS],
              message: 'evaluator-core は Playwright / apps を import しない',
            },
          ],
        },
      ],
    },
  },
  {
    // ---- ui: game-engine への依存禁止 ----
    files: ['packages/ui/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@ad-jigoku/game-engine', '@ad-jigoku/game-engine/*', ...APPS_PATTERNS],
              message: 'ui は game-engine / apps に依存しない（ARCHITECTURE §5.1）',
            },
          ],
        },
      ],
    },
  },
  {
    // ---- DESIGN.md §21: 禁止コンポーネント名 ----
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': ['error', ...FORBIDDEN_COMPONENT_SELECTORS],
    },
  },
  {
    // ---- OD-1 / ARCHITECTURE §10.3: Tailwind の任意値記法を禁止 ----
    // Tailwind は「トークンへのショートハンド」としてのみ使う。
    // `w-[123px]` / `bg-[#ff0000]` のような任意値と、`z-500` のような z-index 直書きを落とす。
    // flat config では後ろの設定がルールを上書きするので、§21 の禁止名もここで併せて指定する。
    files: ['apps/web/**/*.{ts,tsx}', 'packages/ui/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...FORBIDDEN_COMPONENT_SELECTORS,
        ...CLASS_VALUE_SELECTORS.flatMap((node) => [
          { selector: node(ARBITRARY_VALUE_PATTERN), message: ARBITRARY_VALUE_MESSAGE },
          { selector: node(RAW_Z_INDEX_PATTERN), message: RAW_Z_INDEX_MESSAGE },
        ]),
      ],
    },
  },
)
