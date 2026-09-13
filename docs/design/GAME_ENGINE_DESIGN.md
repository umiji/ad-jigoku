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

# 7. BehaviorRegistry + ShellRegistry

> **v0.2 改訂（`DECISIONS_v0.2.md` §1, D2。ADR-009）。** v0.1 の単一 `SimulatorRegistry` /
> `PatternSimulator` は廃止する。挙動しか表現できず、見た目が本質のカテゴリ E（偽装系）を
> 表現できなかったため。**Shell（見た目）と Behavior（挙動）を別レジストリに分離する。**

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
  readonly slot: Slot                // spawn/surface/close/persist/attention/instability/deception/hitbox
  readonly friction: number          // 公平性計算用の重み（§8.2 R4）
  readonly load: number              // 認知負荷（§8.2 R5）
  init(params: Record<string, number>, ctx: SpawnContext): S
  onTick(s: S, ctx: SimContext): BehaviorResult<S>
  onIntent(s: S, intent: Intent, ctx: SimContext): BehaviorResult<S>
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

- **ShellRegistry**: `register(shell)` / `resolve(id)`。重複 ID を拒否
- **BehaviorRegistry**: `register(behavior)` / `resolve(id, slot)`。スロット不一致を拒否
- 広告インスタンス = `Shell × Behaviors（スロット毎に最大1）× Creative`。生成時に
  `shell.supports ⊇ 使用スロット` を検証する（`close:moving` は close 部位のあるシェルにしか差せない）

## 7.1 MVP で実装するシェル × 挙動（GAME §23 の15パターンをカバー）

パターン数 15 に対し、シェル約8種 × 挙動約20種の組み合わせで表現する（Q3: シェル最終確定は
TASK-013A/B/C 着手時）。共有できるものは共有する。

| Shell | 対応する Behavior（slot） | カバーするパターン |
|---|---|---|
| `popup` | close:instant/delayed/moving/fake（close） | INT-01 Popup, CLS-03 Delayed, CLS-01 Tiny, CLS-05 Moving, CLS-11 Fake Close |
| `interstitial` | surface:fullscreen（surface） | OBS-01 Fullscreen Overlay |
| `stickyBanner` | persist:sticky（persist） | OBS-03 Sticky Bottom |
| `videoPlayer` | persist:sticky（persist）, attention:autoplay-video/sound（attention） | OBS-06 Floating Video, ATT-01 Auto-play Video, ATT-02 Auto-play Sound(simulated) |
| `fakeDownload` | deception:fake-download（deception） | DEC-02 Fake Download |
| `fakePlay` | deception:fake-play（deception） | DEC-03 Fake Play |
| `inlineRect` | instability:shift（instability） | LAY-01 Layout Shift |
| `densityStack` | persist:respawn/multi-layer（persist） | PER-01 Respawn, PER-02 Multi-layer |

そして `COM-03 Sticky + Popup` のような Compound は **専用の Shell/Behavior を持たない**。
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

> **v0.2 改訂（`DECISIONS_v0.2.md` §3, D4）。** v0.1 の「候補から k 個ランダム抽選」は
> 無数のバリエーションを作れるが面白さを保証しない（純粋ランダムは手作りに劣る、というローグライクの
> 既知の教訓）。**エンカウンターテンプレートによる構造化生成**に置き換える。

