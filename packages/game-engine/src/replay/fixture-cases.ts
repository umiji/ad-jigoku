import { MINI_CATALOG } from '../testing/mini-catalog'
import type { RunConfig, ScheduledSpawn } from '../state/types'
import type { StrategyId } from './strategies'

/** 代表的なリプレイ（TASK-012 要件 6）: 通常クリア / patience 0 失敗 / fake close で失敗 / 高コンボ */
export const FIXTURE_CATALOG_VERSION = 'mini-1'

const a11y = { reducedMotion: false, pointerPrecision: 'fine', audioEnabled: false, extendedTimeouts: false } as const

const base: RunConfig = { seed: 'fixture', mode: 'story', stageId: 'stage-1', catalog: MINI_CATALOG, accessibility: a11y, device: 'desktop', contentTotalLines: 40 }

export type FixtureCase = { name: string; config: RunConfig; strategy: StrategyId; maxSteps?: number }

/** 高コンボ用: 8 件のポップアップを 1.5 秒間隔で出す固定スケジュール（schedule は config ごと記録される） */
const comboSchedule: ScheduledSpawn[] = Array.from({ length: 8 }, (_, i) => ({
  instanceId: `combo-${i}`,
  atStep: 30 + i * 90,
  patternId: 'INT-01',
  shellId: 'popup',
  behaviors: { spawn: { id: 'spawn:immediate', params: {} }, close: { id: 'close:instant', params: {} } },
  creativeIndex: i,
}))

export const REPLAY_FIXTURE_CASES: FixtureCase[] = [
  { name: 'clear-optimal', config: { ...base, seed: 'clear-1' }, strategy: 'optimal' },
  { name: 'fail-patience-zero', config: { ...base, seed: 'idle-1', overrides: { PATIENCE_INITIAL: 12 } }, strategy: 'idle', maxSteps: 60 * 120 },
  { name: 'fail-fake-close', config: { ...base, seed: 'fake-1', overrides: { PATIENCE_INITIAL: 30 } }, strategy: 'spam', maxSteps: 60 * 120 },
  { name: 'high-combo', config: { ...base, seed: 'combo-1', contentTotalLines: 120, schedule: comboSchedule }, strategy: 'optimal' },
]
