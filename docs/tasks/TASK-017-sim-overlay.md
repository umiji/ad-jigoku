# TASK-017 — overlay simulator（INT-01 Popup / OBS-01 Fullscreen Overlay）

- Milestone: M3 / Phase 1
- Depends on: 014
- Size: 1 session

## Objective

最初の simulator を実装する。**以降の simulator 実装の型となるタスク**なので、
パターンを増やすことより「simulator の書き方を確立すること」を優先する。

## Context

`GAME_ENGINE_DESIGN.md §7`。`SimulatorRegistry` に登録する最初の実装。
ここで確立した書き方を TASK-018..022 が踏襲する。

## Files to create

```text
packages/game-engine/src/simulators/overlay.ts
packages/game-engine/src/simulators/overlay.test.ts
apps/web/src/game/views/OverlayView.tsx        ViewState → 描画（必要なら）
packages/pattern-catalog/data/patterns/ ... INT-01, OBS-01 の game facet 完成
```

## Implementation requirements

1. `overlay` simulator が `INT-01 Immediate Popup` と `OBS-01 Fullscreen Overlay` の両方を扱う
   - 差はパラメータ（`sizeHint`, `spawnAfterMs`, `patienceEffect`）であって別実装ではない
2. ライフサイクル: `entering` → `visible` → `closable` → `closing` → `closed`
3. `closableAfterMs` はカタログから。`MAX_CLOSE_DELAY_MS` を超えられない（SAFE-01）
4. `onIntent`:
   - `point(close)` かつ `closable` → `{ kind: 'closed' }`
   - `point(close)` かつ未 closable → `{ kind: 'mistake', reason: 'too-early' }`（軽微）
   - `point(cta)` → `{ kind: 'mistake', reason: 'clicked-ad' }`
   - `action(SMASH)` → closable なら破壊（カタルシス。TASK-023 で演出）
5. `blockProgress`: overlay が本文を覆っている間は progress を止める
6. **ViewState だけで描画が決まること。** simulator が DOM を知らない
7. `docs/` に「simulator の書き方」を1ページ残す（以降のタスクの参照先になる）

## Acceptance criteria

- [ ] INT-01 と OBS-01 が遊べる
- [ ] SAFE-01 を満たす（1000 seed の property test）
- [ ] simulator が DOM / React を import していない
- [ ] `overlay.test.ts` がブラウザなしで完結する
- [ ] `DESIGN.md §9` のパターン対応表と挙動が一致する
- [ ] simulator 実装ガイドが `docs/design/SIMULATOR_GUIDE.md` として書かれている

## Test requirements

- 単体テスト（spawn → tick → close の全遷移）
- 早押し時の mistake 判定
- property test: 全 seed で必ず閉じられる

## Definition of Done

- acceptance criteria を全て満たす
- **以降の simulator タスクが、このファイルをテンプレートにして書ける状態**
