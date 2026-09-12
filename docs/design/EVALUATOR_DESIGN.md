# EVALUATOR_DESIGN.md

## 0. Status

- Status: Draft v0.1 — REVIEW REQUESTED（Phase 2 以降。Phase 1 では実装しない）
- Parent: `docs/design/ARCHITECTURE.md` §9
- Owner packages: `packages/evaluator-core`, `apps/evaluator-worker`
- Upstream: `PRODUCT_REQUIREMENTS.md` §6-§14, `AD_UX_PATTERN_CATALOG.md` §3, §5

> **契約: Score は EvidenceBundle の純粋関数である。**
> Playwright の中でスコアを計算してはならない。

---

# 1. なぜ観測と判定を分けるのか

この分離ひとつで、要件の5つが同時に満たされる。分けないと5つとも失敗する。

| 要件 | 分離していれば | 分離していないと |
|---|---|---|
| PRODUCT §8 Evidence-First | Finding が evidence を参照する構造になる | 「AIがそう言った」で終わる |
| PRODUCT §21 Evaluation Versioning | 保存済み evidence に新旧スコアを両方当てられる | 再クロールしないと比較できない |
| CATALOG §10 Calibration | severity 変更 → 全履歴を再計算 | 全サイトを再クロール |
| PRODUCT §14 異議申立て | 同一 evidence で再判定を示せる | 「もう一回測ったら違う値でした」 |
| PRODUCT §11 Before/After | 同一条件での差分が保証される | 条件の揺れと改善効果が混ざる |

---

# 2. Pipeline

```text
┌──────────────┐
│  AuditRequest│  url, viewportProfile, scenarioId
└──────┬───────┘
       ↓
┌──────────────────────────────────────────┐
│ PROBE  (apps/evaluator-worker)            │  Playwright
│  ・シナリオを実行する                       │
│  ・観測する                                │
│  ・判定は一切しない                         │
└──────┬───────────────────────────────────┘
       ↓
┌──────────────────────────────────────────┐
│ EvidenceBundle                            │  不変 / バージョン付き / 永続化
│  structured.json.gz  +  media/*           │
└──────┬───────────────────────────────────┘
       ↓
┌──────────────────────────────────────────┐
│ DETECTORS  (packages/evaluator-core)      │  純粋関数
│  Layer2 決定論的  →  Finding[]             │
│  Layer3 Vision   →  Finding[] (advisory)  │
└──────┬───────────────────────────────────┘
       ↓
┌──────────────────────────────────────────┐
│ SCORER  (packages/evaluator-core)         │  純粋関数 / scoringVersion 指定可
└──────┬───────────────────────────────────┘
       ↓
┌──────────────────────────────────────────┐
│ REPORT                                    │  Score + 根拠 + 改善提案
└──────────────────────────────────────────┘
```

---

# 3. Scenario（測定条件の固定）

PRODUCT §22 は「指定条件下での自動評価」と明示することを要求している。
したがって**シナリオは暗黙の実装詳細ではなく、バージョン付きの公開仕様**にする。

```ts
type Scenario = {
  id: ScenarioId
  version: string
  viewport: { width: number; height: number; dpr: number; isMobile: boolean }
  userAgent: string
  network: 'default' | 'slow-4g'
  steps: ScenarioStep[]
  totalBudgetMs: number
}

type ScenarioStep =
  | { t: 'navigate'; url: string }
  | { t: 'wait'; ms: number }
  | { t: 'scroll'; toPercent: number; overMs: number }
  | { t: 'dwell'; ms: number }                     // 読んでいる状態を模す
  | { t: 'clickFirstInternalLink' }                // INT-04 Click-Triggered Interstitial 用
  | { t: 'attemptBack' }                           // INT-06 Back-Intercept 用
  | { t: 'attemptCloseAllOverlays' }               // CLS-* 群の計測用
  | { t: 'snapshot'; label: string }
```

MVP のシナリオ (`article-read-v1`):

