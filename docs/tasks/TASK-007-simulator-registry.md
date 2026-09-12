# TASK-007 — SimulatorRegistry と ViewState 契約

- Milestone: M1 / Phase 1
- Depends on: 006
- Size: 1 session

## Objective

`PatternSimulator` インターフェースとレジストリを実装し、
`ViewState`（宿主が描画するための宣言的記述）の契約を確定する。

## Context

`ARCHITECTURE.md §7.3`、`GAME_ENGINE_DESIGN.md §7`。
AD-2（パターン追加でエンジンを書き換えない）の実現部分。
**`ViewState` の設計がここで固まると、以降の simulator 実装と UI 実装が並行できる。**

## Files to create

```text
packages/game-engine/src/sim/types.ts         PatternSimulator, SimContext, SimResult
packages/game-engine/src/sim/registry.ts      register / resolve / listRegistered
packages/game-engine/src/sim/view.ts          ViewState
packages/game-engine/src/sim/noop.ts          テスト用のダミー simulator
```

## Implementation requirements

1. `PatternSimulator` は `GAME_ENGINE_DESIGN.md §7` の通り
2. **`ViewState` に DOM の話を書かない。** 論理的な記述のみ:
   ```ts
   type ViewState = {
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
4. `registry.register(sim)` は重複 ID を拒否する
5. `SimContext` に `rng` / `a11y` / `tuning` / `elapsedMs` を渡す。**`state` 全体は渡さない**
   （simulator が他の広告の状態に依存しないようにする＝独立テスト可能にする / GAME §25.4）
6. `step()` に simulator 呼び出しを組み込む:
   `tick` → 全 active ad の `onTick`、`point`/`action` → 対象 ad の `onIntent`
7. `SimResult.outcome` をエンジンが解釈して state を更新する。simulator は state を触らない

## Acceptance criteria

- [ ] noop simulator を登録してゲームに出せる
- [ ] `MotionCue` / `surface` の全値が `DESIGN.md §8, §14, §15` の語彙と対応している
- [ ] `SimContext` に `GameState` が含まれていない
- [ ] 未登録の `simulatorId` を持つパターンをステージに入れようとするとエラーになる
- [ ] `ViewState` に DOM / CSS の型が一切出てこない

## Test requirements

- レジストリの重複登録拒否
- noop simulator を使った spawn → tick → close の一連の流れ
- simulator が他の広告の状態にアクセスできないことのテスト（型レベルで十分）

## Definition of Done

- acceptance criteria を全て満たす
- `ViewState` の各フィールドについて「UI 側が何を描くか」が README に1行ずつ書かれている
  （TASK-014 の実装者がこれだけ読めば描画できる状態）
