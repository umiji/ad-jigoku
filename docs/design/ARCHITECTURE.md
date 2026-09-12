# ARCHITECTURE.md

## 0. Document Status

- Status: **Draft v0.1 — REVIEW REQUESTED**
- Scope: システム全体のアーキテクチャ契約
- Upstream documents:
  - `docs/requirements/AD_UX_PATTERN_CATALOG.md` (Layer 1: パターン知識)
  - `docs/requirements/GAME_REQUIREMENTS.md` (Layer 2: ゲームルール)
  - `docs/requirements/PRODUCT_REQUIREMENTS.md` (Layer 2: サービス要件)
  - `docs/requirements/DESIGN.md` / `DESIGN_REQUIREMENTS.md` (Layer 2: UI契約)
- Downstream documents:
  - `docs/design/PATTERN_SCHEMA.md`
  - `docs/design/GAME_ENGINE_DESIGN.md`
  - `docs/design/EVALUATOR_DESIGN.md`
  - `docs/design/adr/*`
  - `docs/tasks/*`

> このドキュメントは実装前のレビュー対象である。
> 未確定事項は §20 Open Decisions に集約してある。**そこだけ読めばレビューできる**ようにしてある。

---

# 1. Architecture Drivers

要件から導出した、アーキテクチャを実際に拘束する制約。これ以外は実装時判断でよい。

| ID | Driver | 出典 | アーキテクチャへの影響 |
|---|---|---|---|
| AD-1 | 同一のパターン定義を Game / Audit / Improvement の3用途で共有する | CATALOG §Design Principle, GAME §26 | パターンカタログを **Shared Kernel** として独立パッケージ化。他の全モジュールがこれに依存し、逆方向の依存を禁止 |
| AD-2 | ゲームは data-driven。パターン追加でエンジンを書き換えない | GAME §25.5 | `PatternDefinition` + `ShellRegistry`/`BehaviorRegistry` の二層（v0.2 §1）。ステージ生成器はレジストリに登録済みの shell/behavior を持つパターンのみを選択 |
| AD-3 | 実行は seed で再現可能でなければならない | GAME §8.5, §25.2 | ゲームコアは **純粋・ヘッドレス・決定論的**。`Date.now()` / `Math.random()` / DOM へのアクセスを禁止。固定タイムステップ + シード分割RNG |
| AD-4 | 評価は Evidence-First。「なぜこの点数か」を必ず説明できる | PRODUCT §8 | Evidence を不変データとして永続化し、Score を **evidence の純粋関数** にする。スコア再計算に再クロールを要求しない |
| AD-5 | Evaluation Version で時系列比較の意味を保つ | PRODUCT §21 | `catalogVersion` / `detectorVersion` / `scoringVersion` を全 run に刻印。スコア関数はバージョン別に保持し過去分を壊さない |
| AD-6 | annoying by design, safe by implementation | DESIGN_REQ §14, DESIGN §20 | 安全性を「ガイドライン」ではなく **自動テストで強制する不変条件 (Safety Invariants)** として実装 |
| AD-7 | Mobile-first。閉じるターゲット最小 44×44 | DESIGN §19 | レイアウト決定をトークン層に集約。invariant テストで実測 |
| AD-8 | reduced-motion でも「インタラクションロジックは維持」 | DESIGN §20 | reduced-motion は CSS の話ではなく **エンジンへの入力**。`AccessibilityProfile` をエンジン設定に含める |
| AD-9 | 実広告ネットワーク・実ブランド・実遷移を一切含めない | GAME §2.3, §17 | 外部スクリプト・外部遷移をゼロに。CSP と e2e テストで機械的に保証 |
| AD-10 | LP 自体が広告地獄のデモである | DESIGN_REQ §1 | LP はコンテンツページではなく **ステートマシン**。ただしゲームエンジンとは別物（§11 参照） |
| AD-11 | 実サイト評価には長時間ブラウザ実行が必要 | PRODUCT §7 | Web アプリと Evaluator を **別デプロイユニット**に分離。serverless 前提にしない |
| AD-12 | MVP は「10分触ればもう一回やりたくなる」ことの検証 | GAME §23 | Phase 1 のクリティカルパスにバックエンドを一切入れない。ゲーム MVP は静的配信のみで成立させる |

---

# 2. Scope

## 2.1 このドキュメントが決めること

- モジュール境界と依存方向
- パターンカタログのデータフロー
- ゲームコアの決定論モデル
- 評価エンジンの4層構造の実体
- バージョニング戦略
- 安全性・アクセシビリティの強制方法
- デプロイ単位

## 2.2 決めないこと

- 具体的な CSS 値（`DESIGN.md` が source of truth）
- Severity Score の最終値（CATALOG §10、実データ Calibration 待ち）
- 課金・料金体系（PRODUCT §19、MVP 対象外）
- ランキング公開の法務ルール（PRODUCT §23、Phase 4 前に別途）

---

# 3. System Context

```text
            ┌──────────────────────────────────────────┐
            │            AD_UX_PATTERN_CATALOG          │
            │   (Markdown = 人間用 / JSON = 機械用)      │
            └───────────────────┬──────────────────────┘
                                │  Shared Kernel
        ┌───────────────┬───────┴────────┬────────────────┐
        ↓               ↓                ↓                ↓
   ┌─────────┐   ┌────────────┐   ┌────────────┐   ┌──────────────┐
   │   LP    │   │    GAME    │   │  EVALUATOR │   │ HELL GENERATOR│
   │ (物語)   │   │  (生成的)   │   │  (実測)     │   │  (内部ツール)  │
   └────┬────┘   └─────┬──────┘   └─────┬──────┘   └───────┬──────┘
        │              │                │                  │
        │              │                │         ┌────────┴────────┐
        │              │                │         ↓                 ↓
        │              │                │   Game Stage     Test Fixture Site
        │              │                │                  (= 検出器の正解データ)
        ↓              ↓                ↓
     訪問者          プレイヤー        サイト運営者 / 一般公開
        └──────────────┴────────────────┘
                       ↓
                   IMPROVEMENT → BETTER WEB UX
```

