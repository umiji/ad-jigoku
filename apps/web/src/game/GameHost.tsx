'use client'

import type { Effect, GameState, RunConfig } from '@ad-jigoku/game-engine'
import type { PatternDefinition, PlayerAction } from '@ad-jigoku/pattern-catalog'
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { AdLayer, type ShellComponentMap } from './AdLayer'
import { ArticleSurface, type Article } from './content'
import { createEffectRunner } from './effects'
import { BrowserFrame } from './frame'
import { GenericShell } from './GenericShell'
import styles from './host.module.css'
import { Hud } from './hud'
import { ACTION_KEYS, intentFromEvent } from './intentFromEvent'
import { watchA11yProfile } from './a11yProfile'
import { ResultOverlay } from './ResultOverlay'
import { useEngine } from './useEngine'

/**
 * GameHost（TASK-014）。rAF ループと state 保持、入力 → Intent、ViewState → DOM、Effect の実行。
 * **ゲームロジックはここに書かない。** 200 行以内。
 */
export type GameHostProps = {
  config: RunConfig
  article: Article
  shells: ShellComponentMap
  onRestart?: () => void
}

export function GameHost({ config, article, shells, onRestart }: GameHostProps) {
  const [fx, setFx] = useState<{ shake: number; stamp: string | null; toast: string | null; rage: number }>({ shake: 0, stamp: null, toast: null, rage: 0 })
  const runner = useMemo(
    () =>
      createEffectRunner({
        shake: (i) => setFx((f) => ({ ...f, shake: i })),
        stamp: (t) => setFx((f) => ({ ...f, stamp: t })),
        toast: (t) => setFx((f) => ({ ...f, toast: t })),
        rage: (l) => setFx((f) => ({ ...f, rage: l })),
      }),
    [],
  )
  const onEffects = useCallback((effects: Effect[], state: GameState) => runner(effects, state.a11y), [runner])
  const { state, dispatch, setReading, restart } = useEngine(config, onEffects)
  const byId = useMemo(() => new Map(config.catalog.map((p) => [p.id, p])), [config.catalog])
  const [lastChoices, setLastChoices] = useState<Record<string, number>>({})
  const scrollEl = useRef<HTMLDivElement | null>(null)

  // メディアクエリの変化 → a11y intent
  useEffect(() => watchA11yProfile(window, (profile) => dispatch({ t: 'a11y', profile })), [dispatch])

  // 演出のリセット
  useEffect(() => {
    if (!fx.shake && !fx.stamp && !fx.toast) return
    const id = window.setTimeout(() => setFx((f) => ({ ...f, shake: 0, stamp: null, toast: null })), 600)
    return () => window.clearTimeout(id)
  }, [fx.shake, fx.stamp, fx.toast])

  // 入力 → Intent（座標を使わない）
  const onPointer = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      const intent = intentFromEvent({ target: e.target })
      if (intent) dispatch(intent)
    },
    [dispatch],
  )
  const onAction = useCallback((action: PlayerAction) => dispatch({ t: 'action', action }), [dispatch])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const action = ACTION_KEYS[e.key]
      if (action && !e.metaKey && !e.ctrlKey) dispatch({ t: 'action', action })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dispatch])

  const onAnswer = useCallback(
    (questionId: string, choice: number) => {
      setLastChoices((c) => ({ ...c, [questionId]: choice }))
      dispatch({ t: 'answer', questionId, choice })
    },
    [dispatch],
  )

  const handleRestart = useCallback(() => {
    setLastChoices({})
    restart()
    onRestart?.()
  }, [restart, onRestart])

  const culprit: PatternDefinition | undefined = state.culprit ? byId.get(state.culprit) : undefined

  return (
    <div className={styles.host} data-shake={fx.shake > 0 ? 'true' : 'false'} data-rage={fx.rage} data-phase={state.phase} data-testid="game-host" onClick={onPointer}>
      <BrowserFrame device={config.device} path={`article/${article.id}`} onScrollLines={(d) => dispatch({ t: 'scroll', deltaLines: d })} scrollRef={(el) => (scrollEl.current = el)}>
        <ArticleSurface article={article} readLines={state.progress.read} answered={state.answered} lastChoices={lastChoices} onAnswer={onAnswer} onVisibilityChange={setReading} />
        <AdLayer ads={state.ads} step={state.step} reducedMotion={state.a11y.reducedMotion} shells={shells} fallback={GenericShell} byId={byId} />
        <Hud state={state} byId={byId} onAction={onAction} />
        {fx.stamp && (
          <div className={styles.stamp} role="status">
            {fx.stamp}
          </div>
        )}
        {fx.toast && (
          <div className={styles.toast} role="status">
            {fx.toast}
          </div>
        )}
        {state.phase !== 'running' && <ResultOverlay state={state} culprit={culprit} onRestart={handleRestart} />}
      </BrowserFrame>
    </div>
  )
}
