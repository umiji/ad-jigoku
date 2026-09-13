import { createRun, fixtureRegistries, MINI_CATALOG, step, type GameState } from '@ad-jigoku/game-engine'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { intentFromEvent } from '../intentFromEvent'
import { ActionBar } from './ActionBar'
import { availableActions, Hud, resolveActionTarget } from './Hud'
import { formatElapsed } from './ProgressBar'

const a11y = { reducedMotion: false, pointerPrecision: 'fine', audioEnabled: false, extendedTimeouts: false } as const
const byId = new Map(MINI_CATALOG.map((p) => [p.id, p]))
function stateAt(steps: number): GameState {
  let run = createRun({ seed: 'hud', mode: 'story', stageId: 'stage-1', catalog: MINI_CATALOG, accessibility: a11y, device: 'desktop' }, fixtureRegistries())
  for (let i = 0; i < steps; i++) run = step(run, { t: 'tick' }).run
  return run.state
}

describe('HUD (TASK-016)', () => {
  it('shows the three resources and time', () => {
    const state = stateAt(120)
    render(<Hud state={state} byId={byId} />)
    expect(screen.getByTestId('patience-meter').getAttribute('aria-valuenow')).toBe(String(Math.round(state.patience)))
    expect(screen.getByTestId('progress-bar').getAttribute('aria-valuenow')).toBe('0')
    expect(screen.getByTestId('hud-time').textContent).toBe('00:02')
    expect(formatElapsed(61500)).toBe('01:01')
  })

  it('action bar: unavailable actions are disabled; available ones fire data-action intents and keyboard labels', () => {
    const onAction = vi.fn()
    render(<ActionBar available={new Set(['SMASH'])} onAction={onAction} />)
    const smash = screen.getByRole('button', { name: /SMASH/ })
    const dodge = screen.getByRole('button', { name: /DODGE/ })
    expect(smash.hasAttribute('disabled')).toBe(false)
    expect(dodge.hasAttribute('disabled')).toBe(true)
    expect(dodge.getAttribute('aria-label')).toContain('いまは使えません')
    expect(smash.getAttribute('aria-keyshortcuts')).toBe('1')
    fireEvent.click(smash)
    expect(onAction).toHaveBeenCalledTimes(1)
    expect(onAction).toHaveBeenCalledWith('SMASH')
    // 宿主の click 委譲（intentFromEvent）とは二重に発火しない: data-action を持たない
    expect(intentFromEvent({ target: smash })).toBeNull()
    // 広告の語彙を使わない（sticky 広告と混同させない）
    const bar = screen.getByTestId('action-bar')
    expect(bar.textContent).not.toMatch(/PR|Sponsored|閉じる|×/)
  })

  it('availableActions: SMASH only when something is closable, REPORT only for correctInaction patterns', () => {
    const none = stateAt(0)
    expect([...availableActions(none, byId)]).toEqual([])
    const later = stateAt(80) // 最初の広告が closable になっている
    expect(later.ads.some((a) => a.lifecycle === 'closable')).toBe(true)
    expect(availableActions(later, byId).has('SMASH')).toBe(true)
    expect(availableActions(later, byId).has('REPORT')).toBe(false)
    const deception = { ...later, ads: later.ads.map((a) => ({ ...a, patternId: 'DEC-02' as const })) }
    const dec = new Map(byId)
    dec.set('DEC-02', { ...byId.get('DEC-02')!, game: { ...byId.get('DEC-02')!.game!, correctInaction: true } })
    expect(availableActions(deception, dec).has('REPORT')).toBe(true)
  })

  it('resolveActionTarget: SMASH → 最も threat の高い closable、REPORT → correctInaction の広告、対象がなければ undefined', () => {
    const none = stateAt(0)
    expect(resolveActionTarget(none, byId, 'SMASH')).toBeUndefined()
    const later = stateAt(80)
    const closable = later.ads.filter((a) => a.lifecycle === 'closable').sort((a, b) => b.threat - a.threat)[0]
    expect(resolveActionTarget(later, byId, 'SMASH')).toBe(closable?.instanceId)
    expect(resolveActionTarget(later, byId, 'REPORT')).toBeUndefined()
  })

  it('combo indicator distinguishes enemy combos from player chain', () => {
    const state = { ...stateAt(0), combo: { chain: 3, bestChain: 3, activeTags: [], namedCombosSeen: ['閉じさせる気がない'], namedCombo: '閉じさせる気がない' }, rage: { meter: 3, active: false, level: 0 } }
    render(<Hud state={state} byId={byId} />)
    expect(screen.getByTestId('combo-enemy').textContent).toContain('食らっている')
    expect(screen.getByTestId('combo-chain').textContent).toBe('3 CHAIN')
    expect(screen.queryByTestId('combo-rage')).toBeNull()
  })
})
