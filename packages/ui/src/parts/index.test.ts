/**
 * parts/index.ts は allowlist（TASK-013 deliverable 10）。
 * ここに載っていないものを外に出さない＝シェル側が勝手な部位を生やせない。
 */
import { describe, expect, it } from 'vitest'
import * as parts from './index'

const ALLOWED = [
  'AdBody',
  'AdCTA',
  'AdCountdown',
  'AdCreative',
  'AdHeadline',
  'AdLegal',
  'AdMeta',
  'CloseButton',
  'FakeCloseButton',
  'adCopy',
  'fillCopy',
  'resolvePartState',
] as const

describe('parts allowlist', () => {
  it('公開しているのは canonical な部位とコピー辞書だけ', () => {
    expect(Object.keys(parts).sort()).toEqual([...ALLOWED].sort())
  })

  it('コピーはコンポーネントではなくデータとして外に出ている（OD-9）', () => {
    expect(typeof parts.adCopy.close.ariaLabel).toBe('string')
    expect(parts.adCopy.label.pr).toBe('PR')
  })
})