## 3.1 この図の最重要ポイント

**Hell Generator が、ゲームと評価エンジンを1つのデータ定義で繋ぐ。**

同じパターン定義から、

1. ゲームステージ
2. **検出器の検証用フィクスチャサイト（期待される検出結果込み）**
3. 自動テストシナリオ

を生成する。2 が決定的に重要で、これがないと「実サイト評価の検出器が正しいか」を検証する手段が人手レビューしかなくなる。
CATALOG §8 の Ad Hell Generator は内部ツールとして書かれているが、**アーキテクチャ上は評価エンジンの正解データ供給源**として位置づける。

---

# 4. Core Architectural Idea

> **Pattern Catalog is the Shared Kernel. Everything else is an adapter on it.**

```text
PatternDefinition (データ)
   ├── .game    → Simulator      （ゲームでどう振る舞うか）
   ├── .detect  → Detector       （実サイトでどう検出するか）
   ├── .improve → Recommendation （どう直すか）
   └── .fixture → FixtureBuilder （検証用HTMLをどう作るか）
```

1つのパターンIDに対して 4 つの facet が紐づく。全部が必須ではない（例: `OBS-05 Sticky Side Rail` は Desktop 評価では検出するがゲーム化しない）。

### 保証すべき不変条件

- パターンIDは `AD_UX_PATTERN_CATALOG.md` にあるものだけ。勝手に新設しない。
- Simulator / Detector は必ず既存パターンIDに紐づく。**孤児実装を CI で落とす。**
- カタログ Markdown と JSON の乖離を CI で検出する（parity test）。

---

# 5. Container / Repository Structure

pnpm workspaces + Turborepo による monorepo。

```text
ad-jigoku/
├── apps/
│   ├── web/                    # Next.js: LP / Game / Audit / Ranking
│   │   └── src/game/frame/     #   BrowserFrame（偽ブラウザ枠）実装。DECISIONS_v0.2.md §2
│   └── evaluator-worker/       # Node + Playwright: 実サイト観測 + 検出 + 採点
│
├── packages/
│   ├── pattern-catalog/        # ★ Shared Kernel。zero runtime deps
│   │   ├── schema/             #   zod スキーマ + 型
│   │   ├── data/               #   patterns/*.json (source of truth for machines)
│   │   └── query/              #   フィルタ・互換性判定 API
│   │
│   ├── game-engine/            # ヘッドレス・純粋・決定論的なゲームコア
│   │   ├── core/               #   reducer / fixed timestep / RNG
│   │   ├── stage/              #   ステージ生成器（エンカウンターテンプレート）
│   │   ├── shell/              #   ShellRegistry（見た目）
│   │   ├── behavior/           #   BehaviorRegistry（挙動）。旧 simulators/ を置き換え
│   │   └── scoring/            #   score / combo / patience / threat
│   │
│   ├── evaluator-core/         # 純粋関数: Evidence → Finding → Score
│   │   ├── detectors/
│   │   ├── scoring/            #   バージョン別スコア関数
│   │   └── recommend/
│   │
│   ├── hell-generator/         # パターン集合 → ステージ / フィクスチャ / 期待値
│   │
│   ├── ui/                     # デザイントークン + canonical components
│   │   ├── tokens/             #   DESIGN.md §4,5,6,14,15,16 の唯一の実体
│   │   ├── shells/             #   Shell 実装（見た目）。1 shell = 1 独立モジュール。DECISIONS_v0.2.md §1.3
│   │   └── components/         #   AdPopup, AdMeta, AdCountdown, ...
│   │
│   └── safety/                 # Safety Invariants のテストキット（LP/Game 共用）
│
├── docs/
│   ├── requirements/
│   ├── design/
│   └── tasks/
└── fixtures/                   # hell-generator が生成する検証用サイト（生成物）
```

## 5.1 依存ルール（CI で強制）

```text
pattern-catalog   →  (何にも依存しない。React / DOM / Playwright を import 禁止)
game-engine       →  pattern-catalog                    (React / DOM import 禁止)
evaluator-core    →  pattern-catalog                    (Playwright import 禁止)
hell-generator    →  pattern-catalog
ui                →  pattern-catalog (型のみ)            (game-engine 依存禁止)
safety            →  (テスト専用)
apps/web          →  pattern-catalog, game-engine, ui, evaluator-core(型)
apps/evaluator-worker → pattern-catalog, evaluator-core, hell-generator, playwright
```

**禁止:** `packages/*` から `apps/*` への依存。`game-engine` から DOM API への依存。`evaluator-core` から Playwright への依存（＝観測と判定を分離し、保存済み Evidence で再判定できる状態を保つ / AD-4）。

これは eslint の `import/no-restricted-paths` と、各パッケージの `package.json` 依存の CI 検査で機械的に守る。

---

# 6. Pattern Data Model (概要)

詳細は `docs/design/PATTERN_SCHEMA.md`。ここでは構造だけ示す（v0.2 §1 反映済み）。

