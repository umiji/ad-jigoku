# PATTERN_SCHEMA.md

## 0. Status

- Status: Draft v0.1 — REVIEW REQUESTED
- Parent: `docs/design/ARCHITECTURE.md` §4, §6
- Owner package: `packages/pattern-catalog`

> **これは Shared Kernel のスキーマである。** Game / Evaluator / Hell Generator / Improvement の4つが
> すべてこの型に依存する。ここを変えると全部が動く。慎重に。

---

# 1. Layering

```text
AD_UX_PATTERN_CATALOG.md          人間の source of truth（公開仕様・議論の場）
        │  手動変換 + CI parity 検査
        ↓
data/patterns/*.json              機械の source of truth
        │  zod parse（ビルド時に1回）
        ↓
PatternDefinition[]               型付き・検証済み
        │
        ├── game    facet → packages/game-engine
        ├── detect  facet → packages/evaluator-core
        ├── improve facet → レポート生成
        └── fixture facet → packages/hell-generator
```

**JSON を手で書き換えて Markdown を放置することを禁止する。** CI が落ちる。

---

# 2. Core Types

```ts
/** "CLS-11" | "INT-03" | "COM-07" ... カタログと 1:1 */
type PatternId = `${PatternCategoryCode}-${string}`

type PatternCategoryCode =
  | 'CLS'   // A. Close / Dismiss Friction
  | 'INT'   // B. Unexpected Interruption
  | 'OBS'   // C. Screen Obstruction
  | 'ACC'   // D. Interaction / Accidental Click
  | 'DEC'   // E. Deceptive / Camouflaged
  | 'ATT'   // F. Motion / Audio / Attention Hijacking
  | 'TIME'  // G. Timing / Waiting
  | 'PER'   // H. Persistence / Recurrence
  | 'LAY'   // I. Layout / Visual Stability
  | 'MOB'   // J. Mobile-specific
  | 'COM'   // K. Compound / Combo

/** CATALOG §1.2 の9次元 */
type UxDimension =
  | 'interruption' | 'obstruction' | 'interactionFriction'
  | 'deception' | 'attentionHijacking' | 'persistence'
  | 'timeCost' | 'mobileImpact' | 'cumulativeEffect'

type PatternDefinition = {
  id: PatternId
  category: PatternCategoryCode
  name: { ja: string; en: string }
  definition: { ja: string; en?: string }

  /** CATALOG §1.1。0-20。仮説値であることを severitySource で明示する */
  severity: number
  severitySource: 'hypothesis' | 'calibrated'

  /** CATALOG §1.3。UX Severity とは独立軸 */
  gameDifficulty: 1 | 2 | 3 | 4 | 5

  /** どの次元に効くパターンか。スコア内訳の説明に使う */
  dimensions: Partial<Record<UxDimension, 0|1|2|3>>

  /** COM-* のみ。構成要素 */
  composedOf?: PatternId[]

  /** デバイス別の Severity 差分 (CATALOG §10 Q3) */
  deviceModifier?: { mobile?: number; desktop?: number }

  game?: GameFacet
  detect?: DetectFacet
  improve?: ImproveFacet
  fixture?: FixtureFacet

  /** 参考リンク（Better Ads Standards 等）。公開レポートで根拠として表示 */
  references?: { label: string; url: string }[]
}
```

## 2.1 facet が任意である理由

すべてのパターンが3用途すべてに使われるわけではない。

| 例 | game | detect | improve | fixture |
|---|---|---|---|---|
| `CLS-11 Fake Close` | ○ | ○ | ○ | ○ |
| `OBS-05 Sticky Side Rail` | ✗（つまらない） | ○ | ○ | ○ |
| `MOB-05 Keyboard/Viewport Conflict` | ✗（入力欄が要る） | ○ | ○ | ○ |
| `COM-12 Infinite Hell` | ○ | △（合成判定） | ○ | ○ |

**CI ルール:** `game` facet がないパターンはステージ生成器の候補に入らない。
`detect` facet がないパターンは監査レポートに出ない。黙って無視されるのではなく、
カバレッジレポート（`pnpm catalog:coverage`）に未実装として出る。

---

# 3. GameFacet

GAME_REQUIREMENTS §14 の表を型にしたもの。

