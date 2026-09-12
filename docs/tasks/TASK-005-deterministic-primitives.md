# TASK-005 — 決定論プリミティブ（RNG / 固定ステップ / state hash）

- Milestone: M1 / Phase 1
- Depends on: 001
- Size: 1 session

## Objective

`game-engine` の土台となる決定論プリミティブを実装する。
以降の全タスクがこの上に乗る。

## Context

ADR-002。seed 再現・リプレイ・網羅テストのすべてがここに依存する。
`GAME_ENGINE_DESIGN.md §5, §6`。

## Files to create

```text
packages/game-engine/src/core/rng.ts        シード分割 RNG
packages/game-engine/src/core/clock.ts      固定タイムステップ
packages/game-engine/src/core/hash.ts       状態ハッシュ
packages/game-engine/src/core/range.ts      Range 抽選ヘルパ
```

## Implementation requirements

1. `makeRng(seed: string): Rng`。`rng(stream)` でストリームごとの独立した生成器を返す
   - 実装は xmur3 (シード文字列→32bit) + mulberry32
   - ストリーム: `stage` / `timing` / `placement` / `deception` / `creative` / `jitter`
   - **新ストリームの追加が既存ストリームの出力を変えないこと**（これが要件の核心）
2. `STEP_MS = 1000/60`。`elapsedMs(step) = step * STEP_MS`
3. アキュムレータ関数 `advance(acc, dtMs): { steps: number; acc: number }`
   - `dtMs` は 200ms でクランプ（タブ復帰時の即死防止）
4. `hashState(state): string` — 安定した JSON シリアライズ（キー順固定）→ FNV-1a か xxhash
   - `sim` フィールド（simulator 固有の任意型）も含める
   - 浮動小数は固定桁に丸めてからハッシュ（プラットフォーム差の吸収）
5. `pickFromRange(range, rng): number` — 整数範囲から一様抽選

## Acceptance criteria

- [ ] 同じ seed で `rng('stage')` を 10000 回回した結果が常に一致する
- [ ] `rng('creative')` を新設しても `rng('stage')` の出力列が変わらない
- [ ] `advance` が 60fps / 30fps / 可変フレームで同じ累積ステップ数を出す
- [ ] `hashState` が、意味的に同一だがキー順が違うオブジェクトに対して同じ値を返す
- [ ] `game-engine` が `Math.random` / `Date` / `setTimeout` を使っていない（lint が通る）

## Test requirements

- RNG の再現性テスト（seed 固定で期待値配列と一致）
- RNG の分布テスト（十分に一様であること。厳密でなくてよい）
- ストリーム独立性テスト（**最重要**）
- アキュムレータのフレームレート非依存テスト
- ハッシュの安定性テスト（浮動小数の丸め含む）

## Definition of Done

- acceptance criteria を全て満たす
- `packages/game-engine/README.md` に「この層に何を置いてよくて何を置いてはいけないか」が書かれている