```ts
type PatternDefinition = {
  id: PatternId                       // "CLS-11" など。CATALOG と 1:1
  category: PatternCategory           // A..K
  name: { ja: string; en: string }
  definition: { ja: string }
  severity: number                    // 0-20  (UX 影響度)
  gameDifficulty: 1|2|3|4|5           // UX Severity とは独立軸 (CATALOG §1.3)
  dimensions: Partial<Record<UxDimension, number>>  // Interruption, Obstruction, ...

  game?: GameFacet
  detect?: DetectFacet
  improve?: ImproveFacet
  fixture?: FixtureFacet
  escape?: EscapeFacet                // ユーザー向け脱出ノウハウ。DECISIONS_v0.2.md §6
}

type GameFacet = {
  shell: ShellId                                   // 見た目。ShellRegistry のキー
  behaviors: Partial<Record<Slot, BehaviorSpec>>   // 挙動。スロット毎に最大1つ
  creative?: CreativeSelector                      // 中身の抽選条件
  frame?: FrameCapability[]                        // 必要な偽ブラウザ機能（§2）

  playerActions: PlayerAction[]       // 正解となる操作
  failureCondition: FailureCondition
  warning: 'none' | 'subtle' | 'explicit'
  interactionComplexity: 1|2|3|4|5    // CATALOG §4
  uncertainty: 1|2|3|4|5
  timePressure: 1|2|3|4|5
  comboTags: ComboTag[]
  incompatibleWith: PatternId[]
  patienceEffect: { onSpawn: number; onMistake: number; perSecondAlive: number }
  // scoreEffect は削除。難易度3軸から導出する（GAME_ENGINE_DESIGN.md §9.1）
}

type DetectFacet = {
  layer: 1|2|3                        // Browser Evidence / Deterministic / Vision
  signals: SignalRef[]                // 必要な Evidence の種類
  detectorId: DetectorId
  confidence: 'deterministic' | 'heuristic' | 'vision'
}
```

## 6.1 Markdown と JSON の関係

- `AD_UX_PATTERN_CATALOG.md` = **人間の source of truth**（議論・レビュー・公開用）
- `packages/pattern-catalog/data/patterns/*.json` = **機械の source of truth**
- CI で双方向の整合を検査する（ID集合・Severity・Game Difficulty の一致）。
- 齟齬があれば **Markdown を正として JSON を直す**。逆はしない。

これは PRODUCT §23「評価基準の公開」の要件も同時に満たす（公開する Markdown が実際の挙動と一致していることを CI が保証する）。

---

# 7. Game Engine Architecture

詳細は `docs/design/GAME_ENGINE_DESIGN.md`。

## 7.1 中核方針

> **ゲームコアは「DOM を持たない純粋な状態機械」。React は単なる描画先。**

```ts
// 全ての状態遷移がこの1関数を通る
function step(state: GameState, intent: Intent, ctx: EngineContext): StepResult
type StepResult = { state: GameState; effects: Effect[] }
```

- `Effect` は「画面を揺らせ」「効果音を鳴らせ」といった**宿主への指示**。エンジン自身は実行しない。
- 時間は `{ type: 'tick', dtMs }` intent でのみ進む。エンジン内部で時刻を読まない。
- 乱数は `ctx.rng(streamName)` 経由のみ。

## 7.2 決定論の担保

| 仕組み | 内容 |
|---|---|
| 固定タイムステップ | 宿主の rAF delta をアキュムレータで 16.667ms 固定ステップに分割。フレームレート差で結果が変わらない |
| シード分割RNG | `hash(seed + streamName)` で独立ストリームを派生。`spawn` / `placement` / `deception` / `jitter` を分離。**新ストリーム追加で既存 seed の結果が変わらない** |
| 入力の正規化 | ポインタ座標ではなく `TargetRef`（論理ターゲット）を記録。解像度差でリプレイが壊れない |
| 状態ハッシュ | 任意ステップで `hashState(state)` を取れる。リプレイ回帰テストの assertion に使う |

リプレイ = `{ seed, catalogVersion, engineVersion, intents: [stepIndex, Intent][] }`。
これがそのまま Seed Challenge (GAME §8.5) と回帰テストの両方に使える。

## 7.3 パターン実装モデル: Shell × Behavior（DECISIONS_v0.2.md §1 により改訂）

**v0.1 の `PatternSimulator`（1パターン = 1シミュレータ）は撤回する。** 挙動しか表現できず、
見た目そのものが本質のカテゴリ E（偽装系）を表現できなかったため（v0.2 §1.1）。旧定義は git history 参照。

```text
広告インスタンス = Shell（見た目） × Behaviors（挙動。スロット毎に最大1） × Creative（中身）
```

```ts
interface Shell {
  readonly id: ShellId
  readonly parts: AdPart[]          // close / fake-close / cta / media / label ...
  readonly supports: Slot[]         // 受け付ける挙動スロット
  readonly frame?: FrameCapability[]
}

interface Behavior<S = unknown> {
  readonly id: BehaviorId
  readonly slot: Slot                // spawn/surface/close/persist/attention/instability/deception/hitbox
  readonly friction: number          // 合成妥当性チェック用。GAME_ENGINE_DESIGN.md §8
  readonly load: number              // 認知負荷予算用。同上
  init(params, ctx): S
  onTick(s, ctx): BehaviorResult<S>
  onIntent(s, intent, ctx): BehaviorResult<S>
}
```

- 旧 `SimulatorRegistry` は **`ShellRegistry` + `BehaviorRegistry`** の2レジストリに置き換える
- シェルは独立モジュール。`packages/ui/shells/<id>/` に HTML/CSS/JS をまとめて持ち、共通化しない
- 生成器は `shell.supports ⊇ 使用スロット集合` を検証してから合成する（GAME_ENGINE_DESIGN.md §7, §8）

