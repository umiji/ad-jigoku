# TASK-018 — close behavior（CLS-01 Tiny / CLS-03 Delayed / CLS-05 Moving）

- Milestone: M3 / Phase 1
- Depends on: 017, 013A（対応する Shell `popup` が存在すること）
- Size: 1 session
- **DECISIONS_v0.2.md §1 により改訂**: 「simulator」を「behavior」に読み替える。本タスクは `close`
  スロットの behavior 群を扱う

## Objective

「閉じにくい」系パターンを `close` スロットの behavior 群として実装する。

## Context

`GAME_ENGINE_DESIGN.md §7.1`。`DESIGN_REQ §5.3` の Pattern B/C/D。
**公平性の要求が特に強い領域**（GAME §15、DESIGN_REQ §5.3）。

## Files to create

```text
packages/game-engine/src/behaviors/close-tiny.ts
packages/game-engine/src/behaviors/close-delayed.ts
packages/game-engine/src/behaviors/close-moving.ts
packages/game-engine/src/behaviors/close-*.test.ts
```

## Implementation requirements

1. 3つの摩擦を組み合わせ可能なパラメータとして持つ:
   `{ delayMs?, visualScale?, movement? }`
2. **CLS-01 Tiny Close**: 見た目は小さいが**当たり判定は 44px 以上**
   （DESIGN_REQ §5.3 Pattern C。ゲームとして不公平にしない）
   - `ViewState.parts[].hitboxScale` で表現
3. **CLS-03 Delayed Close**: カウントダウン表示（`AdCountdown`）。
   - 残り時間が**必ず見える**。隠された待機時間は作らない（GAME §15.4 難易度は観測可能）
4. **CLS-05 Moving Close**: 一定間隔で位置が変わる
   - `rng('jitter')` で決定論的に。実行中の再抽選なし
   - **`reducedMotion` 時は移動を無効化し、代わりに短い遅延に置き換える**（AD-8）
     - パターンを消さない。難易度も概ね維持する
   - 移動速度に上限。「物理的に不可能な反応時間」を要求しない（GAME §15.2）
   - 移動先は必ず viewport 内（`CLS-09 Close Outside Viewport` は別パターン）
5. 摩擦の合計時間が `MAX_CLOSE_DELAY_MS` を超えない

## Acceptance criteria

- [ ] 3パターンが遊べる
- [ ] Tiny Close の当たり判定が 44px 以上（Playwright 実測）
- [ ] Delayed Close のカウントダウンが常に見える
- [ ] Moving Close が reducedMotion で停止し、**クリア可能性が維持される**
- [ ] Moving Close の移動が seed で再現される
- [ ] 人間の反応時間の下限（200ms）以内の操作を要求しない
- [ ] 1000 seed の property test で SAFE-01 を満たす

## Test requirements

- 各摩擦の単体テスト
- reducedMotion でのクリア可能性テスト（**必須**）
- 決定論テスト（移動位置列が seed で再現）
- 「最短反応時間」の下限テスト

## Definition of Done

- acceptance criteria を全て満たす
- `DESIGN_REQ §5.3` の Pattern B/C/D の但し書きがコードコメントに反映されている