## 8.1 エンカウンターテンプレート

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
```

例（Stage 3「なんかおかしくない？」の1エンカウンター）:
`[ {interrupt: INT/OBS, diff 1-2}, {trap: DEC/CLS, diff 3-4}, {wildcard} ]`

- 物語ステージ: テンプレートを固く（役割・カテゴリを絞る）→ **同じ「起承転結」で中身だけ変わる**
- Endless: テンプレートを緩く、ウェーブごとに難易度帯を上げる
- テンプレート自体もデータ（`data/templates/*.json`）

```ts
function generateStage(cfg: {
  stageDef: StageDefinition
  templates: EncounterTemplate[]
  catalog: PatternDefinition[]
  rng: Rng
}): ScheduledSpawn[]
```

## 8.2 合成妥当性ルール（生成時に全チェック）

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

R4・R5 が v0.1 になかった。**個々のパターンが公平でも、組み合わせは不公平になり得る**。ここで止める。
`FRICTION_CAP` / `LOAD_BUDGET` の初期値は TASK-008 実装時に仮置きし、面白さゲート（GAME §7）で調整する（Q1）。

アルゴリズム（v0.2 版。R1〜R8 をこの中で検査する）:

```text
1. stageDef からテンプレート列を選ぶ（物語ステージは固定、Endless は緩い）
2. テンプレートの各 RoleSlot について、difficulty band / categories で候補パターンを絞る
3. game facet を持ち、shell が ShellRegistry に存在するものだけ残す  ← AD-2
4. R2（シェル互換）・R3（ペア非互換）を満たさない候補を除外
5. rng('stage') で各 RoleSlot を1つ抽選（rendezvous hashing。§8.4）
6. rng('timing') で各 Range を確定値に焼き込む
7. R4（摩擦上限）・R5（認知負荷予算）・R8（frame 要件）を適用
8. 同時出現数の上限（mobile では少なく）を適用       ← DESIGN §19
9. R6（SAFE-01）検査: 全 spawn の closableAt が上限以内
10. R7（難易度帯）検査。収まらなければ棄却して再抽選（最大 N 回）
11. ScheduledSpawn[] を返す（以降、実行中に再抽選しない）
```

**ステージ定義・テンプレート定義はデータ。** GAME §12 の Stage 1-5 は `data/stages/*.json`、
テンプレートは `data/templates/*.json` になる。ハードコードしない（GAME §13）。

## 8.3 難易度カーブ

`StageDifficulty = Pattern Difficulty + Interaction Complexity + Uncertainty + Time Pressure + Combo Complexity`
（GAME §11）

これは**生成後に計算して検証する**（R7）。狙った難易度帯に収まらない生成結果は棄却して再抽選（最大N回）。
「seed によっては理不尽に難しい」を構造的に防ぐ（GAME §15 Fairness）。

## 8.4 seed の安定性（rendezvous hashing）

カタログにパターンを追加すると、配列インデックス抽選では**過去の全 seed の結果が変わる**。
共有された Seed Challenge が壊れる。

対策: 候補ごとに `w = hash(seed, stream, patternId)` を計算し、上位 k を採る（rendezvous / HRW hashing）。
パターン追加は「新パターンの w が上位に入った場合」だけ結果を変える。既存 seed の大半は保存される。

加えて seed URL に `catalogVersion` を含め、不一致時は「旧バージョンの地獄です」と明示する。
黙って違う結果を出さない。

## 8.5 テスト方針（組み合わせ爆発への回答）

全組み合わせのテストは不可能。以下で代替する。

1. **挙動を単体で**（約 20 個）
2. **シェルを単体で**（約 8〜15 個、視覚回帰）
3. **カタログ定義の 90 通り**を通す
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

> **v0.2 改訂（`DECISIONS_v0.2.md` §5.3）**: v0.1 はパターン個別の手打ち値 `scoreEffect.onClear`
> を持たせていたが、これは廃止した。`onClear` は難易度3軸（`interactionComplexity` /
> `uncertainty` / `timePressure`）の平均から導出する（§9.4.1）。severity からは引き続き導出しない。
> これにより「severity を上げたら得点が上がる」事故を防ぎつつ、90パターン分の手調整を不要にする。

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

## 9.4 Prioritization（優先順位づけ）と threat

> v0.2 追加（`DECISIONS_v0.2.md` §5, D5）。**GAME §7.4「今どれを処理するのが一番危険か」が
> 要件の最重要スキルとして位置づけられているにもかかわらず、v0.1 にはこれを評価する仕組みが
> なく、どの順で処理しても同スコアだった。** この節でその欠落を埋める。

各アクティブ広告に、毎 tick 計算される **threat** を持たせる。

```ts
threat(ad) = drain(ad)          // patienceEffect.perSecondAlive（放置コスト）
           + block(ad)          // 本文を覆って progress を止めているか（0 or 定数）
           - trapRisk(ad)       // 焦って触ると大ダメージ（onMistake が大きい）→ 後回しが正解
```

設計上の狙い（例）:

| 種別 | drain | block | trapRisk | 正解 |
|---|---|---|---|---|
| 自動音声 | 高 | 0 | 低 | **最優先で止める** |
| 全画面オーバーレイ | 中 | 高 | 低 | 次に閉じる |
| 下部固定バナー | 低 | 中 | 低 | 余裕があれば |
| 偽×付きポップアップ | 0 | 中 | **高** | **慌てず最後に、慎重に** |
| 偽ダウンロード | 0 | 0 | 高 | **触らない（REPORT）** |

「近いものから押す」「全部即座に閉じる」が最適にならない。判断が要る。

### 9.4.1 評価（triage bonus）

広告を処理した瞬間、**その時点で最も threat の高い広告を処理したか**を判定し、正しければ
triage bonus。連続で正しければ chain に乗る（§9.3 の既存コンボ機構に統合）。
ヘッドレスで決定論的に計算できる。

スコアの `onClear` はパターン個別の手打ち値（v0.1 の `scoreEffect`）を廃止し、難易度3軸から導出する:

```text
onClear = BASE × mean(interactionComplexity, uncertainty, timePressure)
```

severity からは導出しない（GAME §9.1 の禁止を維持）。90 パターンの手調整を不要にするため。

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

0. **`FRICTION_CAP` / `LOAD_BUDGET` の初期値（Q1、`DECISIONS_v0.2.md` §9）**。
   TASK-008 実装時に仮置きし、面白さゲート（GAME §7）のプレイテストで調整する。
1. **Patience の回復量**。ゼロにすると単調減少ゲームになる。実プレイで調整。
2. **同時出現数の上限**。mobile 2 / desktop 4 を初期値にしたいが要プレイテスト。
3. **`IGNORE` アクションの UI 表現**。`DEC-02 Fake Download` は「押さないのが正解」だが、
   何もしないことを能動的な選択として提示する UI が必要（そうしないと「気づいた」ことが評価できない）。
   現案: `REPORT` で「これは偽物だ」と宣言させる。押さない＋見抜いた、の両方を評価できる。
4. **Endless モードの難易度上昇関数**。線形か指数か。要プレイテスト。