新パターン追加の典型手順（コードゼロ）:

```text
1. 既存シェル + 既存挙動の組み合わせをカタログ JSON に書く（Markdown 定義 → JSON、CI が parity 検査）
→ ステージ生成器が自動的に採用対象にする
```

コードが要るのは「新しいシェル」または「新しい挙動」を追加するときだけ。

## 7.4 描画方式: DOM（Canvas / WebGL ではない）

**ADR-003 で決定。** 理由:

- このゲームの敵は「Webページそのもの」である。`position: fixed`、z-index の積み重なり、実際のタップ領域、レイアウトの押し下げ——これらは **DOM でしか正しくパロディにならない**
- キーボード操作・スクリーンリーダー・44px タップ領域（AD-7, AD-8）を Canvas で満たすのは非現実的
- `DESIGN.md §20` の a11y 要件は DOM 前提
- パフォーマンス要件（DESIGN §20）は「軽量であること」であり、60fps の大量描画ではない

例外: 破壊演出 (SMASH / RAGE) のパーティクルのみ Canvas を許可する。ゲームロジックは持たせない。

## 7.5 Layout Shift の実装方針（重要）

`LAY-01 Layout Shift` 等を**本物の reflow で実装しない**。`transform` ベースで見た目だけ再現する。

理由:
- 本物の reflow は実際の Core Web Vitals (CLS) を悪化させる。「広告UXを測るサービス」自身のCLSが悪いのは矛盾
- スクリーンリーダーのフォーカス位置を実際に破壊してしまい、AD-6 に違反する
- transform ベースなら `prefers-reduced-motion` で無効化するのも容易

見た目は同一、実害はゼロ。これが `annoying by design, safe by implementation` の具体例。

---

# 8. LP Architecture

## 8.1 LP はゲームエンジンを使わない

意図的な判断。

| | LP | Game |
|---|---|---|
| 目的 | 物語を語る | 生成的な遊び |
| 進行 | 台本どおり（決め打ち順序） | seed によるランダム生成 |
| 失敗 | 存在しない | 存在する |
| 評価 | しない | スコア・忍耐力 |

LP に game-engine を使うと、LP の都合でエンジンに「失敗しないモード」「固定順序モード」が混入し、エンジンが汚れる。

**共有するのは `packages/ui`（AdPopup 等の見た目・挙動）と `pattern-catalog`（どのパターンか）だけ。**
LP 側は軽量な `LpFlow` ステートマシン（XState 不要、100行程度の reducer）で十分。

## 8.2 LP のナビゲーションモデル

```text
stage: 0..8   (DESIGN.md §10 の 01 WELCOME .. 09 GAME/AUDIT に対応)

advance条件 = 「そのステージの ad が全て close された」
```

- ステージ定義はデータ（`lp/stages.ts`）。DESIGN_REQ §7 のエスカレーション表がそのまま設定値になる
- **各ステージには必ず終了条件がある**（DESIGN_REQ §7）。無限ループは型レベルで作れないようにする（`AdConfig.action` に必ず終端がある）
- スクロールは奪わない（DESIGN §11）。ad の出現は scroll threshold の observer で発火するだけ

**BrowserFrame との関係:** LP はゲーム側の偽ブラウザ枠（`BrowserFrame`、DECISIONS_v0.2.md §2）を使わない。
LP の「ページ」はそれ自体が本物のブラウザタブ内の1ページであり、偽ブラウザで入れ子にする必要がない。
`BrowserFrame` は Game 領域（`apps/web/src/game/frame/`）専用の構造で、INT-06 Back-Intercept や
ACC-06 Scroll Hijack のような「実ブラウザの機能を模倣するが実際には触らない」パターンを安全に成立させるために存在する（v0.2 §2.2）。

---

# 9. Evaluator Architecture

詳細は `docs/design/EVALUATOR_DESIGN.md`。

## 9.1 パイプライン

```text
 URL
  ↓
[ Probe ]            Playwright。シナリオを実行し観測するだけ。判定しない
  ↓
EvidenceBundle       不変・バージョン付き・永続化される
  ↓
[ Detectors ]        純粋関数。EvidenceBundle → Finding[]
  ↓                  (Layer2=決定論的 / Layer3=Vision は別 detector として分離)
Finding[]            pattern_id + 根拠 + 測定値 + evidence への参照
  ↓
[ Scorer ]           純粋関数。Finding[] → ScoreBreakdown  （バージョン指定可）
  ↓
Report               Score + 根拠 + 改善提案 + Before/After
```

## 9.2 最重要の設計判断: 観測と判定の分離

**Score は EvidenceBundle の純粋関数である。**

これが効くところ:

| 要件 | この設計で得られること |
|---|---|
| PRODUCT §8 Evidence-First | Finding が必ず evidence への参照を持つ。「なぜこの点数か」が構造的に答えられる |
| PRODUCT §21 Evaluation Versioning | 保存済み evidence に対して新旧スコア関数を両方走らせ、差分が「サイトの変化」か「基準の変化」かを切り分けられる |
| CATALOG §10 Calibration | Severity 値を変えても**再クロールなしで全履歴を再計算できる** |
| PRODUCT §14 異議申立て | 運営者に evidence を提示できる。再評価も同一条件で再現できる |
| PRODUCT §22 測定条件の固定 | Probe シナリオがバージョン付きの明示的な定義になる |

逆に、Playwright の中でその場で点数を付ける実装にすると、上の 5 つが全部できなくなる。ここは譲らない。

## 9.3 Layer 3 (Vision/AI) の扱い

