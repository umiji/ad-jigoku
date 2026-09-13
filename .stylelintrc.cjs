/**
 * DESIGN.md の違反を CSS 側で機械的に落とす（ARCHITECTURE.md §10.2）。
 *
 *   - 生の16進カラー禁止（DESIGN §4「Never hard-code arbitrary colors in components」）
 *   - 色名（red / white ...）禁止。同上
 *   - rgb() / hsl() のリテラル禁止。同上
 *   - z-index の数値リテラル禁止（DESIGN §15「Do not put every component at z-index: 9999」）
 *
 * 例外は生成物の packages/ui/styles/tokens.css と tailwind-theme.css だけ。
 * そこは tokens/*.ts から生成されるので手では編集しない。
 */

/** z-index に直接書ける唯一の値は 0 と auto。それ以外の整数は禁止 */
const NON_ZERO_INTEGER = '/^-?\\d*[1-9]\\d*$/'

/** Tailwind v4 の CSS-first 構文（OD-1） */
const TAILWIND_AT_RULES = [
  'theme',
  'source',
  'utility',
  'variant',
  'custom-variant',
  'apply',
  'reference',
  'plugin',
  'config',
]

module.exports = {
  extends: ['stylelint-config-standard'],
  ignoreFiles: [
    '**/node_modules/**',
    '**/.next/**',
    '**/out/**',
    '**/dist/**',
    '**/coverage/**',
    '**/.turbo/**',
    // 生成物（tokens/*.ts が source of truth）
    'packages/ui/styles/tokens.css',
    'packages/ui/styles/tailwind-theme.css',
  ],
  rules: {
    'color-no-hex': true,
    'color-named': 'never',
    'function-disallowed-list': ['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklab', 'oklch'],
    'declaration-property-value-disallowed-list': {
      'z-index': [NON_ZERO_INTEGER],
    },
    'at-rule-no-unknown': [true, { ignoreAtRules: TAILWIND_AT_RULES }],
    // Tailwind v4 の `@import "tailwindcss/utilities.css" layer(utilities)` は文字列表記
    'import-notation': 'string',
    // iOS Safari では -webkit- 付きでないと効かない
    'property-no-vendor-prefix': [
      true,
      { ignoreProperties: ['text-size-adjust', '-webkit-text-size-adjust'] },
    ],
    // 背景の質感レイヤーなど、長い data URI を 1 行で持つ
    'declaration-block-no-redundant-longhand-properties': null,
  },
  overrides: [
    {
      // CSS Modules は `styles.navButton` / `styles['is-active']` のどちらでも参照できるので camelCase と kebab-case を許可する
      files: ['**/*.module.css'],
      rules: {
        'selector-class-pattern': [
          '^[a-z][a-zA-Z0-9-]*$',
          { message: 'CSS Modules のクラス名は camelCase か kebab-case（styles.fooBar / styles["foo-bar"]）' },
        ],
      },
    },
  ],
}
