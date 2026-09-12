# GAME_ENGINE_DESIGN.md

## 0. Status

- Status: Draft v0.1 — REVIEW REQUESTED
- Parent: `docs/design/ARCHITECTURE.md` §7
- Owner package: `packages/game-engine`
- Upstream: `docs/requirements/GAME_REQUIREMENTS.md`

> **契約: このパッケージは DOM / React / タイマー / 乱数 / 現在時刻 に一切触れない。**
> 触れた瞬間に seed 再現・リプレイ・網羅テストのすべてが壊れる。

---

# 1. なぜヘッドレスにするのか

GAME_REQUIREMENTS が要求している以下は、全部「ロジックが純粋であること」に帰着する。

| 要件 | 純粋性が必要な理由 |
|---|---|
| §8.5 Challenge Seeds | 同じ seed で同じ地獄が再現される必要がある |
| §25.2 Deterministic Seeds | 同上 |
| §25.4 Testable（パターン単位で独立にテスト） | ブラウザなしで全パターンをテストできる必要がある |
| §15.1 全ての失敗が説明可能 | 状態遷移の全履歴をログとして持てる必要がある |
| §21 Shareability（seed URL 共有） | 再現できなければ共有する意味がない |
| ARCHITECTURE §11 SAFE-01 | 「全パターン × 1000 seed」の property test を現実的な時間で回す必要がある |

---

# 2. Public API

```ts
// これが packages/game-engine の外向きインターフェースの全て
export function createRun(config: RunConfig): Run
export function step(run: Run, intent: Intent): StepResult
export function hashState(run: Run): string
export function replay(record: ReplayRecord): Run    // 検証用

export type RunConfig = {
  seed: string
  mode: 'story' | 'endless' | 'tutorial'
  stageId: StageId
  catalog: PatternDefinition[]
  accessibility: AccessibilityProfile
  /** テスト・デバッグ用。本番は undefined */
  overrides?: Partial<EngineTuning>
}

export type AccessibilityProfile = {
  reducedMotion: boolean
  pointerPrecision: 'coarse' | 'fine'
  audioEnabled: boolean          // 既定 false。ユーザー操作でのみ true になる
  extendedTimeouts: boolean      // 反応速度に配慮した緩和モード
}
```

## 2.1 AccessibilityProfile はエンジンの入力である

`DESIGN.md §20` は「reduced motion 時は moving close を無効化し、**インタラクションロジックは維持する**」と要求している。
これを CSS だけでやると、「見た目は止まっているのに内部では動いている」状態になり、当たり判定がずれる。

したがって **reduced-motion はエンジンに渡す**。`CLS-05 Moving Close` の simulator は
`ctx.a11y.reducedMotion === true` のとき移動量を 0 にし、代わりに別の摩擦（わずかな遅延）に置き換える。
パターンは消さない。難易度も維持する。ロジックは同じ。

`pointerPrecision: 'coarse'` のときは `CLS-13 Close Requires Precision` の当たり判定を最小 44px に拡張する（AD-7）。
**ゲームとして不公平にしない**（DESIGN_REQ §5.3 Pattern C の但し書き）。

---

# 3. State Model

```ts
type GameState = {
  step: number                  // 固定ステップのカウンタ。時刻はここから導出
  phase: 'intro' | 'running' | 'cleared' | 'failed'

  // GAME §5.1 の3リソース
  progress: { read: number; tasksDone: number; total: number }  // A. Progress
  elapsedMs: number                                             // B. Time
  patience: number                                              // C. Patience (0-100)

  ads: ActiveAd[]
  combo: { chain: number; bestChain: number; activeTags: ComboTag[]; namedCombo?: string }
  score: ScoreState
  rage: { meter: number; active: boolean }

  /** 結果画面・教育表示・「今のは何にやられたか」の根拠 */
  log: EncounterEvent[]

  /** 次に何が出るかのスケジュール。生成時に確定済み */
  schedule: ScheduledSpawn[]
}

type ActiveAd = {
  instanceId: string
  patternId: PatternId
  simulatorId: SimulatorId
  spawnedAtStep: number
  closableAtStep: number        // SAFE-01: 必ず有限値
  lifecycle: 'entering' | 'visible' | 'closable' | 'closing' | 'closed'
  /** simulator 固有の状態。simulator 以外は触らない */
  sim: unknown
  /** 宿主が描画するための宣言的記述 */
  view: ViewState
}
```

