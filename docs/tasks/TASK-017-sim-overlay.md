# TASK-017 — spawn / surface behavior（INT-01 Popup / OBS-01 Fullscreen Overlay）

- Milestone: M3 / Phase 1
- Depends on: 014, 013A
- Size: 1 session

> **v0.2 改訂（`DECISIONS_v0.2.md` §1, ADR-009）**: 「simulator」を「behavior（スロット単位）」に
> 読み替える。本タスクは `spawn` / `surface` スロットの Behavior を実装する。**対応する Shell
> （`popup`, `interstitial`。TASK-013A）が実装済みであることが前提条件。**

## Objective

最初の behavior を実装する。**以降の behavior 実装の型となるタスク**なので、
パターンを増やすことより「behavior の書き方を確立すること」を優先する。

## Context

`GAME_ENGINE_DESIGN.md §7`。`BehaviorRegistry` に登録する最初の実装。
ここで確立した書き方を TASK-018..022 が踏襲する。

## Files to create

```text
packages/game-engine/src/behaviors/spawn.ts
packages/game-engine/src/behaviors/surface.ts
packages/game-engine/src/behaviors/spawn.test.ts
packages/game-engine/src/behaviors/surface.test.ts
apps/web/src/game/views/OverlayView.tsx        ViewState → 描画（必要なら）
packages/pattern-catalog/data/patterns/ ... INT-01, OBS-01 の game facet 完成（shell: popup / interstitial）
```

## Implementation requirements

1. `spawn` behavior と `surface` behavior が `INT-01 Immediate Popup`（shell: `popup`）と
   `OBS-01 Fullscreen Overlay`（shell: `interstitial`）の両方を扱う
   - 差はパラメータ（`sizeHint`, `spawnAfterMs`, `patienceEffect`）であって別実装ではない
2. **前提条件: 対応する Shell（`popup`, `interstitial`）が ShellRegistry に登録済みであること**
   （TASK-013A）。未登録の場合はエラーになることを確認する
3. ライフサイクル: `entering` → `visible` → `closable` → `closing` → `closed`
4. `closableAfterMs` はカタログから。`MAX_CLOSE_DELAY_MS` を超えられない（SAFE-01）
5. `onIntent`:
   - `point(close)` かつ `closable` → `{ kind: 'closed' }`
   - `point(close)` かつ未 closable → `{ kind: 'mistake', reason: 'too-early' }`（軽微）
   - `point(cta)` → `{ kind: 'mistake', reason: 'clicked-ad' }`
   - `action(SMASH)` → closable なら破壊（カタルシス。TASK-023 で演出）
6. `blockProgress`: overlay 系 surface が本文を覆っている間は progress を止める
7. **ViewState だけで描画が決まること。** behavior が DOM を知らない
8. `docs/` に「behavior の書き方」を1ページ残す（以降のタスクの参照先になる）

## Acceptance criteria

- [ ] INT-01 と OBS-01 が遊べる
- [ ] SAFE-01 を満たす（1000 seed の property test）
- [ ] behavior が DOM / React を import していない
- [ ] `spawn.test.ts` / `surface.test.ts` がブラウザなしで完結する
- [ ] `DESIGN.md §9` のパターン対応表と挙動が一致する
- [ ] behavior 実装ガイドが `docs/design/BEHAVIOR_GUIDE.md` として書かれている
- [ ] 対応する Shell が未登録の場合にエラーになることを確認済み

## Test requirements

- 単体テスト（spawn → tick → close の全遷移）
- 早押し時の mistake 判定
- property test: 全 seed で必ず閉じられる

## Definition of Done

- acceptance criteria を全て満たす
- **以降の behavior タスクが、このファイルをテンプレートにして書ける状態**
