# TASK-021 — persist slot behavior: respawn / multi-layer（PER-01 / PER-02）

- Milestone: M3 / Phase 1
- Depends on: 017, 013B
- Size: 1 session

> **v0.2 改訂**: 「simulator」を「behavior（`persist` スロット）」に読み替える。TASK-020 の
> sticky-persist とは別パラメータの `persist` behavior（respawn/multi-layer）として実装する。
> **前提条件: 対応する Shell（`densityStack`）が実装済みであること**（TASK-013B）。

## Objective

「閉じても終わらない」系のパターンを実装する。
**SAFE-01（必ず脱出できる）との両立が設計上の要点。**

## Context

`GAME_ENGINE_DESIGN.md §3.1`。
「永久に閉じられない広告」は作らない（DESIGN §20 NEVER）。
代わりに「閉じても次が出る」で同等の絶望を、**有限回で**表現する。

## Files to create

```text
packages/game-engine/src/behaviors/persist-respawn.ts
packages/game-engine/src/behaviors/persist-respawn.test.ts
```

## Implementation requirements

1. **PER-01 Respawning Ad**: 閉じた後 N ms で再出現
   - 再出現回数に**上限がある**（`maxRespawns`。カタログのパラメータ）
   - 上限到達後は出ない。プレイヤーは必ず前に進める
2. **PER-02 Multi-layer Popup**: 閉じると下から次の広告が出る
   - 層の数は生成時に確定（`rng('stage')`）。**有限**
   - 層ごとに違うパターンを積める（ここでコンボが成立する）
3. `SimResult.outcome: { kind: 'spawn', patternId }` でエンジンに次の生成を要求する。
   simulator が直接 state に広告を足さない
4. 同時出現数の上限を超える場合は spawn を遅延させる（画面が壊れない）
5. **脱出可能性の保証**:
   - 「respawn の総時間 + 全層の閉じる時間」が有限であることをステージ生成時に検証
   - `COM-12 Infinite Hell` であっても、名前に反して有限である

## Acceptance criteria

- [ ] respawn 回数に上限があり、上限後は出ない
- [ ] multi-layer の層数が有限
- [ ] **1000 seed の property test で「有限時間で必ず全広告を処理しきれる」ことを検証**
- [ ] 同時出現数の上限を超えない
- [ ] 絶望感はあるが、実際には必ず抜けられる（プレイテストで確認）

## Test requirements

- respawn 上限テスト
- 脱出可能性の property test（**このタスクの最重要テスト**）
- 同時出現数の上限テスト

## Definition of Done

- acceptance criteria を全て満たす
- 「無限に見えて有限」の設計が README に記録されている