## 3.1 `closableAtStep` は必ず有限

型で `number | null` にしない。**`null` を許すと SAFE-01 を型で守れなくなる。**
「永久に閉じられない広告」は現実には存在するが、このゲームでは作らない（DESIGN §20 NEVER）。
代わりに「閉じても即座に次が出る」(`PER-02 Multi-layer`) で同等の絶望を表現する。これは安全に脱出可能。

---

# 4. Intent（入力）

```ts
type Intent =
  | { t: 'tick' }                                        // 固定ステップを1つ進める
  | { t: 'point'; target: TargetRef }                    // クリック/タップ
  | { t: 'action'; action: PlayerAction; target?: TargetRef }
  | { t: 'scroll'; deltaLines: number }                  // 論理量。ピクセルではない
  | { t: 'read'; }                                       // コンテンツを読んでいる
  | { t: 'answer'; questionId: string; choice: number }  // OD-5 のハイブリッド目的
  | { t: 'a11y'; profile: Partial<AccessibilityProfile> }
```

## 4.1 TargetRef は論理参照

```ts
type TargetRef =
  | { kind: 'ad'; instanceId: string; part: AdPart }
  | { kind: 'content'; id: string }
  | { kind: 'chrome'; id: string }

type AdPart = 'close' | 'fake-close' | 'cta' | 'body' | 'media'
```

**ピクセル座標を記録しない。** 画面サイズが違ってもリプレイが成立する（ARCHITECTURE §7.2）。
「偽×を押した」は座標の問題ではなく論理的な選択の問題なので、これで表現力は十分。

---

# 5. 固定タイムステップ

```ts
const STEP_MS = 1000 / 60   // 16.666...

// 宿主側（apps/web）
let acc = 0
function frame(dt: number) {
  acc += Math.min(dt, 200)          // タブ復帰時の巨大 dt をクランプ
  while (acc >= STEP_MS) {
    run = step(run, { t: 'tick' }).run
    acc -= STEP_MS
  }
  render(run.state)
}
```

- `elapsedMs = state.step * STEP_MS`
- クランプにより「タブを離れて戻ったら即死」を防ぐ（これもダークパターン回避）
- 60fps が出ない端末でもロジックは同じステップ数だけ進む

---

# 6. RNG

```ts
type Rng = (stream: RngStream) => () => number

type RngStream =
  | 'stage'       // どのパターンを選ぶか
  | 'timing'      // spawnAfterMs 等の Range 抽選
  | 'placement'   // 画面上の配置
  | 'deception'   // 偽×の位置、どちらが本物か
  | 'creative'    // 広告のダミー文言・色の選択
  | 'jitter'      // 細かな揺らぎ
```

実装:

```ts
function makeRng(seed: string): Rng {
  const cache = new Map<string, () => number>()
  return (stream) => {
    if (!cache.has(stream)) cache.set(stream, mulberry32(xmur3(seed + ':' + stream)()))
    return cache.get(stream)!
  }
}
```

**ストリーム分割の意味:** 後から `creative` ストリームを追加しても、既存の `stage` / `timing` の
出力列は 1 ビットも変わらない。つまり **既存の seed challenge の結果が壊れない**。
単一 RNG を共有すると、機能追加のたびに過去の seed が別物になる。

---

# 7. Simulator Registry

