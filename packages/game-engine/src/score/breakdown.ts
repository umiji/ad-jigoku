import type { GameState, ScoreState } from '../state/types'

/** 結果画面用の内訳（GAME §20）。合計 = 各行の和 であることを scoring.test.ts が検証する */
export type ScoreBreakdownRow = { key: keyof Omit<ScoreState, 'total'>; label: { ja: string }; value: number; sign: '+' | '-' }

export function scoreBreakdown(score: ScoreState): { rows: ScoreBreakdownRow[]; total: number } {
  const rows: ScoreBreakdownRow[] = [
    { key: 'completion', label: { ja: '読了' }, value: score.completion, sign: '+' },
    { key: 'clearPoints', label: { ja: '広告処理' }, value: score.clearPoints, sign: '+' },
    { key: 'triageBonus', label: { ja: '優先順位（triage）' }, value: score.triageBonus, sign: '+' },
    { key: 'comboBonus', label: { ja: '連続処理（chain）' }, value: score.comboBonus, sign: '+' },
    { key: 'speedBonus', label: { ja: '速度' }, value: score.speedBonus, sign: '+' },
    { key: 'accuracyBonus', label: { ja: 'クリーンプレイ' }, value: score.accuracyBonus, sign: '+' },
    { key: 'survivalBonus', label: { ja: '残り忍耐' }, value: score.survivalBonus, sign: '+' },
    { key: 'damagePenalty', label: { ja: 'ミス' }, value: score.damagePenalty, sign: '-' },
    { key: 'timePenalty', label: { ja: '時間' }, value: score.timePenalty, sign: '-' },
  ]
  return { rows, total: score.total }
}

export function sumBreakdown(score: ScoreState): number {
  return scoreBreakdown(score).rows.reduce((acc, r) => acc + (r.sign === '+' ? r.value : -r.value), 0)
}

export function mistakeSummary(state: GameState): { reason: string; count: number }[] {
  return Object.entries(state.mistakes)
    .filter(([, n]) => n > 0)
    .map(([reason, count]) => ({ reason, count }))
}
