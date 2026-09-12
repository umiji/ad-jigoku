# TASK-007 — BehaviorRegistry + ShellRegistry と ViewState 契約

- Milestone: M1 / Phase 1
- Depends on: 006
- Size: 1 session
- **DECISIONS_v0.2.md §1 により改訂**: 旧「SimulatorRegistry」1本を「BehaviorRegistry + ShellRegistry」の
  2レジストリに置き換える

## Objective

`Shell` / `Behavior` インターフェースとそれぞれのレジストリ（`ShellRegistry` / `BehaviorRegistry`）を実装し、
`ViewState`（宿主が描画するための宣言的記述）の契約を確定する。

## Context

`ARCHITECTURE.md §7.3`、`GAME_ENGINE_DESIGN.md §7`。
AD-2（パターン追加でエンジンを書き換えない）の実現部分。v0.1 の `PatternSimulator` は撤回済み
（見た目と挙動を分離できないため）。**`ViewState` の設計がここで固まると、以降の Shell/Behavior 実装と
UI 実装が並行できる。**

## Files to create

```text
packages/game-engine/src/shell/types.ts       Shell
packages/game-engine/src/shell/registry.ts    ShellRegistry: register / resolve / listRegistered
packages/game-engine/src/behavior/types.ts    Behavior, SimContext, BehaviorResult
packages/game-engine/src/behavior/registry.ts BehaviorRegistry: register / resolve / listRegistered
packages/game-engine/src/sim/view.ts          ViewState
packages/game-engine/src/sim/noop.ts          テスト用のダミー shell + behavior
```

## Implementation requirements

1. `Shell` / `Behavior` は `GAME_ENGINE_DESIGN.md §7` の通り
2. **`ViewState` に DOM の話を書かない。** 論理的な記述のみ:
   ```ts
   type ViewState = {
     shellId: ShellId                 // v0.2 §1.3。旧 simulatorId を置き換え。UI 側の描画コンポーネント選択に使う
     surface: 'overlay' | 'sticky-bottom' | 'sticky-top' | 'inline' | 'corner' | 'fullscreen'
     anchor?: { xPercent: number; yPercent: number }
     sizeHint: 'small' | 'medium' | 'large' | 'fullscreen'
     creative: CreativeRef            // どのダミー広告素材を使うか
     parts: AdPartState[]             // close / fake-close / cta / media の可視状態と有効性
     motion: MotionCue[]              // 'enter-slide' | 'shake' | 'drift' ...
     countdown?: { remainingMs: number }
     stackIndex: number               // z 順。具体的な z-index はトークンが決める
   }
   ```
3. `AdPartState` は `{ part, visible, enabled, emphasis, hitboxScale }`。
   `hitboxScale` は `pointerPrecision: 'coarse'` のとき最小 44px を保証するために使う
4. `ShellRegistry.register(shell)` / `BehaviorRegistry.register(behavior)` はそれぞれ重複 ID を拒否する
5. 生成器・エンジンは `shell.supports ⊇ 使用する behaviors のスロット集合` を検証する
   （`GAME_ENGINE_DESIGN.md §8.3` R2。ここでは型と検証関数だけ用意し、実際の生成は TASK-008）
6. `SimContext` に `rng` / `a11y` / `tuning` / `elapsedMs` を渡す。**`state` 全体は渡さない**
   （behavior が他の広告の状態に依存しないようにする＝独立テスト可能にする / GAME §25.4）
7. `step()` に呼び出しを組み込む: `tick` → 全 active ad の各 slot の `onTick`、
   `point`/`action` → 対象 ad の対象 slot の `onIntent`
8. `BehaviorResult.outcome` をエンジンが解釈して state を更新する。behavior は state を触らない

## Acceptance criteria

- [ ] noop shell + noop behavior を登録してゲームに出せる
- [ ] `MotionCue` / `surface` の全値が `DESIGN.md §8, §14, §15` の語彙と対応している
- [ ] `SimContext` に `GameState` が含まれていない
- [ ] 未登録の `shellId` / `behaviors[*].id` を持つパターンをステージに入れようとするとエラーになる
- [ ] `shell.supports` に含まれないスロットへ behavior を差そうとするとエラーになる
- [ ] `ViewState` に DOM / CSS の型が一切出てこない
- [ ] `ViewState.shellId` が UI 側のコンポーネント選択に使えることをサンプルで確認済み

## Test requirements

- 各レジストリの重複登録拒否
- noop shell + noop behavior を使った spawn → tick → close の一連の流れ
- `shell.supports` を満たさない組み合わせを拒否するテスト
- behavior が他の広告の状態にアクセスできないことのテスト（型レベルで十分）

## Definition of Done

- acceptance criteria を全て満たす
- `ViewState` の各フィールドについて「UI 側が何を描くか」が README に1行ずつ書かれている
  （TASK-014 の実装者がこれだけ読めば描画できる状態）
