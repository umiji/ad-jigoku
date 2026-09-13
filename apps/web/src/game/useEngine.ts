'use client'

import { createRun, type Effect, type GameState, type Intent, type Run, type RunConfig } from '@ad-jigoku/game-engine'
import { useCallback, useEffect, useRef, useState } from 'react'
import { advanceFrame, createLoopState, queueIntent, type LoopState } from './loop'
import { appRegistries } from './registries'

/**
 * エンジンと React を繋ぐ薄い層（TASK-014）。ゲームロジックはここに書かない。
 * - rAF ループ + アキュムレータ（loop.ts）。dt は engine の advance が 200ms でクランプ
 * - document.hidden のとき tick を止める
 * - React の再レンダは 1 フレームに最大 1 回（state 参照が変わったときだけ）
 * - Effect はフレーム毎にまとめて onEffects へ
 */
export type EngineHandle = {
  state: GameState
  run: Run
  dispatch: (intent: Intent) => void
  /** 本文が viewport に見えているか（true の間、毎 tick read intent を送る） */
  setReading: (reading: boolean) => void
  restart: (config?: RunConfig) => void
}

export function useEngine(config: RunConfig, onEffects?: (effects: Effect[], state: GameState) => void): EngineHandle {
  const loopRef = useRef<LoopState | null>(null)
  if (loopRef.current === null) loopRef.current = createLoopState(createRun(config, appRegistries()))
  const [run, setRun] = useState<Run>(() => loopRef.current!.run)
  const readingRef = useRef(false)
  const effectsRef = useRef(onEffects)
  effectsRef.current = onEffects

  const dispatch = useCallback((intent: Intent) => {
    if (loopRef.current) queueIntent(loopRef.current, intent)
  }, [])
  const setReading = useCallback((reading: boolean) => {
    readingRef.current = reading
  }, [])
  const restart = useCallback((next?: RunConfig) => {
    const cfg = next ?? config
    loopRef.current = createLoopState(createRun(cfg, appRegistries()))
    setRun(loopRef.current.run)
  }, [config])

  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const frame = (now: number) => {
      const loop = loopRef.current
      if (loop) {
        const dt = now - last
        last = now
        const hidden = typeof document !== 'undefined' && document.hidden
        const result = advanceFrame(loop, dt, hidden, readingRef.current)
        loop.acc = result.acc
        if (result.run !== loop.run) {
          loop.run = result.run
          setRun(result.run)
        }
        if (result.effects.length > 0) effectsRef.current?.(result.effects, result.run.state)
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    const onVisibility = () => {
      // 復帰時に dt が巨大にならないよう、last を今に合わせる（advance のクランプに加えての保険）
      last = performance.now()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return { state: run.state, run, dispatch, setReading, restart }
}
