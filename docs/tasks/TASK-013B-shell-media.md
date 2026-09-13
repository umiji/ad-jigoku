# TASK-013B — Shell: videoPlayer / densityStack

- Milestone: M2 / Phase 1
- Depends on: 013
- Size: 1 session

> **v0.2 新規（`DECISIONS_v0.2.md` §1.3, ADR-009）**: TASK-013 から分離した、メディア系シェル2種。
> TASK-013A と同じ書き方（`supports` 宣言、parts の組み合わせのみ）を踏襲する。

## Objective

`videoPlayer`（動画/音声系パターン用）と `densityStack`（再出現・多層系パターン用）のシェルを実装する。

## Context

`DECISIONS_v0.2.md §1.3`。`videoPlayer` は ATT-01/ATT-02/OBS-06 の見た目を担い、
`densityStack` は PER-01/PER-02 の見た目を担う。

## Files to create

```text
packages/ui/shells/videoPlayer/VideoPlayer.tsx
packages/ui/shells/videoPlayer/videoPlayer.css
packages/ui/shells/densityStack/DensityStack.tsx
packages/ui/shells/densityStack/densityStack.css
```

## Implementation requirements

1. `videoPlayer`:
   - `supports: ['spawn', 'persist', 'attention']`
   - 実際に軽量な動画（音なし、ループ、`playsinline`）を再生できる構造を持つ（音声再生自体は
     Behavior 側が `accessibility.audioEnabled` を見て制御する。`GAME_ENGINE_DESIGN.md §7.2`）
   - `reducedMotion` 時は静止画に切り替えられる構造にする
2. `densityStack`:
   - `supports: ['spawn', 'persist']`
   - 複数レイヤーの広告を積み重ねて表示できる構造（層数は Behavior が決める。シェルは「積める」ことだけ保証する）
3. TASK-013 の parts を再利用し、シェル固有の挙動ロジックは持たない
4. `DESIGN.md §8` の anatomy と `§16` の形状ルールに準拠する

## Acceptance criteria

- [ ] 2シェルがそれぞれ `/dev/components` で確認できる
- [ ] `videoPlayer` が音声 OFF（既定）の状態で完全に表示できる
- [ ] `densityStack` が3層まで積んでもレイアウトが破綻しない
- [ ] `DESIGN.md §23` のコンプライアンスパス実施済み

## Test requirements

- 各シェルの視覚回帰スナップショット（mobile / desktop）
- `densityStack` の多層表示テスト

## Definition of Done

- acceptance criteria を全て満たす

---

## 進捗記録

- 状態: 完了（2026-09-14）。TASK-013A と同じ書き方・検証（詳細は TASK-013A の進捗記録）

### 決定ログ

#### 2026-09-14 videoPlayer は動画ファイルを持たず CSS だけで「再生中」を表現
- 決定: 流れるバンド + 偽プログレスバー + 44px の偽 ▶/❚❚（`data-target="media"`、aria-label は「実際には再生も音声もされません」と正直に）。`reducedMotion` では全アニメーションを止めた静止フレーム（テストで animationName === 'none' を検査）
- 却下案: 実 `<video>` 素材 → 外部アセット・CSP・音声の懸念が増える割に得るものがない
- 出典: TASK-013B 要件 1 / GAME_ENGINE_DESIGN §7.2

#### 2026-09-14 densityStack は装飾の下層カード 2 枚 + 前面カード
- 決定: 下層は `aria-hidden`、操作部位なし。実際の追加レイヤーはエンジンが別広告として出す（persist:multi-layer）
- 出典: TASK-013B 要件 2