```text
navigate → wait 3s → snapshot("initial")
→ scroll 25% over 2s → dwell 3s → snapshot
→ scroll 50% over 2s → dwell 3s → snapshot
→ attemptCloseAllOverlays → snapshot("after-close")
→ scroll 100% over 3s → dwell 3s → snapshot("end")
→ attemptBack → snapshot("back")
```

`mobile-390x844` と `desktop-1440x900` の2プロファイルで実行（PRODUCT §9.1）。

## 3.1 attemptCloseAllOverlays の設計

「閉じる」を機械的に試みる部分が、`CLS-*`（Close Friction）群の測定の核心になる。

- 検出したオーバーレイごとに「閉じるに見える要素」を候補列挙（サイズ・記号・aria-label・位置）
- **候補を押した結果を記録する** — 閉じたか / 何も起きないか / **遷移が発生したか（＝ Fake Close の証拠）**
- 外部遷移が発生したら即座に戻り、`CLS-11 Fake Close` の evidence として記録する
- 押下から消滅までの時間を計測（`CLS-03 Delayed Close` / `TIME-01 Countdown`）

これは observation であって判定ではない。判定は detector が evidence を見て行う。

## 3.2 遵守事項

- `robots.txt` を尊重する
- レート制限（同一ドメインへの同時実行を1に制限、クールダウン）
- 明示的な User-Agent（誰が何のために来たか分かるようにする）
- ログイン不要な公開ページのみ
- 収集した evidence は削除要求に応じて消せる構造にする（PRODUCT §30 D5）

---

# 4. EvidenceBundle

```ts
type EvidenceBundle = {
  meta: {
    runId: string
    url: string; finalUrl: string; domain: string
    startedAt: string; finishedAt: string
    scenario: { id: ScenarioId; version: string }
    probeVersion: string
    browser: { name: string; version: string }
  }

  timeline: TimelineEvent[]        // 全事象の時系列。これが evidence の背骨

  snapshots: {
    label: string
    atMs: number
    viewport: Rect
    scrollY: number
    elements: ElementRecord[]      // 広告候補を含む要素の幾何・スタイル
    occlusion: OcclusionMap        // どのピクセルが何に覆われているか（粗い格子）
    screenshotRef?: MediaRef
  }[]

  media: {
    autoplayAttempts: MediaEvent[]
    audioContextEvents: MediaEvent[]
  }

  perf: { cls: number; lcpMs: number; longTasks: {atMs:number; durMs:number}[] }

  network: { requests: RequestRecord[] }   // 広告系ドメインの識別に使う

  interactions: {
    closeAttempts: CloseAttemptRecord[]
    hitboxMismatches: HitboxRecord[]
    navigationsTriggered: NavRecord[]
  }

  a11y?: { treeRef: MediaRef }
}

type ElementRecord = {
  path: string                 // 安定した要素パス
  rect: Rect
  position: 'static'|'relative'|'absolute'|'fixed'|'sticky'
  zIndex: number
  isThirdPartyFrame: boolean
  frameOrigin?: string
  adLabelText?: string         // "PR", "広告", "Sponsored" 等の検出結果
  areaRatioOfViewport: number
}
```

## 4.1 構造化データとメディアの分離

`structured.json.gz`（数百KB）と `media/*`（数MB〜）を分ける。

**再スコアに必要なのは structured のみ。** メディアはライフサイクルポリシーで削除してよい。
これで長期のスコア再計算可能性とストレージコストを両立する（ARCHITECTURE §12.3）。

---

# 5. Detector

