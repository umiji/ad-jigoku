import { advance, step, type Effect, type Intent, type Run } from '@ad-jigoku/game-engine'

/**
 * 固定タイムステップの宿主ループ（GAME_ENGINE_DESIGN §5 / TASK-014 要件 1-2）。
 * React から独立した純粋な「駆動器」。rAF と document.visibility は呼び出し側（useEngine）が渡す。
 *
 * - 可変 dt をアキュムレータで固定ステップに分割（200ms クランプは engine の advance が担う）
 * - 各 tick の前に、フレーム内で溜まった intent を順に適用する（記録は step index 単位）
 * - hidden の間は進めない（バックグラウンドで patience が減り続けない）
 */
export type LoopState = { run: Run; acc: number; pendingIntents: Intent[] }

export type FrameResult = { run: Run; acc: number; effects: Effect[]; steps: number }

export function createLoopState(run: Run): LoopState {
  return { run, acc: 0, pendingIntents: [] }
}

export function queueIntent(loop: LoopState, intent: Intent): void {
  loop.pendingIntents.push(intent)
}

/** 1 フレーム進める。純粋: 新しい run と effects を返す（loop.pendingIntents は消費される） */
export function advanceFrame(loop: LoopState, dtMs: number, hidden: boolean, readEachTick: boolean): FrameResult {
  const effects: Effect[] = []
  let run = loop.run
  const intents = loop.pendingIntents.splice(0)
  // 溜まった intent は最初の tick の前に適用する（hidden でも入力だけは反映する）
  for (const intent of intents) {
    const r = step(run, intent)
    run = r.run
    effects.push(...r.effects)
  }
  if (hidden || run.state.phase !== 'running') return { run, acc: 0, effects, steps: 0 }
  const { steps, acc } = advance(loop.acc, dtMs)
  for (let i = 0; i < steps; i++) {
    if (readEachTick) {
      const rr = step(run, { t: 'read' })
      run = rr.run
      effects.push(...rr.effects)
    }
    const r = step(run, { t: 'tick' })
    run = r.run
    effects.push(...r.effects)
    if (run.state.phase !== 'running') break
  }
  return { run, acc, effects, steps }
}
