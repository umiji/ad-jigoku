# TASK-013B — Shell: videoPlayer / densityStack

- Milestone: M2 / Phase 1
- Depends on: 013
- Size: 1 session
- **DECISIONS_v0.2.md §1.3 により新設**: TASK-013 から分離したメディア系シェル2種

## Objective

メディア系シェル2種（`videoPlayer` / `densityStack`）を実装する。

## Context

`ARCHITECTURE.md §7.3`、`GAME_ENGINE_DESIGN.md §7.1`。`videoPlayer` は ATT-01 Auto-play Video /
OBS-06 Floating Video、`densityStack` は「量で殴る」系（OBS-09/10 Ad Density）の見た目を担う。

## Files to create

```text
packages/ui/shells/videoPlayer/index.tsx
packages/ui/shells/videoPlayer/videoPlayer.module.css
packages/ui/shells/densityStack/index.tsx
packages/ui/shells/densityStack/densityStack.module.css
```

## Implementation requirements

1. `videoPlayer`:
   - `supports`: `surface`, `attention`, `persist`
   - 実際に動画を再生してよい（音なし、軽量、ループ、`playsinline`）。`reducedMotion` 時は静止画
   - 「🔊 音声が再生されています」の偽表示は `attention` behavior 側の責務。シェルは表示スロットのみ持つ
2. `densityStack`:
   - `supports`: `attention`, `instability`
   - 複数の広告ユニットが積み重なった見た目。個々のユニットは TASK-013 の parts を再利用する
3. 形状・色は `DESIGN.md` のトークンのみ
4. メインスレッドをブロックしないこと（動画・スタックいずれも）

## Acceptance criteria

- [ ] 2シェルが `Shell` インターフェースを満たす
- [ ] `videoPlayer` が `reducedMotion` で静止画に切り替わる
- [ ] `densityStack` が任意個数のユニットをレイアウト崩れなく積める
- [ ] `/dev/shells` で確認できる
- [ ] `DESIGN.md §23` のコンプライアンスチェックを実施し、結果を PR に記載

## Test requirements

- 視覚回帰スナップショット（mobile / desktop、通常/reducedMotion）
- メインスレッドブロックのないことを計測で確認

## Definition of Done

- acceptance criteria を全て満たす
- TASK-020（sticky/attention behavior）がこれらのシェルを前提に着手できる状態