```ts
interface Detector {
  readonly id: DetectorId
  readonly version: string
  readonly requires: SignalRef[]
  readonly patterns: PatternId[]        // この検出器が判定できるパターン
  run(ev: EvidenceBundle, ctx: DetectContext): Finding[]
}

type Finding = {
  patternId: PatternId
  detectorId: DetectorId
  detectorVersion: string
  confidence: 'deterministic' | 'heuristic' | 'vision'
  scoreContributing: boolean

  /** 何を測ったのか。レポートにそのまま出る */
  measured: Record<string, number | string | boolean>

  /** どの evidence から言えるのか。PRODUCT §8 の中核 */
  evidence: EvidenceRef[]

  occurrences: number                   // Frequency Multiplier の入力
  viewportImpact?: number               // 0-1
  device: 'mobile' | 'desktop'

  /** 人間向けの一文。テンプレートから生成 */
  explanation: { ja: string }
}
```

## 5.1 MVP 検出器（Phase 2: 10-15 パターン / PRODUCT §25）

| Detector | パターン | 主要シグナル | 判定方法 |
|---|---|---|---|
| `viewport-occupancy` | OBS-01, OBS-03, OBS-04, MOB-01 | snapshots.occlusion | 固定要素のviewport占有率 |
| `sticky-persistence` | OBS-03, OBS-06, OBS-07 | elements.position, timeline | fixed/sticky が N 秒以上継続 |
| `popup-timing` | INT-01, INT-02, INT-03 | timeline.popupEvents | オーバーレイ出現の時刻とトリガ |
| `close-delay` | CLS-03, TIME-01 | interactions.closeAttempts | 出現から閉じられるまでの実測秒 |
| `close-geometry` | CLS-01, CLS-06, CLS-09, CLS-13 | elements.rect | ×のサイズ・位置・viewport外判定 |
| `fake-close` | CLS-11, CLS-12 | interactions.navigationsTriggered | 閉じる候補押下で遷移が発生 |
| `layout-stability` | LAY-01, LAY-03 | perf.cls, snapshots | CLS 値と要素移動量 |
| `autoplay-media` | ATT-01, ATT-02 | media.autoplayAttempts | 操作なしの play()/audio |
| `ad-density` | OBS-09, OBS-10 | elements, occlusion | 広告面積 / コンテンツ面積 |
| `recurrence` | PER-01, PER-04 | timeline | 閉じた後の再出現 |
| `compound` | COM-* | 他 Finding | 構成要素が揃ったら合成 Finding を立てる |

`compound` detector だけは他の Finding を入力に取る（二段階）。

## 5.2 「広告である」の判定

これが実は一番難しい。MVP の方針:

1. **強いシグナル**: 第三者 iframe + 既知の広告ドメイン（network.requests と突合）
2. **中程度**: `PR` / `広告` / `Sponsored` / `AD` のラベルテキストが近傍にある
3. **弱い**: 固定配置 + コンテンツ外 + 定型サイズ（300x250, 728x90 等）

**弱いシグナルだけで「広告」と断定しない。** 誤検出は公開ランキングで致命的（PRODUCT §23）。
断定できない場合は `confidence: 'heuristic'` にして、Basic Report ではスコアに入れない。

---

# 6. Scorer

```ts
interface Scorer {
  readonly version: string
  score(findings: Finding[], ctx: ScoreContext): ScoreBreakdown
}

type ScoreBreakdown = {
  scoringVersion: string
  raw: number
  normalized: number              // 0-100。高いほど悪い
  grade: 'A'|'B'|'C'|'D'|'E'|'F'
  components: {
    patternContributions: { patternId: PatternId; base: number;
      frequencyMultiplier: number; viewportMultiplier: number; subtotal: number }[]
    interactionPenalty: { rule: string; points: number }[]
    compoundPenalty:    { comboId: string; points: number }[]
    timeCostPenalty:    { source: string; seconds: number; points: number }[]
  }
  excluded: { patternId: PatternId; reason: 'vision-advisory' | 'low-confidence' }[]
}
```

CATALOG §3 の式をそのまま実装する。

```text
raw = Σ(severity × frequencyMult × viewportMult)
    + interactionPenalty + compoundPenalty + timeCostPenalty
normalized = clamp(0, 100, f(raw))
```

## 6.1 正規化関数

`raw` は上限がないので 0-100 に写す必要がある。
**線形クリップは使わない**（80点と150点が同じ100になり、改善のインセンティブが消える）。