```ts
type GameFacet = {
  /** 描画・挙動の大分類。Simulator の実装単位でもある */
  mechanic:
    | 'overlay'          // 画面を覆う
    | 'sticky'           // 追従する
    | 'close-friction'   // 閉じにくい
    | 'deception'        // 偽装する
    | 'attention'        // 注意を奪う
    | 'instability'      // レイアウトを揺らす
    | 'persistence'      // 再出現する
    | 'density'          // 量で殴る

  /** 正解となる操作。複数ある場合はどれでも可 */
  playerActions: PlayerAction[]

  /** 「何もしない」が正解のパターンもある (e.g. DEC-02 Fake Download は押さないのが正解) */
  correctInaction?: boolean

  failureCondition: FailureCondition

  /** 予告の有無。GAME §15.4 難易度は観測可能でなければならない */
  warning: 'none' | 'subtle' | 'explicit'

  timing: {
    spawnAfterMs?: Range     // 出現タイミング
    durationMs?: Range       // 自然消滅まで（なければ永続）
    closableAfterMs?: Range  // 閉じられるようになるまで
    respawnAfterMs?: Range
  }

  /** CATALOG §4 の3軸。Game Difficulty の導出に使う */
  interactionComplexity: 1|2|3|4|5
  uncertainty: 1|2|3|4|5
  timePressure: 1|2|3|4|5

  comboTags: ComboTag[]
  incompatibleWith: PatternId[]

  scoreEffect:    { onClear: number; onMistake: number; perSecondAlive?: number }
  patienceEffect: { onSpawn: number; onMistake: number; perSecondAlive?: number }

  /** SimulatorRegistry のキー。複数パターンが同じ simulator を共有してよい */
  simulatorId: SimulatorId

  /** 結果画面の教育表示 (GAME §20) */
  education: { ja: string }

  /** 最低でもこの時間後には必ず閉じられる（SAFE-01）。省略時はグローバル既定値 */
  maxCloseDelayMsOverride?: number
}

type PlayerAction = 'CLOSE' | 'SMASH' | 'DODGE' | 'FOCUS' | 'REPORT' | 'ESCAPE' | 'IGNORE'

type FailureCondition =
  | { kind: 'patience-zero' }
  | { kind: 'wrong-target' }          // 偽×を押した等
  | { kind: 'timeout'; ms: number }
  | { kind: 'progress-blocked'; ms: number }

type Range = { min: number; max: number }   // RNG がこの範囲からシードで抽選
```

## 3.1 Range と決定論

`Range` はステージ生成時に `rng('timing')` で1回だけ確定し、`StageInstance` に焼き込む。
実行中に再抽選しない。これがないとリプレイが壊れる（ARCHITECTURE §7.2）。

---

# 4. DetectFacet

```ts
type DetectFacet = {
  /** CATALOG §5 のどの層で判定するか */
  layer: 1 | 2 | 3

  /** この検出器が必要とする Evidence の種類。Probe がこれを見て収集項目を決める */
  signals: SignalRef[]

  detectorId: DetectorId

  confidence: 'deterministic' | 'heuristic' | 'vision'

  /** スコアに算入するか。vision は MVP では false（ARCHITECTURE §9.3） */
  scoreContributing: boolean

  /** 検出の閾値。scoringVersion とは別に detectorVersion で管理 */
  thresholds?: Record<string, number>
}

type SignalRef =
  | 'dom.snapshot' | 'dom.boundingBoxes' | 'dom.computedStyles' | 'dom.zIndex'
  | 'viewport.size' | 'viewport.occlusion'
  | 'timeline.popupEvents' | 'timeline.closeDelay' | 'timeline.navigation'
  | 'media.autoplay' | 'media.audio'
  | 'perf.cls' | 'perf.lcp' | 'perf.longTasks'
  | 'network.requests'
  | 'a11y.tree'
  | 'screenshot.viewport' | 'screenshot.fullPage'
  | 'interaction.clickOutcome' | 'interaction.hitboxMap'
  | 'scroll.positionTimeline'
```

## 4.1 signals が果たす役割

Probe は「全部収集する」のではなく、**有効な detector の signals の和集合**を収集する。

- 収集コストを抑えられる
- 「この検出には何が必要か」が宣言的になり、Evidence の必須項目が型で決まる
- detector を追加したときに Probe の改修が必要かどうかが自動判定できる

---

# 5. ImproveFacet

PRODUCT §10 の `Problem → Evidence → Why → Recommended change → Expected impact → Re-audit` を型にする。

