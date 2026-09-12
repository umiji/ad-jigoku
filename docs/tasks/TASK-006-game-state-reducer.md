# TASK-006 — GameState と step() reducer 骨格

- Milestone: M1 / Phase 1
- Depends on: 004, 005
- Size: 1 session

## Objective

`GameState` 型と `step(run, intent) => { state, effects }` の骨格を実装する。
この時点では simulator がないので、広告は出ない。**状態機械の器だけ作る。**

## Context

`GAME_ENGINE_DESIGN.md §2-§4`。以降の全機能がこの reducer に集約される。

## Files to create

```text
packages/game-engine/src/state/types.ts       GameState, ActiveAd, EncounterEvent
packages/game-engine/src/state/intent.ts      Intent, TargetRef
packages/game-engine/src/state/effect.ts      Effect
packages/game-engine/src/run.ts               createRun / step / hashState 公開API
packages/game-engine/src/config.ts            EngineTuning（調整可能な定数を1箇所に）
packages/game-engine/src/index.ts
```

## Implementation requirements

1. `GameState` は `GAME_ENGINE_DESIGN.md §3` の構造どおり
2. `ActiveAd.closableAtStep` は `number`。**`null` を許さない**（SAFE-01 を型で守る / §3.1）
3. `step()` は純粋関数。`state` を破壊的に変更しない（構造共有はしてよい）
4. `Intent` の種類を全部受け付ける。未実装の処理は明示的な TODO ではなく、
   **型網羅チェック（`never` による exhaustive check）で漏れが検出される形**にする
5. `Effect` は返すだけ。エンジンは実行しない
6. `EngineTuning` に調整値を集約:
   `MAX_CLOSE_DELAY_MS`, `MAX_CONCURRENT_ADS_MOBILE/DESKTOP`, `PATIENCE_INITIAL`,
   `PATIENCE_RECOVERY_PER_CLEAN_CLEAR` など。マジックナンバーをコードに散らさない
7. `AccessibilityProfile` を `RunConfig` の必須フィールドにする（AD-8）
8. `log: EncounterEvent[]` に全ての意味ある出来事を記録する。
   これが結果画面の「今回の主犯」（GAME §20）と失敗の説明可能性（§15.1）の根拠になる

## Acceptance criteria

- [ ] `createRun()` → `step()` × N が型エラーなく通る
- [ ] `step()` が入力の `run` を変更しない（freeze したオブジェクトでも動く）
- [ ] `Intent` に新しい種類を追加すると、処理漏れが typecheck で落ちる
- [ ] `MAX_CLOSE_DELAY_MS` 等の調整値がすべて `config.ts` にある
- [ ] `AccessibilityProfile` を省略すると型エラーになる

## Test requirements

- 不変性テスト（`Object.freeze` した state を渡しても例外が出ない）
- tick を N 回進めると `elapsedMs` が `N * STEP_MS` になる
- 同一 seed / 同一 intent 列で `hashState` が一致する

## Definition of Done

- acceptance criteria を全て満たす
- この時点でブラウザなしで「何も起きないゲーム」が 60 秒分回せる