現案: `normalized = 100 × (1 - exp(-raw / K))`。K は実サイト分布から決める。
これなら常に改善が点数に反映される。**K の決定は Phase 2 の実測待ち。**

## 6.2 バージョン共存

```ts
const scorers: Record<string, Scorer> = {
  '0.1.0': scorerV010,
  '0.2.0': scorerV020,
}
```

- 過去の run は保存時の scoringVersion で計算した値を保持
- 新バージョンを出したら、既存 run に対してもバッチで再計算し **両方保存**する
- ランキングは常に単一 scoringVersion 内でのみ比較（ARCHITECTURE §13）

---

# 7. 検出精度の検証

`packages/hell-generator` が生成するフィクスチャで回帰テストする。

```text
FixtureSpec (パターン集合)
   ↓ build
fixtures/<name>/index.html  (実際に動くHTML/CSS/JS)
   ↓ probe (実ブラウザ)
EvidenceBundle
   ↓ detectors
actual Finding[]   vs   expected Finding[]  ← PatternDefinition.fixture.expected
   ↓
精度レポート: pattern別 precision / recall / 測定値の誤差
```

- **ネガティブケース必須**（PATTERN_SCHEMA §6）。「普通の Cookie バナー」「小さなサイドバー広告」で
  検出が立たないことを保証する
- 実サイトは回帰テストに使わない（向こうが勝手に変わる）。別途 **calibration set** として
  手動アノテーション済みのスナップショットを持つ

---

# 8. Report

## 8.1 Basic（無料 / PRODUCT §9.1）

```text
Ad UX Score: 82 / 100   (高いほど悪い)
Grade: E
Measured: 2026-XX-XX  mobile 390×844  scenario article-read-v1
Evaluation Version: catalog 0.1 / scenario 0.1 / detector 0.1 / scoring 0.1

Detected:
  ■ Fullscreen Overlay        viewport 94% を 5.2s 占有
  ■ Delayed Close             閉じるまで 4.2s
  ■ Sticky Video              viewport 18.4%、継続 42s
  ■ Layout Shift              CLS 0.31
  ■ Popup Recurrence          3回

※ このスコアは指定条件下での自動評価です。
```

## 8.2 Detailed（有料 / PRODUCT §9.2）

各 Finding について `ImproveFacet` から生成:

```text
Problem      Sticky video が mobile viewport の 22% を占有
Evidence     [screenshot] [測定値] [検出時刻]
Why          読み進める領域が常時 1/5 失われる。親指操作領域とも干渉する
Fix          占有率を10%未満に。または閉じた状態を記憶する
Alternative  動画広告を維持したまま、スクロール停止時のみ展開する形式に変更
Expected     -12 points
Re-audit     [再評価する]
```

`Alternative`（広告を維持したまま改善する案）を必ず出す。PRODUCT §31。

---

# 9. Job Pipeline

```text
POST /api/audit          → audit_run(status=queued) を作成 + pg-boss に投入
GET  /api/audit/:id      → status ポーリング
worker                   → probe → evidence保存 → detect → score → status=done
```

- 同一ドメインは同時1本、クールダウンあり
- タイムアウト（90s）でハード打ち切り、部分 evidence でもレポートを出す
- 失敗理由をユーザーに見せる（「robots.txt で拒否」「タイムアウト」「到達不能」）

---

# 10. Open Questions

1. **正規化関数の K**（§6.1）。実サイト 100件のスコア分布を見てから決める。
2. **Vision をいつスコアに入れるか**。MVP は advisory のみ。精度が確認できてから。
3. **「広告」判定の広告ドメインリスト**。EasyList 等の利用可否（ライセンス）を確認要。
4. **同一ドメイン内の複数ページ評価**。MVP は単一URL。サイト全体スコアは Phase 4 以降。
5. **公開ランキング掲載の同意モデル**。PRODUCT §30 D2（Curated + User-submitted）。法務確認要。
