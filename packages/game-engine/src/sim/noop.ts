import { SLOTS, type Slot } from '@ad-jigoku/pattern-catalog'
import { noChange, type Behavior, type Shell } from './types'

/**
 * テスト用のダミー shell + behavior（TASK-007）。
 * 挙動は何もしない。エンジンの既定処理（× を押したら閉じる 等）だけでゲームが成立することを確認するために使う。
 */
export const noopShell: Shell = {
  id: 'noop',
  parts: ['label', 'body', 'cta', 'close'],
  supports: [...SLOTS],
  surface: 'overlay',
  sizeHint: 'medium',
}

export function noopBehavior(slot: Slot): Behavior<null> {
  return {
    id: `${slot}:noop`,
    slot,
    friction: 0,
    load: 1,
    init: () => noChange(null),
    onTick: (sim) => noChange(sim),
    onIntent: (sim) => noChange(sim),
  }
}