- Vision detector も**同じ `Detector` インターフェース**を実装する。ただし `confidence: 'vision'` を返す
- **AI の出力をそのままスコアにしない。** AI は「判断」ではなく「根拠付きの Finding」を返す契約にする（PRODUCT §8）
- Vision Finding は Basic Report ではスコアに入れず、`advisory` として別枠表示する（MVP 方針）。決定論的検出だけでスコアを構成すれば、スコアの説明責任が保てる

## 9.4 検出器の正解データ

`hell-generator` が生成するフィクスチャサイトを使う。

```text
PatternSet → fixture site (実際のHTML/CSS/JS) + expected Finding[]
                ↓
        Probe → Detectors → actual Finding[]
                ↓
           精度レポート (precision / recall / パターン別)
```

これを CI に入れる。実サイトを使ったテストは不安定（サイト側が変わる）なので、回帰テストはフィクスチャで行い、実サイトは手動 calibration セットとして別管理する。

---

# 10. Design System Architecture

## 10.1 トークンの唯一の実体

```text
packages/ui/tokens/tokens.ts      ← TypeScript が source of truth
        ↓ build
    tokens.css  (CSS custom properties)
        ↓
    ・ apps/web のスタイル
    ・ Tailwind v4 の @theme バインディング
    ・ ドキュメント生成 (トークン一覧ページ)
```

`DESIGN.md §4,5,6,14,15,16` の YAML をそのまま `tokens.ts` に落とす。値の重複定義を作らない。

## 10.2 DESIGN.md 違反を機械的に落とす

`DESIGN.md` は「Claude Code が従う設計契約」と明記されている（§0）。人間のレビューだけに頼らず lint する。

| ルール | 強制方法 |
|---|---|
| 生の16進カラー禁止 (DESIGN §4) | stylelint `color-no-hex` + トークン参照のみ許可 |
| 勝手なコンポーネント新設禁止 (DESIGN §21) | `CoolCard` 等の禁止名を eslint で拒否。新規コンポーネントは `ui/components/index.ts` の allowlist 経由 |
| z-index の直書き禁止 (DESIGN §15) | `z-index` に数値リテラルを禁止、トークンのみ |
| 44px タップ領域 (DESIGN §19) | Playwright の safety invariant テストで実測 |
| reduced-motion (DESIGN §20) | 同上 + エンジン設定の型で必須化 |

## 10.3 スタイリング方式

Tailwind CSS v4 の CSS-first 設定 (`@theme`) を `tokens.css` にバインドする。

- Tailwind を「デフォルトのSaaS見た目」として使うのではなく、**トークンへのショートハンド**としてのみ使う
- 任意値 (`w-[123px]`, `bg-[#ff0000]`) を eslint で禁止する
- 複雑な広告演出は CSS Modules で書く

→ **これは §20 OD-1 でレビューしてほしい。** Tailwind を一切使わず CSS Modules + トークンのみ、という選択肢もある。

---

# 11. Safety & Accessibility as Executable Invariants (AD-6)

`packages/safety` に、LP とゲーム両方に対して走る共通テストスイートを置く。

| ID | 不変条件 | 検証方法 |
|---|---|---|
| SAFE-01 | 全ての広告は最大 `MAX_CLOSE_DELAY_MS` 以内に必ず閉じられる状態になる | game-engine の property test（全パターン × 1000 seed） |
| SAFE-02 | フォーカストラップを作らない | Playwright: Tab を N 回押して必ずページ外に出られる |
| SAFE-03 | document のスクロールを恒久的にロックしない | Playwright: 各ステージでスクロール可能性を assert |
| SAFE-04 | ユーザー操作なしに音を鳴らさない | AudioContext のモックで `resume()` 呼び出しを監視 |
| SAFE-05 | 外部サイトへ遷移しない | Playwright: 全リンク・全CTAを踏み、cross-origin navigation ゼロを assert |
| SAFE-06 | ブラウザ Back を妨害しない | `history.length` の増減と back 動作を assert |
| SAFE-07 | reduced-motion 時に moving close が無効、ロジックは維持 | エンジンの unit test + e2e |
| SAFE-08 | close ターゲットが 44×44 CSS px 以上（mobile viewport） | Playwright の bounding box 実測 |
| SAFE-09 | ダウンロードを発生させない | Playwright の download イベント監視 |
| SAFE-10 | 偽UIで入力を収集しない | fake form の submit ハンドラが存在しないことを静的検査 |
| SAFE-11 | 外部スクリプトを読み込まない | CSP ヘッダ + ネットワークリクエストの allowlist assert |
| SAFE-12 | `BrowserFrame` は実ブラウザ UI を模倣しない。偽 URL バーに実在ドメインを表示しない | Playwright: Safari/Chrome 既知セレクタとの視覚差分 + 偽 URL バーの表示文字列を allowlist（架空ドメインのみ）で assert（DECISIONS_v0.2.md §2.4） |
| SAFE-13 | ゲーム / LP ルートに実広告ネットワークのスクリプトが存在しない | CSP + ルート単位の静的検査（DECISIONS_v0.2.md §8.2） |

これは「後で気をつける」ものではなく、**TASK-028 で MVP 前に実装し、以降すべての PR で走らせる**。
このプロダクトは広告UXを批判する立場なので、自分がダークパターンをやってしまうと信用が即死する。

---

# 12. Data Model / Persistence

## 12.1 Phase 1 (Game MVP): バックエンドなし

- 状態は localStorage のみ（ベストスコア、パターン mastery、音声ON/OFF）
- seed は URL クエリで共有
- **DB もアカウントも作らない。** AD-12。

## 12.2 Phase 3 以降 (Audit)

PostgreSQL。主要テーブル:

