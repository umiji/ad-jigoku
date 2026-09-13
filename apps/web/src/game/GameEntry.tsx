'use client'

import { decodeSeedParams, type RunConfig } from '@ad-jigoku/game-engine'
import { catalogVersion, loadCatalog } from '@ad-jigoku/pattern-catalog'
import { useEffect, useMemo, useState } from 'react'
import { deviceProfileOf, readA11yProfile } from './a11yProfile'
import { articleRunConfig, pickArticle } from './content'
import { GameHost } from './GameHost'
import { SHELL_COMPONENTS } from './shells'

/**
 * `/game` の入口。URL（?s=&st=&m=&cv=）から seed を復元し、無ければ新しい seed を作る。
 * カタログバージョン不一致は「旧バージョンの地獄です」と明示する（黙って違う結果を出さない）。
 */
function newSeed(): string {
  // 宿主側なので乱数を使ってよい（エンジンには seed 文字列だけ渡す）
  const bytes = new Uint8Array(6)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 8)
}

export function GameEntry() {
  // seed は URL から読むのでクライアント専用（SSR の出力とズレる hydration mismatch を避ける）
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted ? <GameEntryClient /> : null
}

function GameEntryClient() {
  const [attempt, setAttempt] = useState(0)
  const initial = useMemo(() => {
    const query = typeof window !== 'undefined' ? window.location.search : ''
    const decoded = decodeSeedParams(query, catalogVersion.catalogVersion)
    if (decoded.ok) return { seed: decoded.link.seed, stageId: decoded.link.stageId, mode: decoded.link.mode, notice: decoded.catalogMismatch ? decoded.message : null }
    return { seed: newSeed(), stageId: 'stage-1', mode: 'story' as const, notice: null }
  }, [])
  const seed = attempt === 0 ? initial.seed : `${initial.seed}-${attempt}`
  const config = useMemo<RunConfig>(() => {
    const article = pickArticle(seed)
    const a11y = readA11yProfile(typeof window !== 'undefined' ? window : undefined)
    return { seed, mode: initial.mode, stageId: initial.stageId, catalog: loadCatalog(), accessibility: a11y, device: deviceProfileOf(typeof window !== 'undefined' ? window : undefined), ...articleRunConfig(article) }
  }, [seed, initial.mode, initial.stageId])
  const article = useMemo(() => pickArticle(seed), [seed])

  return (
    <>
      {initial.notice && (
        <p role="note" style={{ position: 'fixed', inset: 'auto 0 0 0', zIndex: 'var(--z-system)' as unknown as number, margin: 0, padding: 'var(--space-8)', background: 'var(--color-bg-elevated)', color: 'var(--color-accent-warning)', fontSize: 'var(--text-ad-meta-size)' }}>
          {initial.notice}
        </p>
      )}
      <GameHost key={seed} config={config} article={article} shells={SHELL_COMPONENTS} onRestart={() => setAttempt((n) => n + 1)} />
    </>
  )
}
