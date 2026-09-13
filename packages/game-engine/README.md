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

## sim/ — Shell / Behavior / ViewState（TASK-007）

- `ShellRegistry` / `BehaviorRegistry` — 重複 ID を拒否。`resolve(id, slot)` はスロット不一致を拒否。
  `toImplementationMap()` を pattern-catalog の `validateCatalog` に注入すると V-05 / V-07 / V-13 が検査できる。
- 広告インスタンス = `Shell × Behaviors（スロット毎に最大 1）× Creative`。生成時（`instantiateAd`）に
  `shell.supports ⊇ 使用スロット` を検証する。未登録の shell / behavior は例外（実装のないパターンは出ない / AD-2）。
- `Behavior.init / onTick / onIntent` は `BehaviorResult` を返すだけで state を触らない。`outcome` は
  `engine/outcome.ts` がエンジン側で解釈する。`handled: true` を返さない限り、× / CTA / SMASH / REPORT の
  **既定ルール**（`engine/intent.ts`）が適用されるので、noop behavior でもゲームが成立する。
- `SimContext` には `GameState` を渡さない（他の広告に依存させない＝独立テスト可能 / GAME §25.4）。

### ViewState — UI 側が何を描くか（TASK-014 の実装者向け）

| フィールド | UI が描くもの |
|---|---|
| `shellId` | どの Shell コンポーネント（`packages/ui/shells/<id>`）で描画するか |
| `surface` | レイアウト方式。`overlay`=中央浮遊 / `sticky-bottom`・`sticky-top`=viewport 固定 / `inline`=本文中 / `corner`=隅 / `fullscreen`=全画面 |
| `anchor` | surface 内の相対位置（%）。`overlay` / `corner` のとき有効 |
| `sizeHint` | `small` / `medium` / `large` / `fullscreen`。実寸はトークンとブレークポイントが決める |
| `creative` | どのダミー広告素材（TASK-013D）を使うか（`index`） |
| `parts[]` | 各部位（`close` / `fake-close` / `cta` / `media` / `label` / `body` / `decoy`）の `visible` / `enabled` / `emphasis` / `hitboxScale` / `anchor`。`enabled` が false の × は押せない見た目（カウントダウン中） |
| `motion[]` | DESIGN §14 の語彙（`enter-scale` / `enter-slide` / `sticky-track` / `close-collapse` / `shake` / `drift` …）。`reducedMotion` 時は UI が動きのあるものを落とす |
| `countdown` | 残り待機 ms。**必ず見せる**（GAME §15.4） |
| `stackIndex` | z 順（0 が最背面）。具体的な z-index はトークン（`popup` / `popup_stack` / `critical`）が決める |
| `offset` | 見た目の縦移動量（%）。`transform` で再現し、document flow は変えない（ADR-006） |
| `badge` | 「🔊 音声が再生されています」等の偽表示（ATT-02。実際には鳴らさない） |

ライフサイクル: `entering`（`ENTER_STEPS` = 14 step ≈ 240ms）→ `visible` → `closable`（`closableAtStep`。SAFE-01 で有限）→
`closing`（`CLOSING_STEPS` 後に除去）。`closableAtStep` は entering 完了より前にならない。

## behaviors/ — 実装済みの挙動（TASK-017〜）

`src/behaviors/index.ts` の `BASELINE_BEHAVIORS` に載っているものだけがステージ生成器の候補になる（AD-2）。
書き方は `docs/design/BEHAVIOR_GUIDE.md`。id / params 名は `packages/pattern-catalog/README.md §4` の契約表に従う。

| behavior | slot | friction / load | 担うパターン |
|---|---|---|---|
| `spawn:immediate` | spawn | 0 / 1 | INT-01 ほか多数 |
| `spawn:delayed {afterMs}` | spawn | 0 / 1 | ATT-01 / ATT-02 / LAY-01 / DEC-02 / DEC-03（出現時刻は生成器が加算） |
| `surface:fullscreen` | surface | 0 / 2 | OBS-01（本文を覆い progress を止める） |
| `close:instant` | close | 0 / 1 | INT-01 |
| `close:delayed {delayMs}` | close | 1 / 1 | CLS-03（countdown を必ず見せる） |
| `persist:sticky` | persist | 0 / 1 | OBS-03 |

`registerMvp(registries)` が MVP 8 シェルの宣言（`sim/shells.ts`）と上記をまとめて登録する。

## replay/ と CLI（TASK-012）

- `pnpm game:simulate --seed=X --stage=stage-1 --strategy=optimal|naive|spam|idle|fake-close-victim [--real] [--json]`
- `pnpm game:preview-stage --seed=X --stage=stage-1 [--device=mobile] [--real]`
- `pnpm --filter @ad-jigoku/game-engine replay:fixtures` — 回帰フィクスチャの再生成（**挙動を意図的に変えたときだけ**）
