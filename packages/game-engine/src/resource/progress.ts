import type { EngineTuning } from '../config'
import type { GameState } from '../state/types'
import { withPatience } from '../engine/outcome'

/**
 * Progress（GAME §5.1 A / TASK-009 要件 1）。
 * - `{ t: 'read' }` intent が来ているステップだけ `read` が進む（宿主は本文が viewport に見えている間だけ送る）
 * - 広告が本文を覆っている間（`ad.blocksProgress`）は進まない
 * - 読む速度は一定（反射神経ゲームにしないため）
 */
export function isProgressBlocked(state: GameState): boolean {
  return state.ads.some((a) => a.blocksProgress && a.lifecycle !== 'closing')
}

export function applyRead(state: GameState, tuning: EngineTuning): GameState {
  if (isProgressBlocked(state)) return state
  const total = state.progress.total
  if (state.progress.read >= total) return state
  const read = Math.min(total, state.progress.read + tuning.READ_LINES_PER_SECOND / 60)
  return { ...state, progress: { ...state.progress, read } }
}

export type QuestionKey = { id: string; correctChoice: number }

/**
 * 設問（TASK-015 / OD-5「記事内の設問に 1 つ答える」）。
 * 正答で tasksDone++。誤答は progress を戻さないが patience を削る。同じ設問への再回答は無視。
 */
export function applyAnswer(state: GameState, questions: readonly QuestionKey[], questionId: string, choice: number, tuning: EngineTuning): GameState {
  const q = questions.find((x) => x.id === questionId)
  if (!q) return state
  if (state.answered[questionId]) return state
  if (choice === q.correctChoice) {
    return {
      ...state,
      answered: { ...state.answered, [questionId]: true },
      progress: { ...state.progress, tasksDone: state.progress.tasksDone + 1 },
      log: [...state.log, { step: state.step, kind: 'answer', detail: `${questionId}:correct` }],
    }
  }
  const penalized = withPatience(state, -tuning.PATIENCE_PENALTY_WRONG_ANSWER, { step: state.step, kind: 'mistake', reason: 'wrong-answer', detail: questionId })
  return { ...penalized, mistakes: { ...penalized.mistakes, 'wrong-answer': penalized.mistakes['wrong-answer'] + 1 }, combo: { ...penalized.combo, chain: 0 } }
}
