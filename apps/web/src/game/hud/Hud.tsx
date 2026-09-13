import type { GameState } from '@ad-jigoku/game-engine'
import type { PatternDefinition, PlayerAction } from '@ad-jigoku/pattern-catalog'
import { ActionBar } from './ActionBar'
import { ComboIndicator } from './ComboIndicator'
import styles from './hud.module.css'
import { PatienceMeter } from './PatienceMeter'
import { formatElapsed, ProgressBar } from './ProgressBar'

/**
 * HUD（TASK-016）。3 リソース（patience / progress / time）+ コンボ + アクションバー。
 * HUD 自体が邪魔になってはいけない。広告（z-popup）より下に置く。
 */
export function availableActions(state: GameState, byId: ReadonlyMap<string, PatternDefinition>): Set<PlayerAction> {
  const set = new Set<PlayerAction>()
  const active = state.ads.filter((a) => a.lifecycle !== 'closing')
  if (active.some((a) => a.lifecycle === 'closable')) set.add('SMASH')
  if (active.some((a) => byId.get(a.patternId)?.game?.correctInaction)) set.add('REPORT')
  for (const a of active) {
    const actions = byId.get(a.patternId)?.game?.playerActions ?? []
    for (const x of actions) if (x === 'DODGE' || x === 'FOCUS' || x === 'ESCAPE') set.add(x)
  }
  return set
}

/**
 * 対抗アクションの対象広告を宿主側で解決する（座標を使わない）。
 * SMASH → 最も threat の高い closable な広告 / REPORT → correctInaction のパターンの広告 / その他 → 最も threat の高い広告
 */
export function resolveActionTarget(state: GameState, byId: ReadonlyMap<string, PatternDefinition>, action: PlayerAction): string | undefined {
  const active = state.ads.filter((a) => a.lifecycle !== 'closing')
  const byThreat = [...active].sort((a, b) => b.threat - a.threat)
  if (action === 'SMASH') return byThreat.find((a) => a.lifecycle === 'closable')?.instanceId
  if (action === 'REPORT') return byThreat.find((a) => byId.get(a.patternId)?.game?.correctInaction)?.instanceId
  return byThreat[0]?.instanceId
}

export function Hud({ state, byId, onAction }: { state: GameState; byId: ReadonlyMap<string, PatternDefinition>; onAction?: (action: PlayerAction) => void }) {
  const available = availableActions(state, byId)
  return (
    <div className={styles.hud} data-testid="hud">
      <div className={styles.top}>
        <div>
          <PatienceMeter value={state.patience} />
          <div style={{ height: 'var(--space-8)' }} />
          <ProgressBar read={state.progress.read} total={state.progress.total} tasksDone={state.progress.tasksDone} tasksTotal={state.progress.tasksTotal} />
        </div>
        <div className={styles.time} aria-label="経過時間" data-testid="hud-time">
          {formatElapsed(state.elapsedMs)}
        </div>
        <ComboIndicator chain={state.combo.chain} namedCombo={state.combo.namedCombo} rageActive={state.rage.active} rageLevel={state.rage.level} />
      </div>
      <ActionBar available={available} {...(onAction ? { onAction } : {})} />
    </div>
  )
}
