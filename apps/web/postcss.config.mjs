/**
 * Tailwind v4 は PostCSS プラグインとして動く（OD-1 決着 / ARCHITECTURE.md §10.3）。
 * 設定は CSS-first。テーマは src/app/globals.css から
 * packages/ui/styles/tailwind-theme.css（tokens/*.ts の生成物）を読む。
 */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}

export default config
