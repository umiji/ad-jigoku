# BEHAVIOR_GUIDE.md — behavior の書き方

- Status: v0.1（TASK-017 で確立。以降の behavior タスク 018〜022 はこの手順に従う）
- Parent: `docs/design/GAME_ENGINE_DESIGN.md §7`、ADR-009
- Owner package: `packages/game-engine/src/behaviors/`

> **behavior は「挙動」だけを書く。** 見た目は Shell（`packages/ui/shells/<id>/`）、中身は Creative（TASK-013D）。
> behavior は DOM / React / 時刻 / 乱数（`ctx.rng` 以外）を知らない。知った瞬間に決定論とテスト容易性が壊れる。

---

## 1. 型

```ts
interface Behavior<S = unknown> {
  readonly id: BehaviorId          // `<slot>:<kebab-name>`。例: close:delayed
  readonly slot: Slot              // spawn / surface / close / persist / attention / instability / deception / hitbox
  readonly friction: number        // 公平性の重み。1 広告内の Σ friction ≤ FRICTION_CAP（R4）
  readonly load: number            // 認知負荷。同時アクティブの Σ load ≤ LOAD_BUDGET[device]（R5）
  closeDelayMs?(params, ctx): number      // 閉じられるまでの遅延（省略 0）。SAFE-01 上限で clamp される
  init(params, ctx): BehaviorResult<S>    // sim の初期値 + 初期 ViewState の上書き
  onTick(sim, ctx): BehaviorResult<S>     // 毎 tick
  onIntent(sim, intent, ctx): BehaviorResult<S>   // point / action が自分の広告に来たとき
}

type BehaviorResult<S> = {
  sim: S                         // 必ず返す（変更なしなら同じ参照でよい: noChange(sim)）
  view?: Partial<ViewState>      // 見た目の宣言的な上書き（parts / countdown / anchor / motion / badge …）
  outcome?: Outcome              // エンジンへの要求: closed / smashed / reported / closable / mistake / spawn / damage / blockProgress
  effects?: Effect[]             // 宿主への演出指示（shake / sound / stamp …）
  handled?: boolean              // true なら、この intent に対するエンジンの既定ルールを適用しない
}
```

`ctx`（`SimContext`）には **GameState 全体は入っていない**。`rng` / `a11y` / `tuning` / `step` / `elapsedMs` /
`spawnedAtStep` / `closableAtStep` / `lifecycle` / `view` / `pattern` / `instanceId` だけ。他の広告に依存する挙動は書けない
（書けないように作ってある。GAME §25.4「パターン単位で独立にテスト」）。

## 2. エンジンの既定ルール（behavior が何も返さないときの振る舞い）

`engine/intent.ts`。behavior が `handled` / `outcome` を返さない intent には次が適用される。

| intent | 状態 | 結果 |
|---|---|---|
| point(close) | closable | closed（+ onClear 加点 + triage 判定 + chain + ミスなしなら回復） |
| point(close) | 未 closable | mistake `too-early`（軽微。PATIENCE_PENALTY_TOO_EARLY） |
| point(fake-close / decoy) | — | mistake `fake-close`（patienceEffect.onMistake） |
| point(cta / media) | — | mistake `clicked-ad`（同上） |
| action(SMASH) | closable | smashed（smash / BLOCKED stamp effect） |
| action(REPORT) | pattern.correctInaction | reported（それ以外は `wrong-action`） |
| action(DODGE / FOCUS / ESCAPE / IGNORE) | — | mistake `wrong-action`（対応する behavior が `handled` を返せば無罪） |

**つまり「普通に閉じられる広告」は behavior に何も書かなくてよい。** 書くのは「閉じにくさ」「偽装」「居座り」の差分だけ。

## 3. ライフサイクルとエンジン側の自動処理

```text
entering（ENTER_STEPS=14 ≈ 240ms） → visible → closable（closableAtStep） → closing（CLOSING_STEPS=14） → 除去
```

- `closableAtStep = spawnedAtStep + max(ENTER_STEPS, min(closeDelayMs, MAX_CLOSE_DELAY_MS))`。**null にはならない**（SAFE-01）
- closable になった瞬間、`parts[close].enabled` は自動で true になる。behavior が enabled を触る必要はない
- `view.surface === 'fullscreen'` なら `blocksProgress` が自動で立つ。他の覆い方は `outcome: { kind: 'blockProgress', active }`
- `patienceEffect`（onSpawn / onMistake / perSecondAlive）はカタログ側。behavior は `damage` outcome で追加ダメージだけ出せる

## 4. 書き方の型（TASK-017 の spawn / surface / close:delayed を見本にする）

```ts
// packages/game-engine/src/behaviors/close.ts より
export const closeDelayed: Behavior<{ delayMs: number }> = {
  id: 'close:delayed',
  slot: 'close',
  friction: 1,
  load: 1,
  closeDelayMs: (params) => params['delayMs'] ?? 3000,
  init: (params) => ({ sim: { delayMs: params['delayMs'] ?? 3000 }, view: { countdown: { remainingMs: params['delayMs'] ?? 3000 } } }),
  onTick: (sim, ctx) => {
    const remaining = Math.max(0, (ctx.closableAtStep - ctx.step) * STEP_MS)
    return { sim, view: { countdown: { remainingMs: Math.round(remaining) } } }   // 残り時間は必ず見せる（GAME §15.4）
  },
  onIntent: (sim) => noChange(sim),
}
```

手順:

1. `packages/pattern-catalog/README.md §4` の契約表で **id と params 名**を確認する（JSON はもう投入済み。id を変えない）
2. `src/behaviors/<slot>.ts` に追加し、`src/behaviors/index.ts` の `BASELINE_BEHAVIORS` に登録する
3. `friction` / `load` を決める（moving / fake / tiny は friction 2、fullscreen は load 2 が目安）
4. `src/behaviors/behaviors.test.ts` に **実カタログ**を使った単体テストを足す（spawn → tick → intent の遷移、早押し、`reducedMotion` 時の挙動）
5. `pnpm --filter @ad-jigoku/game-engine test` — SAFE-01 property（stage-1 × 300 seed）と replay フィクスチャが自動で走る
6. 対応する Shell が UI 側に無ければ生成器は選ばない（`isImplemented`）。Shell は TASK-013A/B/C

## 5. やってはいけないこと

- `Math.random()` / `Date` / `setTimeout` — lint で落ちる。乱数は `ctx.rng('jitter')` 等
- 実行中に `Range` を再抽選する — params は生成時に焼き込み済み。`params['x']` は number
- `state` を直接いじる — outcome を返す
- 支援技術に嘘をつく — `fake-close` / `decoy` は **見た目**だけ偽装する。aria-label は UI（parts）が正直に書く
- `reducedMotion` で難易度を落とす／上げる — 移動を止め、代わりに短い遅延に置き換える（CLS-05 の方針。TASK-018）
- `closeDelayMs` を `MAX_CLOSE_DELAY_MS` より大きく返す — clamp されるが、カタログの V-08 で先に落とすこと
