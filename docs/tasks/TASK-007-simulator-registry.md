# TASK-007 — BehaviorRegistry + ShellRegistry と ViewState 契約

- Milestone: M1 / Phase 1
- Depends on: 006
- Size: 1 session

> **v0.2 改訂**: 本タスクは v0.1 の「SimulatorRegistry」を「BehaviorRegistry + ShellRegistry」に
> 差し替える（`DECISIONS_v0.2.md` §1, ADR-009）。

## Objective

`Shell` / `Behavior` インターフェースと2つのレジストリを実装し、
`ViewState`（宿主が描画するための宣言的記述）の契約を確定する。

## Context

`ARCHITECTURE.md §7.3`、`GAME_ENGINE_DESIGN.md §7`。
AD-2（パターン追加でエンジンを書き換えない）の実現部分。
**`ViewState` の設計がここで固まると、以降の shell/behavior 実装と UI 実装が並行できる。**

## Files to create

```text
packages/game-engine/src/sim/types.ts         Shell, Behavior, SimContext, BehaviorResult
packages/game-engine/src/sim/shell-registry.ts       register / resolve / listRegistered (Shell)
packages/game-engine/src/sim/behavior-registry.ts    register / resolve / listRegistered (Behavior)
packages/game-engine/src/sim/view.ts          ViewState
packages/game-engine/src/sim/noop.ts          テスト用のダミー shell + behavior
```

## Implementation requirements

1. `Shell` / `Behavior` は `GAME_ENGINE_DESIGN.md §7` の通り
2. **`ViewState` に DOM の話を書かない。** 論理的な記述のみ:
   ```ts
   type ViewState = {
     shellId: ShellId                 // ★ v0.2 追加。どの Shell コンポーネントで描画するか
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
4. `shellRegistry.register(shell)` / `behaviorRegistry.register(behavior)` はそれぞれ重複 ID を拒否する
5. `SimContext` に `rng` / `a11y` / `tuning` / `elapsedMs` を渡す。**`state` 全体は渡さない**
   （behavior が他の広告の状態に依存しないようにする＝独立テスト可能にする / GAME §25.4）
6. `step()` に呼び出しを組み込む:
   `tick` → 全 active ad の各アクティブ behavior の `onTick`、`point`/`action` → 対象 ad の
   対象 behavior の `onIntent`
7. `BehaviorResult.outcome` をエンジンが解釈して state を更新する。behavior は state を触らない
8. 生成時に `shell.supports ⊇ 使用スロット` を検証する（V-13。`PATTERN_SCHEMA.md §8`）

## Acceptance criteria

- [ ] noop shell + noop behavior を登録してゲームに出せる
- [ ] `MotionCue` / `surface` の全値が `DESIGN.md §8, §14, §15` の語彙と対応している
- [ ] `SimContext` に `GameState` が含まれていない
- [ ] 未登録の `shellId` を持つパターンをステージに入れようとするとエラーになる
- [ ] `shell.supports` に含まれないスロットへの behavior 割り当てがエラーになる
- [ ] `ViewState` に DOM / CSS の型が一切出てこない

## Test requirements

- 両レジストリの重複登録拒否
- noop shell/behavior を使った spawn → tick → close の一連の流れ
- behavior が他の広告の状態にアクセスできないことのテスト（型レベルで十分）
- `shell.supports` 検証のテスト（違反時にエラーになること）

## Definition of Done

- acceptance criteria を全て満たす
- `ViewState` の各フィールドについて「UI 側が何を描くか」が README に1行ずつ書かれている
  （TASK-014 の実装者がこれだけ読めば描画できる状態）

---

## 進捗記録

- 状態: 完了（2026-09-13）

### 決定ログ

#### 2026-09-13 Behavior.init は BehaviorResult を返し、closeDelayMs を任意メソッドで宣言する
- 決定: `init(params, ctx): BehaviorResult<S>`（sim + 初期 view の上書きを同時に返せる）。閉じられるまでの遅延は `closeDelayMs?(params, ctx)` で宣言し、エンジンが SAFE-01 の上限で clamp して `closableAtStep` を決める
- 却下案: 設計文書の `init(): S`（sim のみ）→ 初期 ViewState を返す手段がなく、最初の tick まで見た目が決まらない
- 出典: GAME_ENGINE_DESIGN §7 を拡張（互換: sim のみ返す実装も `{ sim }` で書ける）

#### 2026-09-13 × / CTA / SMASH / REPORT の既定ルールはエンジン側に置く
- 決定: behavior が `handled` / `outcome` を返さない intent には `engine/intent.ts` の既定処理（closable なら閉じる、早押しは too-early、偽× は fake-close、CTA は clicked-ad、REPORT は correctInaction のパターンのみ正解）を適用する
- 却下案: 全 behavior に閉じる処理を実装させる → 20 個の behavior で同じコードが重複し、noop behavior でゲームが成立しない
- 出典: session decision（TASK-007 acceptance「noop でゲームに出せる」）

#### 2026-09-13 Shell 宣言に surface / sizeHint の既定値を持たせる
- 決定: エンジン側 `Shell` は id / parts / supports / frame に加えて既定の `surface` / `sizeHint` を持つ（behavior が上書き可）
- 却下案: shell 毎の既定レイアウトを UI 側だけに持つ → ViewState.surface が決まらず、blocksProgress（fullscreen）の判定がエンジンでできない
- 出典: session decision

#### 2026-09-13 レジストリは Run に注入する（既定はモジュール単一）
- 決定: `createRun(config, registries = defaultRegistries)`。`Run.registries` はシリアライズ対象外（リプレイは config + intents で再現）
- 却下案: RunConfig に含める → ReplayRecord に関数が混入する
- 出典: session decision

### 作業ログ

- 2026-09-13: sim/{types,shell-registry,behavior-registry,registries,noop,spawn}.ts、engine/{context,tick,intent,outcome}.ts、run.ts への組み込み、テスト 11 件、README（ViewState の各フィールドを UI が何を描くか）。

### 証拠

```text
$ pnpm --filter @ad-jigoku/game-engine typecheck lint test → 7 files, 46 tests passed
  - 重複登録拒否 / スロット不一致拒否 / 接頭辞不一致拒否
  - noop: schedule → spawn(entering) → visible → closable → point(close) → closing → 除去
  - 未登録 shell で例外（"未登録の ShellId"）/ supports 外スロットで例外
  - MAX_CONCURRENT_ADS(mobile=2) で 3 件目を持ち越し
  - 同一 seed で hashState 一致（rng state 含む）
```