```ts
interface PatternSimulator<S = unknown> {
  readonly id: SimulatorId

  spawn(ctx: SpawnContext): { sim: S; view: ViewState; closableAfterMs: number }

  onTick(sim: S, ctx: SimContext): SimResult<S>

  onIntent(sim: S, intent: Intent, ctx: SimContext): SimResult<S>
}

type SimResult<S> = {
  sim: S
  view?: Partial<ViewState>
  /** エンジンへの要求。simulator は state を直接いじらない */
  outcome?:
    | { kind: 'closed' }
    | { kind: 'mistake'; reason: MistakeReason }
    | { kind: 'spawn'; patternId: PatternId }        // PER-01 Respawn / PER-02 Multi-layer
    | { kind: 'damage'; patience: number }
    | { kind: 'blockProgress'; ms: number }
  effects?: Effect[]
}
```

## 7.1 MVP で実装する simulator（GAME §23 の15パターンをカバー）

パターン数 15 に対し simulator は **8つ**で足りる。共有できるものは共有する。

| SimulatorId | カバーするパターン |
|---|---|
| `overlay` | INT-01 Popup, OBS-01 Fullscreen Overlay |
| `sticky` | OBS-03 Sticky Bottom, OBS-06 Floating Video |
| `close-friction` | CLS-03 Delayed, CLS-01 Tiny, CLS-05 Moving |
| `fake-close` | CLS-11 Fake Close |
| `deceptive-cta` | DEC-02 Fake Download, DEC-03 Fake Play |
| `attention` | ATT-01 Auto-play Video, ATT-02 Auto-play Sound(simulated) |
| `instability` | LAY-01 Layout Shift |
| `persistence` | PER-01 Respawn, PER-02 Multi-layer |

そして `COM-03 Sticky + Popup` のような Compound は **simulator を持たない**。
ステージ生成器が複数パターンを同時に起動するだけで成立する。これが Compound を独立実装しない理由。

## 7.2 ATT-02 Auto-play Sound の扱い（重要）

**実際に音を鳴らさない。** DESIGN_REQ §12 / DESIGN §20 で自動再生は禁止されている。

代わりに:
- 画面に「🔊 音声が再生されています」という**偽の表示**を出す
- 実際の音は `accessibility.audioEnabled === true`（ユーザーが明示的にONにした）ときのみ鳴る
- ゲームメカニクスとしては「音源を止める」操作が要求される。音が鳴っていなくても成立する

「音を鳴らす広告を批判するサイトが勝手に音を鳴らす」矛盾を避けつつ、パターンは体験させる。

---

# 8. Stage Generator

```ts
function generateStage(cfg: {
  stageDef: StageDefinition
  catalog: PatternDefinition[]
  rng: Rng
}): ScheduledSpawn[]
```

アルゴリズム:

```text
1. stageDef の difficulty band / category weight で候補パターンを絞る
2. game facet を持ち、simulator が registry に存在するものだけ残す  ← AD-2
3. incompatibleWith を満たさない組み合わせを除外
4. rng('stage') で必要数を抽選
5. rng('timing') で各 Range を確定値に焼き込む
6. 同時出現数の上限（mobile では少なく）を適用       ← DESIGN §19
7. SAFE-01 検査: 全 spawn の closableAt が上限以内
8. ScheduledSpawn[] を返す（以降、実行中に再抽選しない）
```

**ステージ定義はデータ。** GAME §12 の Stage 1-5 は `data/stages/*.json` になる。
ハードコードしない（GAME §13）。

## 8.1 難易度カーブ

`StageDifficulty = Pattern Difficulty + Interaction Complexity + Uncertainty + Time Pressure + Combo Complexity`
（GAME §11）

これは**生成後に計算して検証する**。狙った難易度帯に収まらない生成結果は棄却して再抽選（最大N回）。
「seed によっては理不尽に難しい」を構造的に防ぐ（GAME §15 Fairness）。

---

# 9. Score / Patience / Combo

```ts
// GAME §9.1
Score = completion + speedBonus + accuracyBonus + comboBonus + survivalBonus
      - damagePenalty - timePenalty
```

## 9.1 やってはいけない設計

GAME §9.1 の明示的な禁止:

> Do NOT directly equate higher UX severity with higher player reward.

