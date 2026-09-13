import { MVP_SHELLS } from '@ad-jigoku/game-engine'
import { SHELL_DESCRIPTORS } from '@ad-jigoku/ui'
import { describe, expect, it } from 'vitest'
import { SHELL_COMPONENTS } from './shells'

/**
 * エンジンの宣言（packages/game-engine/src/sim/shells.ts）と UI の宣言
 * （packages/ui/src/shells の各 descriptor.ts）の整合（TASK-013A acceptance / 013B）。
 *
 * `supports` は生成器の R2 シェル互換検証の入力（GAME_ENGINE_DESIGN §8.2）なので、
 * ここがずれると「そのスロットの挙動を差せるはずのシェル」が実際には描けない、という形で
 * 静かに壊れる。だから 2 か所に書いた宣言を機械的に突き合わせる。
 */
const UI_BY_ID = new Map(SHELL_DESCRIPTORS.map((s) => [s.id, s]))

/** TASK-013C で実装される。engine にはあるが UI にはまだ無い */
const NOT_YET_IMPLEMENTED = ['fakeDownload', 'fakePlay']

describe('shell registry parity（engine ↔ ui）', () => {
  it.each(MVP_SHELLS.filter((s) => !NOT_YET_IMPLEMENTED.includes(s.id)).map((s) => s.id))(
    '%s: UI に実装があり、parts / supports が engine と一致する',
    (id) => {
      const engine = MVP_SHELLS.find((s) => s.id === id)
      const ui = UI_BY_ID.get(id)
      expect(ui, `${id} の UI 宣言が無い`).toBeDefined()
      expect(ui?.parts).toEqual(engine?.parts)
      expect(ui?.supports).toEqual(engine?.supports)
      expect(typeof SHELL_COMPONENTS[id]).toBe('function')
    },
  )

  it('fakeDownload / fakePlay は engine にだけあり、UI は未実装（TASK-013C）', () => {
    for (const id of NOT_YET_IMPLEMENTED) {
      expect(MVP_SHELLS.map((s) => s.id)).toContain(id)
      expect(UI_BY_ID.has(id)).toBe(false)
      expect(SHELL_COMPONENTS[id]).toBeUndefined()
    }
  })

  it('UI 側に engine が知らないシェルは無い', () => {
    const engineIds = new Set(MVP_SHELLS.map((s) => s.id))
    for (const id of Object.keys(SHELL_COMPONENTS)) expect(engineIds.has(id)).toBe(true)
  })

  it('コンポーネントと descriptor が 1:1（登録漏れも重複も無い）', () => {
    expect(Object.keys(SHELL_COMPONENTS).sort()).toEqual(SHELL_DESCRIPTORS.map((s) => s.id).sort())
  })
})
