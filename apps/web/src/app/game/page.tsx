import { Suspense } from 'react'
import { GameEntry } from '@/game/GameEntry'

export const metadata = { title: 'ようこそ、広告地獄へ。— ゲーム' }

/** 静的書き出し（output: 'export'）: seed 等はクライアント側で URL から読む */
export default function GamePage() {
  return (
    <Suspense fallback={null}>
      <GameEntry />
    </Suspense>
  )
}
