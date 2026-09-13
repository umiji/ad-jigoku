import type { ShellId, Slot } from '@ad-jigoku/pattern-catalog'
import type { Shell } from './types'

export class ShellRegistry {
  private readonly shells = new Map<ShellId, Shell>()

  register(shell: Shell): this {
    if (this.shells.has(shell.id)) throw new Error(`ShellRegistry: 重複した ShellId "${shell.id}"`)
    this.shells.set(shell.id, shell)
    return this
  }

  has(id: ShellId): boolean {
    return this.shells.has(id)
  }

  resolve(id: ShellId): Shell {
    const shell = this.shells.get(id)
    if (!shell) throw new Error(`ShellRegistry: 未登録の ShellId "${id}"（登録済み: ${[...this.shells.keys()].join(', ') || 'なし'}）`)
    return shell
  }

  listRegistered(): Shell[] {
    return [...this.shells.values()]
  }

  /** V-05 / V-13 用: id → supports のマップ（pattern-catalog の validateCatalog に注入する） */
  toImplementationMap(): Map<string, readonly Slot[]> {
    return new Map([...this.shells.values()].map((s) => [s.id, s.supports]))
  }

  /** 生成時の検証: shell.supports ⊇ 使用スロット（R2 / V-13） */
  assertSupports(id: ShellId, slots: readonly Slot[]): Shell {
    const shell = this.resolve(id)
    const missing = slots.filter((s) => !shell.supports.includes(s))
    if (missing.length > 0) {
      throw new Error(`ShellRegistry: shell "${id}" はスロット ${missing.join(', ')} を supports に含まない（supports: ${shell.supports.join(', ')}）`)
    }
    return shell
  }
}
