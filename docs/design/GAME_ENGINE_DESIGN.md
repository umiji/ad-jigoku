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
  shellId: ShellId                              // v0.2 §1.3。旧 simulatorId を置き換え
  behaviors: Partial<Record<Slot, BehaviorId>>  // 現在アクティブな挙動
  spawnedAtStep: number
  closableAtStep: number        // SAFE-01: 必ず有限値
  lifecycle: 'entering' | 'visible' | 'closable' | 'closing' | 'closed'
  /** スロット毎の behavior 固有の状態。その behavior 以外は触らない */
  sim: Partial<Record<Slot, unknown>>
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

# 7. ShellRegistry + BehaviorRegistry（DECISIONS_v0.2.md §1.3, §1.5 により改訂）

**v0.1 の `PatternSimulator`（1パターン = 1レジストリエントリ）は撤回する。** 旧定義は git history 参照。
広告インスタンスは **Shell（見た目）× Behaviors（挙動。スロット毎に最大1つ）× Creative（中身）** の合成になる
（`PATTERN_SCHEMA.md` §3, `ARCHITECTURE.md` §7.3）。

```ts
interface Shell {
  readonly id: ShellId
  readonly parts: AdPart[]          // close / fake-close / cta / media / label ...
  readonly supports: Slot[]         // 受け付ける挙動スロット
  readonly frame?: FrameCapability[]
  // React コンポーネント + CSS は packages/ui/shells/<id>/ に独立して置く。共通化しない
}

interface Behavior<S = unknown> {
  readonly id: BehaviorId
  readonly slot: Slot
  readonly friction: number          // 合成妥当性チェック用（§8.3 R4）
  readonly load: number              // 認知負荷予算用（§8.3 R5）

  init(params: Record<string, number | Range> | undefined, ctx: SpawnContext): S
  onTick(sim: S, ctx: SimContext): BehaviorResult<S>
  onIntent(sim: S, intent: Intent, ctx: SimContext): BehaviorResult<S>
}

type BehaviorResult<S> = {
  sim: S
  view?: Partial<ViewState>
  /** エンジンへの要求。behavior は state を直接いじらない */
  outcome?:
    | { kind: 'closed' }
    | { kind: 'mistake'; reason: MistakeReason }
    | { kind: 'spawn'; patternId: PatternId }        // PER-01 Respawn / PER-02 Multi-layer
    | { kind: 'damage'; patience: number }
    | { kind: 'blockProgress'; ms: number }
  effects?: Effect[]
}
```

- 生成器は `shell.supports ⊇ 使用スロット集合` を検証してから合成する（§8.3 R2）
- 1広告内で同一スロットに2挙動は不可（型で不可能。§8.3 R1）
- 新パターン追加の典型はコードゼロ（既存シェル + 既存挙動の組み合わせを JSON に書くだけ）。コードが要るのは
  「新しいシェル」か「新しい挙動」を追加するときだけ

## 7.1 MVP で実装するシェル × 挙動（GAME §23 の15パターンをカバー）

15パターンに対し、シェルは想定8種のうち **4種**、挙動は **約8種**で足りる。共有できるものは共有する。

| ShellId | behaviors（slot: BehaviorId） | カバーするパターン |
|---|---|---|
| `popup` | close: `tiny` / `delayed` / `moving` / `fake` | CLS-01 Tiny, CLS-03 Delayed, CLS-05 Moving, CLS-11 Fake Close, INT-01 Popup |
| `interstitial` | surface: `fullscreen`, close: `delayed` | OBS-01 Fullscreen Overlay |
| `stickyBanner` | surface: `stickyBottom`, attention: `fakeAudioBadge` | OBS-03 Sticky Bottom, OBS-06 Floating Video, ATT-01/02 Auto-play |
| `fakeDownload` | deception: `disguiseAsButton`, hitbox: `expanded` | DEC-02 Fake Download, DEC-03 Fake Play |
| （任意シェル + instability 挙動） | instability: `transformShift` | LAY-01 Layout Shift |
| （任意シェル + persist 挙動） | persist: `respawn` / `multiLayer` | PER-01 Respawn, PER-02 Multi-layer |

シェル・挙動の最終確定は Q3（§13）。`COM-03 Sticky + Popup` のような Compound は
**専用の shell/behavior を持たない**。ステージ生成器が複数広告インスタンスを同時に起動するだけで成立する。
これが Compound を独立実装しない理由（旧方針を維持）。

