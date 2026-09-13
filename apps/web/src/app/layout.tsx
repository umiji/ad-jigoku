import type { Metadata } from 'next'
import type { ReactNode } from 'react'
// 日本語対応の可変フォント 1 ファミリだけ（DESIGN.md §5: ファミリ数は 3 以下）。
// サブセット済み + unicode-range + font-display: swap は fontsource 側が持つ。
import '@fontsource-variable/m-plus-2'
import './globals.css'

export const metadata: Metadata = {
  title: 'ようこそ、広告地獄へ。',
  description: '広告UXのダークパターンを、笑い飛ばして、測って、直す。',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  // このプロダクトは常にダーク。ライト/ダークの切り替えは持たない（DESIGN.md §3 MUST 2）。
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
