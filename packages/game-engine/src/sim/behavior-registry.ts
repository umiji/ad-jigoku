import type { BehaviorId, Slot } from '@ad-jigoku/pattern-catalog'
import type { Behavior } from './types'

export class BehaviorRegistry {
  private readonly behaviors = new Map<BehaviorId, Behavior<unknown>>()

  register<S>(behavior: Behavior<S>): this {
    if (this.behaviors.has(behavior.id)) throw new Error(`BehaviorRegistry: 重複した BehaviorId "${behavior.id}"`)
    if (!behavior.id.startsWith(`${behavior.slot}:`)) {
      throw new Error(`BehaviorRegistry: "${behavior.id}" の接頭辞がスロット "${behavior.slot}" と一致しない`)
    }
    this.behaviors.set(behavior.id, behavior as Behavior<unknown>)
    return this
  }

  has(id: BehaviorId): boolean {
    return this.behaviors.has(id)
  }

  /** スロット不一致を拒否する */
  resolve(id: BehaviorId, slot: Slot): Behavior<unknown> {
    const b = this.behaviors.get(id)
    if (!b) throw new Error(`BehaviorRegistry: 未登録の BehaviorId "${id}"`)
    if (b.slot !== slot) throw new Error(`BehaviorRegistry: "${id}" はスロット "${b.slot}" だが "${slot}" に割り当てられた`)
    return b
  }

  listRegistered(): Behavior<unknown>[] {
    return [...this.behaviors.values()]
  }

  /** V-05 / V-07 用: behaviorId → slot */
  toImplementationMap(): Map<string, Slot> {
    return new Map([...this.behaviors.values()].map((b) => [b.id, b.slot]))
  }
}