```text
audit_run
  id, url, domain, requested_at, finished_at, status
  viewport_profile        ('mobile-390x844' | 'desktop-1440x900')
  scenario_version        Probe シナリオのバージョン
  catalog_version, detector_version, scoring_version
  evidence_uri            オブジェクトストレージ上の EvidenceBundle

finding
  id, run_id, pattern_id, confidence, measured_values(jsonb),
  evidence_refs(jsonb), severity_applied

score
  run_id, scoring_version, total, breakdown(jsonb), computed_at
  ※ (run_id, scoring_version) が PK。同一 run に複数バージョンのスコアが並存できる

site
  domain, first_seen, latest_run_id, public_visibility, appeal_status

improvement
  id, domain, before_run_id, after_run_id, delta
```

- スクリーンショット等のバイナリは S3 互換ストレージ（PRODUCT §30 D5 の takedown 要件があるので、**参照を消せばアクセス不能になる構造**にしておく）
- 個人情報は保持しない（PRODUCT §20）

## 12.3 Evidence のサイズ対策

EvidenceBundle は 1 run で数MB〜数十MB（スクリーンショット、トレース）になる。

- 構造化データ（DOM スナップショット、計測値）と バイナリ（画像・動画）を分離
- 構造化部分は gzip した JSON として保存し、常に再スコア可能に保つ
- バイナリはライフサイクルポリシーで古いものを削除してよい（スコア再計算は構造化部分だけで成立する設計にする）

---

# 13. Versioning Strategy (AD-5)

4つのバージョンを独立に持つ。

| Version | 意味 | 変わるとき |
|---|---|---|
| `catalogVersion` | パターン定義の集合 | パターン追加・Severity 変更 |
| `scenarioVersion` | Probe の測定手順 | 待機時間・スクロール量・遷移回数の変更 |
| `detectorVersion` | 検出ロジック | 検出器の実装変更 |
| `scoringVersion` | 集計式 | 式・係数の変更 |

公開表示は PRODUCT §21 の形式に揃える:

```text
Evaluation Version: v0.3
Pattern Catalog: v0.2
Scenario: v0.1
Detector: v0.3
Scorer: v0.2
Measured: 2026-XX-XX  (mobile 390x844)
```

**ルール:** `scoringVersion` を上げたら、公開中の全 run について新旧両方のスコアを保持し、ランキングは「同一 scoringVersion 内でのみ比較」する。異なるバージョン間の順位比較を UI で不可能にする。

---

# 14. Testing Strategy

| 層 | 対象 | ツール | 何を守るか |
|---|---|---|---|
| Schema | カタログ JSON | zod + parity test | Markdown と JSON の一致、孤児 simulator/detector の検出 |
| Unit | game-engine, evaluator-core | Vitest | 純粋関数としての正しさ |
| Property | game-engine | fast-check | 「全パターン × 全 seed で SAFE-01 が成立」等 |
| Replay | game-engine | Vitest | 記録した intent 列で状態ハッシュが一致（決定論の回帰） |
| Fixture | detectors | 生成フィクスチャ | 検出精度（precision/recall）の回帰 |
| Safety | apps/web | Playwright | §11 の SAFE-01..11 |
| Visual | ui | Playwright screenshot | DESIGN.md 準拠の視覚回帰 |
| a11y | apps/web | axe-core | コントラスト・ラベル・キーボード |

**game-engine がヘッドレスであることの最大の利点がここ。** ゲームロジックのテストにブラウザが要らないので、全パターン×多数 seed の網羅テストが CI で現実的な時間で回る。

---

# 15. Performance Budget

| 対象 | 予算 | 根拠 |
|---|---|---|
| LP 初期 JS (gzip) | ≤ 120 KB | DESIGN §20「premium without heavy」 |
| LP LCP (Moto G4 相当 / 4G) | ≤ 2.5s | mobile-first (AD-7) |
| LP 実 CLS | ≤ 0.05 | §7.5。演出上の「ズレ」は transform で実装するので実 CLS には出ない |
| Game 初期 JS (gzip) | ≤ 250 KB | ゲーム本体はLPと別チャンク |
| Game フレーム | 60fps / step 処理 ≤ 2ms | DOM ベースで十分達成可能 |
| フォント | 可変フォント1つ + サブセット | DESIGN §5「3ファミリまで」 |

WebGL は現時点で予算を割り当てない（DESIGN §20 / AMIX_REF §4）。

---

# 16. Deployment Topology（DECISIONS_v0.2.md §8 により改訂）

v0.1 の Vercel + Fly.io + pg-boss + S3 構成は撤回する。**Hobby プランの商用不可条項（広告掲載 = 商用）を回避し、
public repo の無料枠を最大限使う**方針に切り替える。

| 項目 | v0.1 | v0.2 |
|---|---|---|
| ホスティング | Vercel | **Cloudflare Pages** |
| Phase 1 の形態 | Next.js 動的 | **Next.js 静的書き出し**（`output: 'export'`。アダプタ不要。Phase 3 で動的化を再判断） |
| 診断ワーカー | Fly.io 常駐 + pg-boss | **GitHub Actions**（public repo で無制限。`workflow_dispatch` がキュー代わり） |
| オブジェクトストレージ | S3 | **Cloudflare R2**（10GB 無料・egress 無料） |
| DB | Neon | Neon または D1。**Phase 2 で決定**（OD-8、今は不要） |
| AI 判定 | advisory | **有料診断のみで実行**。無料診断は決定論的検出のみ。API 費用は課金時のみ発生 |
| 固定費 | — | 独自ドメイン（年 ¥2,000 程度）のみ推奨 |