```ts
type ImproveFacet = {
  whyItHurts: { ja: string }
  recommendations: {
    ja: string
    effort: 'low' | 'medium' | 'high'
    /** この修正で消えると期待される severity 分。Before/After の予測に使う */
    expectedSeverityReduction: number
  }[]
  /** 「広告を消せ」ではなく「こうすれば広告を出しつつ改善できる」を必ず1つ以上持つ */
  adFriendlyAlternative: { ja: string }
}
```

`adFriendlyAlternative` を **必須** にしているのは PRODUCT §31（`Ads = Bad` ではない）を型で強制するため。
「広告を消してください」しか言えないパターン定義は書けない。

---

# 6. FixtureFacet

```ts
type FixtureFacet = {
  /** このパターンを再現する最小の HTML/CSS/JS を生成する関数のID */
  builderId: FixtureBuilderId
  /** 生成されたフィクスチャに対して detector が返すべき結果 */
  expected: {
    detected: true
    measuredValues?: Record<string, { min?: number; max?: number }>
  }
  /** 「検出されてはいけない」ネガティブケース。誤検出の回帰テスト用 */
  negativeCases?: FixtureBuilderId[]
}
```

`negativeCases` が重要。例えば `OBS-03 Large Sticky Bottom` の検出器が、
「小さくて閉じられる Cookie バナー」を誤検出しないことを保証する。
誤検出は公開ランキングでは検出漏れより致命的（PRODUCT §23）。

---

# 7. Derived Values

以下は JSON に持たず、**計算で導出する**。二重管理を避けるため。

```ts
/** CATALOG §4 */
computeGameDifficulty(p) =
  normalize(p.severity) × p.game.interactionComplexity
                        × p.game.uncertainty
                        × p.game.timePressure

/** CATALOG §2 の gameDifficulty 列との乖離を CI で検査（±1 まで許容） */
```

カタログの `Game Difficulty` 列は人間の直感値。計算値と大きくずれたら、
**どちらかが間違っている**ので CI で警告する（エラーにはしない）。

---

# 8. Validation Rules (CI)

| ID | ルール | 重大度 |
|---|---|---|
| V-01 | Markdown の ID 集合と JSON の ID 集合が一致 | error |
| V-02 | Markdown の severity / gameDifficulty と JSON が一致 | error |
| V-03 | `composedOf` の参照先が存在する | error |
| V-04 | `incompatibleWith` が対称（A→B なら B→A） | error |
| V-05 | `simulatorId` に対応する実装が registry にある | error |
| V-06 | `detectorId` に対応する実装がある | error |
| V-07 | registry にあるが、どのパターンからも参照されない simulator/detector がない | error |
| V-08 | `game.maxCloseDelayMs` がグローバル上限以下（SAFE-01） | error |
| V-09 | `improve.adFriendlyAlternative` が空でない | error |
| V-10 | 導出 gameDifficulty とカタログ値の乖離が ±1 以内 | warn |
| V-11 | `detect.signals` が Probe の収集可能項目に含まれる | error |
| V-12 | `severitySource: 'hypothesis'` のパターンが公開レポートで仮説である旨を表示できる | info |

---

# 9. Versioning

`packages/pattern-catalog/version.json`:

```json
{
  "catalogVersion": "0.1.0",
  "patternCount": 90,
  "calibratedCount": 0,
  "changelog": "docs/requirements/AD_UX_PATTERN_CATALOG.md の v0.1 に対応"
}
```

- severity を変えたら **minor** を上げる（スコアが変わるため）
- パターンを追加したら **minor**
- 文言修正のみなら **patch**
- ID の削除・改名は **major**（過去の監査結果の互換性が切れる）

---

# 10. Open Questions

1. `COM-*` (Compound) を独立パターンとして持つか、`composedOf` の組み合わせから動的に導出するか。
   **現案: 両方。** JSON には定義を持つが、Evaluator は `composedOf` の全構成要素が検出されたときに自動で COM を立てる。
2. `deviceModifier` の初期値をどう決めるか（CATALOG §10 Q3 未解決）。**現案: MVP では空。mobile/desktop で別 run を取り、比較表示するだけに留める。**
3. Vision detector の `thresholds` をデータで持つか、プロンプトで持つか。**現案: プロンプトも `detectorVersion` で管理する対象に含める。**