つまり `score += pattern.severity` は禁止。
プレイヤーの得点源は **「難しい状況を切り抜けたこと」** であって「ひどい広告に遭遇したこと」ではない。

実装上は `scoreEffect.onClear` をパターン個別に持ち（PATTERN_SCHEMA §3）、
severity からの自動導出をしない。これにより「severity を上げたら得点が上がる」事故を防ぐ。

## 9.2 Patience

- 初期値 100
- `onSpawn` / `onMistake` / `perSecondAlive` で減少
- 0 で即失敗（GAME §30 Q4 推奨案 C: patience を主、time を従）
- **回復手段を持つ**: 正しい対処を連続で成功させると微量回復。これがないと「ただ削られるだけ」になる

## 9.3 Combo / Rage

```ts
// GAME §10。コンボ名はデータ
{ id: 'no-intention-to-close', ja: '閉じさせる気がない',
  requires: ['popup', 'fake-close', 'delayed-close'] }
```

`comboTags` の集合マッチで判定する。パターンIDの組み合わせではなくタグにするのは、
パターンが増えてもコンボ定義を書き換えなくて済むようにするため。

RAGE MODE (GAME §9.3) は演出（`Effect`）としてエンジンが発行し、実装は宿主側。
**ただし「視覚的に読めなくなる」ほどやらない**（GAME §9.3 の但し書き）。
`accessibility.reducedMotion` 時は強度を落とす。

---

# 10. Effects（宿主への指示）

```ts
type Effect =
  | { kind: 'shake'; intensity: number }
  | { kind: 'smash'; instanceId: string }
  | { kind: 'sound'; id: SoundId }          // 宿主が audioEnabled を見て握り潰す
  | { kind: 'stamp'; text: 'BLOCKED' }
  | { kind: 'rage'; level: number }
  | { kind: 'toast'; text: string }
```

エンジンは effect を**返すだけ**で実行しない。これにより:
- ヘッドレステストでは effect の配列を assert すればよい
- 音・振動の可否は宿主（＝ユーザー設定を知っている層）が判断する

---

# 11. Replay

```ts
type ReplayRecord = {
  version: { engine: string; catalog: string }
  config: RunConfig
  /** tick は記録しない。step index で位置が決まる */
  inputs: [stepIndex: number, intent: Intent][]
  /** 検証用。再生結果がここと一致しなければ回帰 */
  finalStateHash: string
}
```

用途:
1. Seed Challenge（GAME §8.5）
2. **決定論の回帰テスト** — CI に数本の記録を置き、エンジン変更で結果が変わったら落とす
3. 結果画面のハイライト再生（post-MVP）

---

# 12. Test Plan

| テスト | 内容 |
|---|---|
| `simulator/*.test.ts` | 各 simulator を単体で。GAME §25.4 |
| `determinism.test.ts` | 同一 seed で 1000 step 回して state hash 一致 |
| `replay.test.ts` | 記録済みリプレイの final hash 一致 |
| `safety.property.test.ts` | 全パターン × 1000 seed で SAFE-01（必ず閉じられる）を検査 |
| `fairness.property.test.ts` | 生成ステージの難易度が目標帯に収まる。同時脅威数が上限以下 |
| `scoring.test.ts` | severity を上げてもプレイヤー報酬が増えないことを検査（§9.1） |
| `a11y-profile.test.ts` | reducedMotion で moving が無効、かつクリア可能性が維持される |

---

# 13. Open Questions

1. **Patience の回復量**。ゼロにすると単調減少ゲームになる。実プレイで調整。
2. **同時出現数の上限**。mobile 2 / desktop 4 を初期値にしたいが要プレイテスト。
3. **`IGNORE` アクションの UI 表現**。`DEC-02 Fake Download` は「押さないのが正解」だが、
   何もしないことを能動的な選択として提示する UI が必要（そうしないと「気づいた」ことが評価できない）。
   現案: `REPORT` で「これは偽物だ」と宣言させる。押さない＋見抜いた、の両方を評価できる。
4. **Endless モードの難易度上昇関数**。線形か指数か。要プレイテスト。