```text
┌───────────────────────┐
│  apps/web (Next.js)   │  Cloudflare Pages。Phase 1 は静的書き出し (output: 'export')
└───────────┬───────────┘
            │ workflow_dispatch (API 経由)
┌───────────┴───────────┐
│ GitHub Actions        │  診断ワーカー。public repo で実行時間無制限
│  + Playwright/Chromium│  キューはワークフローディスパッチが代替（AD-11 の「常駐が要る」を解消）
└───────────┬───────────┘
            ├─→ Neon / D1        (run / finding / score。Phase 2 で確定)
            └─→ Cloudflare R2    (evidence / screenshot)
```

- Phase 1 では **web のみ**。DB も診断ワーカーも存在しない（AD-12 は維持）
- 実広告ポリシー（DECISIONS_v0.2.md §8.1、SAFE-13）: ゲーム/LP ルートは実広告禁止。記事/ランキング/図鑑/レポートのみ実広告可

---

# 17. Phase → Component Map

| Phase | 内容 | 必要になるもの | 新規インフラ |
|---|---|---|---|
| 1 | Game MVP | pattern-catalog, game-engine, ui, apps/web(game) | なし |
| 1.5 | LP | ui, apps/web(lp) | なし |
| 2 | Pattern Evaluation Engine | evaluator-core, hell-generator, evaluator-worker | Postgres, Storage |
| 3 | Public Audit | apps/web(audit) | キュー |
| 4 | Ranking | apps/web(ranking) | ISR / キャッシュ |
| 5 | Owner Product | 認証, 課金, monitoring | Auth, 決済, スケジューラ |

Phase 1 と 2 の間に**インフラの断層がある**。ここを跨ぐ前に「ゲームが面白いか」の検証を終わらせる（GAME §23, PRODUCT §25）。

---

# 18. Risks

| リスク | 影響 | 対策 |
|---|---|---|
| ゲームが単に不快なだけで面白くない | Phase 1 で計画が止まる | TASK-024 までで一度プレイテスト。Second-run rate を測る（PRODUCT §27） |
| 「本気でふざける」品質に届かず、安っぽいネタサイトになる | ブランド毀損 | DESIGN.md 準拠を lint + visual regression で機械化。§10.2 |
| 自分自身がダークパターンになる | 信用の即死 | §11 Safety Invariants を MVP 前に実装 |
| Vision 判定が不安定でスコアの説明がつかなくなる | 公開ランキングで炎上 | §9.3。Vision はスコアに入れず advisory 扱いから始める |
| 実サイト評価が robots/利用規約に抵触 | 法務 | Phase 3 前に PRODUCT §23 / §30 D5 を別途確定。アーキ上は「収集済み evidence を消せる構造」で備える |
| パターン数を増やすことが目的化する | GAME §23 の明示的な非目標 | ステージ生成器は登録済み simulator のみ採用するので、**数を増やしても品質が落ちない**のではなく、**実装した分しか出ない**。10-15 で止める判断を数値で下せる |

---

# 19. Rejected Alternatives

| 案 | 却下理由 |
|---|---|
| ゲームを Canvas / WebGL / Phaser で実装 | §7.4。DOM でないと広告UXのパロディにならず、a11y も満たせない |
| LP とゲームで同一エンジンを共有 | §8.1。エンジンに LP 専用モードが混入する |
| Playwright の中で直接スコアを計算 | §9.2。Evidence-First / Versioning / 異議申立ての全要件が壊れる |
| パターン定義を DB に置く | git で差分レビューできなくなる。カタログは「公開される仕様」なのでコードと同じライフサイクルに置く |
| 最初から Nx / Bazel | 過剰。pnpm + turborepo で足りる |
| 最初から Redis / SQS | 運用対象が増える。pg-boss で十分 |
| Markdown カタログを廃止して JSON 一本化 | PRODUCT §23「評価基準の公開」で人間可読な仕様が要る。両方持って CI で整合させる |

---

# 20. Open Decisions — レビューしてほしい点

> **ここだけ読めばレビューできる。** 各項目は推奨案つき。異論がなければ推奨案で進める。
> DECISIONS_v0.2.md（オーナーレビュー済み）により、OD-7 / OD-8 を除き全て決着済み。

### OD-1. スタイリング方式 ★最重要
- A. **Tailwind v4 を tokens.css にバインド + 任意値禁止 lint**（推奨）
- B. CSS Modules + トークンのみ、Tailwind を使わない
- C. CSS-in-JS
- 論点: `DESIGN.md` は「generic Tailwind aesthetics を使うな」と言っているが、これは見た目の話であってツールの話ではない。A なら速度を保ちつつ lint で規律を強制できる。B の方が契約は固いが実装速度は落ちる。
- **決定: A で確定。**

### OD-2. Web フレームワーク
- A. **Next.js 15 App Router 単一アプリ**（推奨）
- B. LP/Game は Vite + 静的、Audit だけ別アプリ
- 論点: Phase 1 にサーバは不要だが、Phase 3-4 で SSR/ISR が要る。最初から Next.js にしておく方が移行コストが低い。反面 Phase 1 には過剰。
- **決定: A で確定。ただし Phase 1 は `output: 'export'` の静的書き出しとし、ホスティングは Vercel ではなく Cloudflare Pages（DECISIONS_v0.2.md §8, TASK-001）。**

### OD-3. ゲーム描画: DOM（ADR-003）
- **DOM（推奨・ほぼ確定扱い）**。異論があればここで。
- **決定: DOM で確定。異論なし。**

