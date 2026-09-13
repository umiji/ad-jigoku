# @ad-jigoku/game-engine

ヘッドレス・純粋・決定論的なゲームコア（`docs/design/GAME_ENGINE_DESIGN.md`、ADR-002）。

## この層に置いてよいもの / いけないもの

| 置いてよい | 置いてはいけない |
|---|---|
| `step(run, intent) → { run, effects }` を構成する純粋関数 | React / DOM API（`window` / `document` / `navigator` / `localStorage`） |
| `GameState` と、それを更新する reducer | `Date` / `performance.now()`（時刻は `step` 数から導出する） |
| Shell / Behavior のインターフェースとレジストリ | `Math.random()` / `crypto.getRandomValues()`（乱数は `ctx.rng(stream)` のみ） |
| ステージ生成器・スコア・コンボ・リプレイ | `setTimeout` / `setInterval` / `requestAnimationFrame`（時間は `{ t: 'tick' }` intent のみ） |
| `Effect` の**生成**（宿主への指示） | `Effect` の**実行**（音・振動・演出は `apps/web` の責務） |
| `@ad-jigoku/pattern-catalog` の型とデータ | `@ad-jigoku/ui` / `apps/*` への依存 |

これらは ESLint（`no-restricted-globals` / `no-restricted-imports` / `no-restricted-properties`）と
`pnpm check-deps` で機械的に強制されている。**回避しない。**

## core/ — 決定論プリミティブ（TASK-005）

- `rng.ts` — シード分割 RNG。`xmur3(seed + ':' + stream)` → `mulberry32`。ストリーム
  （`stage` / `timing` / `placement` / `deception` / `creative` / `jitter`）は互いに独立で、
  **新ストリームを追加しても既存ストリームの出力列は変わらない**。状態は uint32 1 個なので `GameState` に
  載せてハッシュ・スナップショット・リプレイの対象にできる（`createRngCursor`）。
- `clock.ts` — 固定タイムステップ `STEP_MS = 1000/60`。`advance(acc, dt)` は宿主の可変フレームを
  固定ステップ数へ変換し、`dt` を 200ms でクランプする（タブ復帰時の即死防止）。
- `hash.ts` — キー順固定・浮動小数 6 桁丸めの安定シリアライズ + FNV-1a 64bit。`hashState` の実体。
- `range.ts` — `Range` からの整数一様抽選。**Range は生成時に 1 回だけ確定し、実行中に再抽選しない。**
