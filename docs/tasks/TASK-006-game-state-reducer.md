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

---

## 進捗記録

- 状態: 完了（2026-09-13）

### 決定ログ

#### 2026-09-13 RNG 状態と a11y プロファイルを GameState に含める
- 決定: `GameState.rng: RngState`（ストリーム毎の uint32）と `GameState.a11y` を state に持つ。`{ t: 'a11y' }` intent は state を部分更新する
- 却下案: RNG を Run の外部閉包に置く → `hashState` に含められず途中スナップショットからの再生が不可能（TASK-005 の決定を踏襲）
- 出典: GAME_ENGINE_DESIGN §3, §6

#### 2026-09-13 ActiveAd は v0.2 の Shell × Behaviors 構造
- 決定: 設計文書 §3 の `simulatorId` / `sim: unknown` を `shellId` + `behaviors: Partial<Record<Slot, { id, params, sim }>>` に置き換える（ADR-009 の 2 軸モデルに追従）。`closableAtStep` は `number`（null 不可）
- 却下案: 文書どおり `simulatorId` → v0.1 の廃止済み概念
- 出典: ADR-009 / PATTERN_SCHEMA §3

#### 2026-09-13 RunConfig に device と schedule（テスト用）を追加
- 決定: 同時出現上限・LOAD_BUDGET が端末別のため `device: 'mobile' | 'desktop'` を必須にし、生成器（TASK-008）を通さずに出現列を注入できる `schedule?` をテスト・デバッグ用に持つ
- 却下案: なし
- 出典: GAME_ENGINE_DESIGN §8.2 R5 / DESIGN §19

### 作業ログ

- 2026-09-13: `config.ts`（EngineTuning 集約）、`state/{types,intent,effect}.ts`、`sim/view.ts`（ViewState 契約。TASK-007 で確定）、`run.ts`（createRun / step / hashState。never 網羅チェック）、テスト 7 件。

### 証拠

```text
$ pnpm --filter @ad-jigoku/game-engine typecheck lint test → 5 files, 28 tests passed
  - createRun → tick×3600: elapsedMs=60000、phase running、ads []（60 秒分の「何も起きないゲーム」）
  - deep-freeze した run に全 intent を投げても例外なし、元 hash 不変
  - 同一 seed / intent 列で hashState 一致
  - failed 後の tick は run をそのまま返す
```