## 7.2 ATT-02 Auto-play Sound の扱い（重要）

**実際に音を鳴らさない。** DESIGN_REQ §12 / DESIGN §20 で自動再生は禁止されている。

代わりに:
- 画面に「🔊 音声が再生されています」という**偽の表示**を出す
- 実際の音は `accessibility.audioEnabled === true`（ユーザーが明示的にONにした）ときのみ鳴る
- ゲームメカニクスとしては「音源を止める」操作が要求される。音が鳴っていなくても成立する

「音を鳴らす広告を批判するサイトが勝手に音を鳴らす」矛盾を避けつつ、パターンは体験させる。

---

# 8. Stage Generator（DECISIONS_v0.2.md §3 により改訂）

## 8.1 v0.1 の生成器の問題

「候補から k 個ランダムに抽選」は無数のバリエーションを作れるが**面白さを保証しない**。
純粋ランダムの組み合わせは手作り15ステージより体験が劣る（ローグライクの既知の教訓。v0.2 §3.1）。

## 8.2 エンカウンターテンプレート

ステージ = テンプレートの列。テンプレート = 役割スロットの列。生成器が役割ごとにカタログから埋める。

```ts
type EncounterTemplate = {
  id: string
  roles: RoleSlot[]
  spacingMs: Range                     // 役割間の出現間隔
}
type RoleSlot = {
  role: 'interrupt' | 'trap' | 'pressure' | 'wildcard' | 'finale'
  categories?: PatternCategoryCode[]   // 例: trap → ['DEC','CLS']
  difficulty?: Range
  requireTags?: ComboTag[]
  forced?: PatternId                   // チュートリアル・ステージ導入用
}

function generateStage(cfg: {
  stageDef: StageDefinition            // エンカウンターテンプレート列を持つ
  catalog: PatternDefinition[]
  rng: Rng
}): ScheduledSpawn[]
```

アルゴリズム（役割スロット1つあたり）:

```text
1. role.categories / role.difficulty / role.requireTags で候補パターンを絞る
2. game facet を持ち、shell/behavior が registry に存在するものだけ残す
3. §8.3 の R1〜R8 を満たさない候補を除外
4. rng('stage') + rendezvous hashing（§8.4）で1件選ぶ（forced があればそれを使う）
5. rng('timing') で各 Range を確定値に焼き込む
6. role 間は spacingMs で間隔を空けて ScheduledSpawn に積む
7. ステージ全体の難易度が目標帯から外れたら棄却して再抽選（R7、最大N回）
→ ScheduledSpawn[] を返す（以降、実行中に再抽選しない）
```

- 物語ステージ: テンプレートを固く（役割・カテゴリを絞る）→ **同じ「起承転結」で中身だけ変わる**。
  GAME §12 の Stage 1-5 はテンプレート列として表現する
- Endless: テンプレートを緩く、ウェーブごとに難易度帯を上げる
- **テンプレート自体もデータ**（`data/templates/*.json`）。ハードコードしない（GAME §13）

## 8.3 合成妥当性ルール（生成時に全チェック）

| ルール | 内容 | 違反時 |
|---|---|---|
| R1 スロット排他 | 1広告内で同一スロットに2挙動は不可 | 構造上不可能（型） |
| R2 シェル互換 | `shell.supports ⊇ 使用スロット` | 候補から除外 |
| R3 ペア非互換 | カタログの `incompatibleWith`（対称） | 除外 |
| R4 摩擦上限 | 1広告内の `Σ behavior.friction ≤ FRICTION_CAP` | 除外（moving + tiny + delayed の同時は物理的に不公平） |
| R5 認知負荷予算 | 同時アクティブ広告の `Σ load ≤ LOAD_BUDGET[device]` | 出現を遅延 |
| R6 SAFE-01 | 全広告が `MAX_CLOSE_DELAY_MS` 以内に閉じられる | 除外 |
| R7 難易度帯 | 生成結果の難易度が目標帯 ± tolerance | 棄却して再抽選（最大 N 回） |
| R8 frame 要件 | `pattern.frame ⊆ profile capabilities` | 除外 |

