/**
 * シェルレジストリ（TASK-013A req.5 / 013B）。
 * 「id が重複しない」「宣言とコンポーネントが 1:1」だけを見る。
 * engine の `MVP_SHELLS` との一致は宿主側（apps/web/src/game/shells.test.ts）で検査する。
 */
import { describe, expect, it } from 'vitest'
import { SHELL_COMPONENTS, SHELL_DESCRIPTORS } from './registry'

const EXPECTED = ['popup', 'interstitial', 'stickyBanner', 'inlineRect', 'videoPlayer', 'densityStack']

describe('shell registry', () => {
  it('TASK-013A / 013B の 6 シェルを宣言している（fakeDownload / fakePlay は 013C）', () => {
    expect(SHELL_DESCRIPTORS.map((s) => s.id)).toEqual(EXPECTED)
  })

  it('id が重複しない', () => {
    const ids = SHELL_DESCRIPTORS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('宣言とコンポーネントが 1:1', () => {
    expect(Object.keys(SHELL_COMPONENTS).sort()).toEqual([...EXPECTED].sort())
    for (const descriptor of SHELL_DESCRIPTORS) {
      expect(typeof SHELL_COMPONENTS[descriptor.id]).toBe('function')
    }
  })

  it('parts / supports が空のシェルは無い', () => {
    for (const descriptor of SHELL_DESCRIPTORS) {
      expect(descriptor.parts.length).toBeGreaterThan(0)
      expect(descriptor.supports).toContain('spawn')
    }
  })
})