### OD-4. monorepo 採用
- A. **pnpm workspaces + Turborepo**（推奨）
- B. 単一 Next.js アプリ内のディレクトリ分割で始める
- 論点: B の方が初速は速い。ただし AD-1/AD-3（依存方向の強制、エンジンの純粋性）が守られる保証が弱くなる。このプロジェクトは「境界を守ること」自体が要件なので A を推す。
- **決定: A で確定。**

### OD-5. ゲームの目的（GAME §30 Q3）
- 推奨: **D ハイブリッド** = 「記事を最後まで読む（Progress）」＋「記事内の設問に1つ答える（誤クリック耐性の検証）」
- 論点: 「読む」だけだと待つゲームになりがち。設問があると Deception 系パターンが機能する。
- **決定: D ハイブリッドで確定。**

### OD-6. 入力モデル（GAME §30 Q1）
- 推奨: **C ハイブリッド** = 通常はポインタで直接操作、`SMASH` 等の対抗アクションは画面下の固定アクションバー（thumb-zone）から
- 論点: モバイル片手操作 (DESIGN_REQ §13) と両立させるならアクションバーが要る。
- **決定: C ハイブリッドで確定。**

### OD-7. Evaluator のホスティング
- 推奨: **常駐コンテナ (Fly.io) + pg-boss**
- 代替: Browserless / Browserbase 等のマネージド Chromium
- 論点: MVP 段階では実行回数が少ないのでマネージドの方が安い可能性がある。コストを見てから決めても手遅れにならない（Probe は evaluator-core から分離されているので差し替え可能）。**Phase 2 開始時に再決定でよい。**
- **未決のまま。** 診断の「実行環境」自体は GitHub Actions に決定した（DECISIONS_v0.2.md §8、D10）が、Postgres/Fly.io 前提だった常駐ワーカーの要否は Phase 2 で再検討する。

### OD-8. DB / ORM
- 推奨: **Postgres (Neon) + Drizzle**
- Phase 2 まで不要なので、**いま確定しなくてよい**。
- **未決のまま。Phase 2 で決定（Neon または Cloudflare D1、DECISIONS_v0.2.md §8）。**

### OD-9. 言語
- 推奨: **MVP は日本語のみ。i18n フレームワークを入れない。** ただしコピーはコンポーネントに直書きせずデータファイルに置く
- 論点: 英語展開の予定があるなら最初から入れた方が安い。予定を教えてほしい。
- **決定: 推奨どおり日本語のみで確定。**

### OD-10. 解析・計測
- 推奨: **Cookie を使わない解析のみ**（自前イベント or Plausible 相当）。PRODUCT §20「不要なユーザー追跡データは収集しない」との整合
- 論点: ただし PRODUCT §27 の Success Metrics（Second-run rate, Retry rate）を測るには何らかの計測が要る。どこまで許容するか。
- **決定: 推奨どおり Cookie を使わない解析で確定。**

### OD-11. Severity 値の初期実装
- 推奨: **カタログの仮説値をそのまま使い、`scoringVersion: 0.1` として明示する**
- 論点: 「仮説値である」ことを UI に出すかどうか。出す方が誠実だがスコアの権威は下がる。
- **決定: 推奨どおり確定。仮説値であることは UI にも明示する。**

### OD-12. LP とゲームの関係
- 推奨: **LP はゲームエンジンを使わない**（§8.1）
- 論点: 「LP の最後のカオスをゲームエンジンで作れば豪華になる」という誘惑がある。却下したい。
- **決定: 推奨どおり確定。LP は BrowserFrame も使わない（§8.2 追記）。**

---

# 21. Definition of Architecture Done

- [ ] §20 の Open Decisions がすべて決着している
- [ ] `docs/design/PATTERN_SCHEMA.md` のスキーマが、カタログの全 90 パターンを表現できることを机上検証済み
- [ ] `docs/design/GAME_ENGINE_DESIGN.md` の `step()` 契約で MVP 15 パターンが実装可能であることを検証済み
- [ ] `docs/design/EVALUATOR_DESIGN.md` の Evidence スキーマが CATALOG §5 Layer 1 の全項目を保持できる
- [ ] ADR が記録されている
- [ ] `docs/tasks/` の TASK-001..003 がこの設計と矛盾しない

---

# 22. v0.2 変更履歴

`docs/design/DECISIONS_v0.2.md`（オーナーレビュー済み）を反映した変更点。詳細な決定理由は同文書を参照。

| 節 | 変更 | 根拠 |
|---|---|---|
| §5 | `packages/ui/shells/`、`apps/web/src/game/frame/` を追加 | v0.2 §1.3, §2 |
| §6 | `GameFacet` 概要を Shell × Behavior × Creative モデルに差し替え。`escape?: EscapeFacet` を追加 | v0.2 §1, §6 |
| §7.3 | `PatternSimulator` / `SimulatorRegistry` を撤回し、Shell × Behavior の2軸モデル（`ShellRegistry` + `BehaviorRegistry`）に差し替え | v0.2 §1 |
| §8.2 | BrowserFrame との関係を追記（LP は使わない） | v0.2 §2, §8.1 |
| §11 | SAFE-12（BrowserFrame の実ブラウザ模倣禁止）・SAFE-13（ゲーム/LP ルートの実広告禁止）を追加 | v0.2 §2.4, §8.2 |
| §16 | Vercel / Fly.io+pg-boss / S3 構成を撤回し、Cloudflare Pages / GitHub Actions / R2 構成に差し替え | v0.2 §8 |
| §20 | OD-1〜6, 9〜12 を決着。OD-7/8 は Phase 2 決定のまま維持 | v0.2 全体（オーナーレビューにより open decisions も解消） |

ADR: ADR-008（改訂）、ADR-009〜012（新規）は `docs/design/adr/` 参照。