R4・R5 は v0.1 になかった。**個々のパターンが公平でも、組み合わせは不公平になり得る**ため追加した（v0.2 §3.3）。
`FRICTION_CAP` / `LOAD_BUDGET` の初期値は Q1（§13）。

## 8.4 seed の安定性（rendezvous hashing）

カタログにパターンを追加すると、配列インデックス抽選では**過去の全 seed の結果が変わる**。共有された Seed Challenge が壊れる。

対策: 候補ごとに `w = hash(seed, stream, patternId)` を計算し、上位 k を採る（rendezvous / HRW hashing）。
パターン追加は「新パターンの w が上位に入った場合」だけ結果を変える。既存 seed の大半は保存される。

加えて seed URL に `catalogVersion` を含め、不一致時は「旧バージョンの地獄です」と明示する。黙って違う結果を出さない。

## 8.5 難易度カーブ（旧 §8.1）

`StageDifficulty = Pattern Difficulty + Interaction Complexity + Uncertainty + Time Pressure + Combo Complexity`
（GAME §11）

これは**生成後に計算して検証する**（R7）。狙った難易度帯に収まらない生成結果は棄却して再抽選（最大N回）。
「seed によっては理不尽に難しい」を構造的に防ぐ（GAME §15 Fairness）。

## 8.6 テスト方針（組み合わせ爆発への回答）

全組み合わせのテストは不可能。以下で代替する（v0.2 §3.5）。

1. **挙動を単体で**（約20個）
2. **シェルを単体で**（約8〜15個、視覚回帰）
3. **カタログ定義の90通り**を通す
4. **property test**: ランダム seed × 1000 で R1〜R8 と SAFE-01 が成立
5. **残余リスクを明示**: 個別の組み合わせの「理不尽さ」は CI では検出できない。プレイテストで発見し、
   `incompatibleWith` と `friction` 値に還元する運用にする

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

**v0.2 §5.3 により改訂:** 旧 `scoreEffect`（パターン個別の手打ち値、PATTERN_SCHEMA 旧§3）は廃止した。
`onClear` は難易度3軸から導出する: `onClear = BASE × mean(interactionComplexity, uncertainty, timePressure)`。
severity からは導出しない（禁止は維持）。90パターン分の手調整を不要にするための変更。

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

## 9.4 Prioritization / threat（DECISIONS_v0.2.md §5 により新設）

GAME §7.4 は「今どれを処理するのが一番危険か」を「一番近いボタンを押すことより重要」と位置づけているが、
v0.1 にはこれを評価する仕組みがなく、どの順で処理しても同スコアだった。要件の最重要スキルが設計から抜けていた。

各アクティブ広告に、毎 tick 計算される **threat** を持たせる。

```ts
threat(ad) = drain(ad)          // patienceEffect.perSecondAlive（放置コスト）
           + block(ad)          // 本文を覆って progress を止めているか（0 or 定数）
           - trapRisk(ad)       // 焦って触ると大ダメージ（onMistake が大きい）→ 後回しが正解
```

| 種別 | drain | block | trapRisk | 正解 |
|---|---|---|---|---|
| 自動音声 | 高 | 0 | 低 | 最優先で止める |
| 全画面オーバーレイ | 中 | 高 | 低 | 次に閉じる |
| 下部固定バナー | 低 | 中 | 低 | 余裕があれば |
| 偽×付きポップアップ | 0 | 中 | 高 | 慌てず最後に、慎重に |
| 偽ダウンロード | 0 | 0 | 高 | 触らない（REPORT） |

広告を処理した瞬間、**その時点で最も threat の高い広告を処理したか**を判定し、正しければ **triage bonus**。
連続で正しければ chain に乗る（§9.3 の既存コンボ機構に統合）。ヘッドレスで決定論的に計算できる。
「近いものから押す」「全部即座に閉じる」が最適にならない。判断が要る設計にする。

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
| `behavior/*.test.ts` | 各 behavior を単体で。GAME §25.4 |
| `shell/*.test.ts` | 各 shell を単体で（視覚回帰含む） |
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
5. **Q1 (DECISIONS_v0.2.md §9)**: `FRICTION_CAP` / `LOAD_BUDGET` の初期値。TASK-008 実装時に `EngineTuning` へ仮置きし、
   面白さゲート（§7 面白さゲート、DECISIONS_v0.2.md §7）通過判定と合わせて調整する。
