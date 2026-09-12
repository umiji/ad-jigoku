# AD_UX_PATTERN_CATALOG.md

> **Purpose**
>
> 「広告地獄」プロジェクトにおける、悪質・不快・混乱を招く広告UXパターンの共通カタログ。
>
> このCatalogは将来的に以下の3用途で共通利用する。
>
> 1. **Game** — 広告地獄ゲームの敵・ギミック・ステージ難易度
> 2. **Audit** — 実WebサイトのAd UX Score算出
> 3. **Improvement** — サイト運営者への改善提案・Before/After評価
>
> ---
>
> **重要:** この文書のSeverity Scoreは初期仮説値。最終的な評価基準では、ユーザー調査・実サイト観測・離脱/操作データ等によってCalibrationする。

---

## 1. Scoring Model

### 1.1 Pattern Severity Score

各パターンが単独でユーザー体験をどの程度悪化させるかを `0–20` で評価する。

| Score | Severity | 意味 |
|---:|---|---|
| 0–3 | Trivial | ほぼ影響なし |
| 4–6 | Low | 軽度のストレス |
| 7–9 | Moderate | 明確なUX阻害 |
| 10–12 | High | 強いUX阻害 |
| 13–16 | Severe | 深刻なUX破壊 |
| 17–20 | Critical | コンテンツ利用そのものを妨害 |

### 1.2 Scoreの意味

Severityは「広告が存在すること」ではなく、以下の影響を総合的に評価する。

- **Interruption** — コンテンツ閲覧を中断するか
- **Obstruction** — コンテンツを覆うか
- **Interaction Friction** — 操作を難しくするか
- **Deception** — ユーザーを誤操作させる可能性
- **Attention Hijacking** — 注意を強制的に奪うか
- **Persistence** — 閉じても再発するか
- **Time Cost** — 待ち時間を発生させるか
- **Mobile Impact** — 小さい画面で影響が増幅するか
- **Cumulative Effect** — 他パターンとの組み合わせで悪化するか

### 1.3 Game Difficultyは別軸

UX SeverityとGame Difficultyは同一ではない。

例えば、

- Auto-play Sound → UX Severityは高いが、ゲームでは簡単
- Moving Close → UX Severityも高く、ゲーム難易度も高い
- Layout Shift → UX Severityは高いが、ゲーム化する場合は別メカニクスが必要

そのため `Game Difficulty` を `1–5` で独立管理する。

| Score | Difficulty |
|---:|---|
| 1 | Easy |
| 2 | Normal |
| 3 | Hard |
| 4 | Very Hard |
| 5 | Extreme |

---

# 2. Pattern Catalog

## A. Close / Dismiss Friction

| ID | Pattern | 定義 | Severity | Game Difficulty | Detection候補 |
|---|---|---|---:|---:|---|
| CLS-01 | Tiny Close | 閉じるボタンが極端に小さい | 5 | 2 | DOMサイズ/視覚検出 |
| CLS-02 | Low-Contrast Close | 背景と×のコントラストが低い | 6 | 2 | Screenshot/Vision |
| CLS-03 | Delayed Close | 一定時間経過まで閉じるUIが出ない | 8 | 2 | Event/Timer |
| CLS-04 | Video-Gated Close | 動画再生中は閉じられない/制限される | 10 | 3 | Video state/Event |
| CLS-05 | Moving Close | 閉じるボタンが移動する | 14 | 4 | Pointer/DOM tracking |
| CLS-06 | Edge-Hugging Close | 画面端ぎりぎりに配置される | 7 | 3 | Geometry |
| CLS-07 | Overlapping Close | ×が別UI/広告要素と重なる | 9 | 3 | Geometry |
| CLS-08 | Ambiguous Close | 閉じるアイコンが×として認識しにくい | 8 | 2 | Vision |
| CLS-09 | Close Outside Viewport | 閉じる操作が初期viewport外にある | 12 | 4 | Geometry/Scroll |
| CLS-10 | Multiple Close Targets | 複数の×候補があり本物が分かりにくい | 12 | 4 | Vision/DOM |
| CLS-11 | Fake Close | 閉じるように見える要素が広告クリック等を発生させる | 18 | 5 | Click outcome |
| CLS-12 | Misleading Close Label | 「閉じる」と思わせる文言/UIが別操作を行う | 17 | 5 | DOM/Event |
| CLS-13 | Close Requires Precision | 極端に狭いクリック領域で正確な操作が必要 | 10 | 4 | Hitbox geometry |
| CLS-14 | Close State Reset | 閉じた後、ページ遷移/更新等で再び同じ広告が出る | 11 | 4 | Session tracking |

---

## B. Unexpected Interruption

| ID | Pattern | 定義 | Severity | Game Difficulty | Detection候補 |
|---|---|---|---:|---:|---|
| INT-01 | Immediate Popup | ページ表示直後にポップアップ | 10 | 2 | Timing |
| INT-02 | Delayed Popup | 閲覧開始後、予期せずポップアップ | 9 | 2 | Timing |
| INT-03 | Scroll-Triggered Popup | スクロール中に突然広告表示 | 10 | 3 | Scroll/Event |
| INT-04 | Click-Triggered Interstitial | リンククリック等で全画面広告 | 10 | 3 | Navigation |
| INT-05 | Exit-Intent Ad | 離脱/戻る操作に反応して広告表示 | 10 | 3 | Pointer/History |
| INT-06 | Back-Intercept Ad | ブラウザBackに干渉する広告/オーバーレイ | 14 | 4 | History/Event |
| INT-07 | Prestitial | コンテンツ到達前に広告で遮る | 10 | 2 | Navigation timeline |
| INT-08 | Postitial | コンテンツ/操作後に広告で遮る | 9 | 3 | Navigation timeline |
| INT-09 | Repeated Interstitial | 複数ページ/複数操作で頻繁に全画面広告 | 14 | 4 | Session frequency |
| INT-10 | Frequency-Cap Failure | 同一セッションで過剰頻度に広告が出る | 13 | 4 | Session tracking |

---

## C. Screen Obstruction

| ID | Pattern | 定義 | Severity | Game Difficulty | Detection候補 |
|---|---|---|---:|---:|---|
| OBS-01 | Fullscreen Overlay | viewportの大部分/全体を広告が覆う | 12 | 2 | Pixel/DOM |
| OBS-02 | Scrollover | スクロール中に広告が本文上を覆う | 13 | 3 | Scroll/Intersection |
| OBS-03 | Large Sticky Bottom | 画面下部を固定広告が大きく占有 | 9 | 2 | Fixed geometry |
| OBS-04 | Large Sticky Top | 画面上部を固定広告が大きく占有 | 9 | 2 | Fixed geometry |
| OBS-05 | Sticky Side Rail | デスクトップ左右を広告が占有 | 6 | 1 | Fixed geometry |
| OBS-06 | Floating Video | 動画広告が画面上に浮遊し続ける | 11 | 3 | Fixed video |
| OBS-07 | Pop-out Video | 本文中の動画がスクロール後も追従する | 12 | 3 | Position tracking |
| OBS-08 | Content-Covering Ad | 本文の重要部分を直接覆う | 14 | 3 | DOM overlap |
| OBS-09 | Excessive Ad Density | コンテンツに対して広告量が過剰 | 12 | 2 | Area ratio |
| OBS-10 | Ad Wall | 広告が連続し、本文が断片化する | 14 | 3 | Ad/content ratio |

---

## D. Interaction / Accidental Click

| ID | Pattern | 定義 | Severity | Game Difficulty | Detection候補 |
|---|---|---|---:|---:|---|
| ACC-01 | Ad Near Navigation | ナビゲーションと広告が近接 | 10 | 3 | Geometry |
| ACC-02 | Ad Near CTA | CTAと広告が近接し誤操作を誘発 | 11 | 3 | Geometry |
| ACC-03 | Ad Near Game/UI | 操作UIと広告が近接 | 12 | 4 | Geometry |
| ACC-04 | Invisible Click Zone | 見た目以上に大きな広告クリック領域 | 15 | 4 | Hitbox |
| ACC-05 | Tap Hijack | 本文操作のつもりが広告操作になる | 16 | 5 | Click outcome |
| ACC-06 | Scroll Hijack | スクロール操作を広告/別UIが奪う | 13 | 4 | Pointer/Scroll |
| ACC-07 | Misaligned Click Target | 見た目とクリック領域が一致しない | 13 | 4 | Geometry |
| ACC-08 | Sticky Ad Touch Trap | スマホの固定広告が指操作と干渉 | 11 | 4 | Mobile geometry |

---

## E. Deceptive / Camouflaged Ads

| ID | Pattern | 定義 | Severity | Game Difficulty | Detection候補 |
|---|---|---|---:|---:|---|
| DEC-01 | Native Camouflage | 記事/コンテンツと広告の見た目が酷似 | 12 | 3 | Vision/DOM |
| DEC-02 | Fake Download | ダウンロードUIに見える広告 | 16 | 4 | Vision |
| DEC-03 | Fake Play | 再生ボタンに見える広告 | 15 | 4 | Vision |
| DEC-04 | Fake Next | 次へ/次の記事に見える広告 | 15 | 4 | Vision |
| DEC-05 | Fake Navigation | メニュー/ナビゲーションに見える広告 | 16 | 4 | Vision |
| DEC-06 | Misleading Heading | 広告をコンテンツ見出し等に見せる | 12 | 3 | DOM/Semantics |
| DEC-07 | Ad Label Obscured | 広告表示であることが分かりにくい | 11 | 3 | Vision |
| DEC-08 | Content-Ad Blend | 広告と本文の境界が極めて分かりにくい | 13 | 3 | Vision |

---

## F. Motion / Audio / Attention Hijacking

| ID | Pattern | 定義 | Severity | Game Difficulty | Detection候補 |
|---|---|---|---:|---:|---|
| ATT-01 | Auto-play Video | ユーザー操作なしに動画再生 | 8 | 2 | Media API |
| ATT-02 | Auto-play Sound | ユーザー操作なしに音声再生 | 13 | 3 | Media API |
| ATT-03 | Flashing Creative | 点滅/強い反復アニメーション | 11 | 3 | Video/CSS |
| ATT-04 | High-Motion Creative | 常時動き続け注意を強制的に奪う | 8 | 2 | Vision/Video |
| ATT-05 | Persistent Audio | 広告を閉じても音声が残る | 16 | 4 | Audio state |
| ATT-06 | Unexpected Video Expansion | 小さい広告が突然大型化 | 12 | 3 | Geometry tracking |
| ATT-07 | Attention-Grabbing Cursor/Pointer | ポインタ/視覚誘導を過剰利用 | 9 | 3 | Vision |

---

## G. Timing / Waiting

| ID | Pattern | 定義 | Severity | Game Difficulty | Detection候補 |
|---|---|---|---:|---:|---|
| TIME-01 | Countdown Before Close | 閉じるまでカウントダウン | 9 | 2 | Timer |
| TIME-02 | Countdown Before Content | コンテンツ閲覧前に待機を要求 | 12 | 2 | Navigation |
| TIME-03 | Unskippable Video | 一定時間スキップ不能 | 11 | 3 | Video API |
| TIME-04 | Delayed Content Reveal | 広告終了まで本文を表示しない | 12 | 3 | DOM timing |
| TIME-05 | Ad Loading Stall | 広告ロードがページ利用を遅延 | 9 | 2 | Performance |
| TIME-06 | Repeated Wait | 複数箇所で待機が発生 | 14 | 4 | Session timeline |

---

## H. Persistence / Recurrence

| ID | Pattern | 定義 | Severity | Game Difficulty | Detection候補 |
|---|---|---|---:|---:|---|
| PER-01 | Respawning Ad | 閉じた直後/一定時間後に再出現 | 13 | 4 | State tracking |
| PER-02 | Multi-layer Popup | 一つ閉じると次の広告が出る | 15 | 5 | State tracking |
| PER-03 | Repeated Sticky | 複数の固定広告が順番に出現 | 13 | 4 | Fixed element tracking |
| PER-04 | Cross-page Repetition | ページ遷移しても同じ広告UXが繰り返される | 11 | 4 | Session tracking |
| PER-05 | Session Escalation | 閲覧を続けるほど広告量/侵入度が増える | 15 | 5 | Session timeline |

---

## I. Layout / Visual Stability

| ID | Pattern | 定義 | Severity | Game Difficulty | Detection候補 |
|---|---|---|---:|---:|---|
| LAY-01 | Layout Shift | 広告ロード等でページレイアウトが移動 | 10 | 3 | CLS/Performance API |
| LAY-02 | Scroll Jump | 閲覧中にスクロール位置が意図せず変化 | 13 | 4 | Scroll position |
| LAY-03 | Content Pushdown | 広告挿入で本文が大きく押し下げられる | 8 | 2 | DOM geometry |
| LAY-04 | Ad Resize | 広告が表示中にサイズ変更 | 10 | 3 | ResizeObserver |
| LAY-05 | Floating Reposition | 広告位置が突然変化 | 11 | 4 | Geometry tracking |
| LAY-06 | Overlay Reflow | オーバーレイ解除後にページ位置が変わる | 9 | 3 | Scroll/DOM |

---

## J. Mobile-specific Hell

| ID | Pattern | 定義 | Severity | Game Difficulty | Detection候補 |
|---|---|---|---:|---:|---|
| MOB-01 | Viewport Dominance | 広告がモバイルviewportの大部分を占有 | 12 | 2 | Area ratio |
| MOB-02 | Thumb-zone Trap | 親指操作領域に広告/誤操作領域が集中 | 10 | 4 | Geometry |
| MOB-03 | Edge Close Trap | 画面端の×が操作しにくい | 10 | 4 | Geometry |
| MOB-04 | Fixed Bottom Collision | 固定広告がブラウザ/UI/操作と干渉 | 11 | 4 | Mobile viewport |
| MOB-05 | Keyboard/Viewport Conflict | 入力時に広告がviewportを圧迫 | 9 | 3 | Viewport resize |
| MOB-06 | Orientation Disruption | 広告表示により表示方向/レイアウトが大きく変化 | 10 | 4 | Viewport/orientation |

---

## K. Compound / Combo Patterns

> Compound patternsは単独の広告フォーマットではなく、複数の問題が同時発生することでUXが急激に悪化するもの。

| ID | Pattern | 定義 | Base Severity | Game Difficulty |
|---|---|---|---:|---:|
| COM-01 | Popup + Tiny Close | ポップアップ＋極小× | 14 | 4 |
| COM-02 | Popup + Fake Close | ポップアップ＋偽× | 19 | 5 |
| COM-03 | Sticky + Popup | 固定広告＋ポップアップ | 15 | 4 |
| COM-04 | Sticky + Video + Sound | 固定動画＋自動音声 | 17 | 4 |
| COM-05 | Fake Close + Tap Hijack | 偽×＋誤操作誘発 | 20 | 5 |
| COM-06 | Layout Shift + Sticky | レイアウト変動＋固定広告 | 15 | 4 |
| COM-07 | Respawn + Multi-layer | 再出現＋多層ポップアップ | 19 | 5 |
| COM-08 | Countdown + Interstitial | 待機＋全画面広告 | 15 | 4 |
| COM-09 | Native Camouflage + Fake CTA | ネイティブ偽装＋偽CTA | 19 | 5 |
| COM-10 | Mobile Density Stack | 高広告密度＋固定広告＋ポップアップ | 20 | 5 |
| COM-11 | Audio + Popup + Delayed Close | 音声＋遮蔽＋待機 | 18 | 5 |
| COM-12 | Infinite Hell | 複数広告を閉じても連続出現 | 20 | 5 |

---

# 3. Evaluation Formula — Initial Proposal

単純加算ではなく、以下の構造を基本案とする。

```text
Ad UX Score
=
Σ Pattern Severity
× Frequency Multiplier
× Viewport Impact Multiplier
+ Interaction Penalty
+ Compound Penalty
+ Time Cost Penalty
```

## 3.1 Frequency Multiplier

| Occurrence | Multiplier |
|---|---:|
| 1 | 1.0 |
| 2 | 1.1 |
| 3 | 1.2 |
| 4–5 | 1.35 |
| 6+ | 1.5 |

※初期仮説。後で実データCalibration。

## 3.2 Viewport Impact

広告が占有するviewport面積を評価する。

```text
Impact Ratio =
広告が覆う面積 / viewport面積
```

特にモバイルでは、同じ広告サイズでも影響が大きくなり得る。

## 3.3 Interaction Penalty

特定の組み合わせに追加ペナルティを与える。

例:

```text
Fake Close + Popup
        +8

Sticky + Popup
        +5

Auto Sound + Popup
        +5

Respawn + Fake Close
        +10
```

## 3.4 Time Cost

ユーザーが広告のために費やす時間。

```text
Time Cost =
mandatory wait
+ close delay
+ interaction time
+ repeated interruption time
```

---

# 4. Game Difficulty Model — Initial Proposal

ゲームではUX Scoreをそのまま難易度にしない。

```text
Game Difficulty
=
UX Severity
× Interaction Complexity
× Uncertainty
× Time Pressure
```

### Interaction Complexity

- 1: 単純クリック
- 2: タイミングが必要
- 3: 複数対象から選択
- 4: 素早い判断
- 5: 複数ギミック同時処理

### Uncertainty

- 1: 次に何が起こるか明確
- 2: 少し予測しにくい
- 3: ランダム性あり
- 4: フェイク/トラップあり
- 5: 強い不確実性

### Time Pressure

- 1: なし
- 2: ゆっくり
- 3: 通常
- 4: 短時間
- 5: 極端

---

# 5. Detection Strategy

実Web評価では、AIだけにスコアリングさせない。

## Layer 1 — Browser Evidence

Playwright等で収集:

- viewport
- DOM
- bounding box
- fixed/sticky position
- z-index
- click target
- navigation
- history
- scroll
- media state
- network
- screenshots
- performance metrics
- accessibility tree

## Layer 2 — Deterministic Rules

機械的に判定できるもの:

- 広告面積
- 固定要素
- 表示時間
- close delay
- popup frequency
- layout shift
- autoplay
- click destination
- viewport overlap

## Layer 3 — Vision / AI

定性的判定:

- ×が認識しにくい
- 広告と本文の区別が難しい
- CTAと広告が紛らわしい
- fake-looking UI
- 視覚的に過剰なアニメーション
- コンテンツと広告の境界

## Layer 4 — Human/User Evidence

将来的に:

- ユーザー報告
- 「この広告UXが嫌い」
- 誤クリック率
- 離脱率
- 実際の読了率

をCalibrationに使う。

---

# 6. Important Distinction: Ad Creative vs Publisher UX

「クソ広告」を以下の4レイヤーに分けて扱う。

```text
Advertiser
   ↓
Creative
   ↓
Ad Network / Exchange
   ↓
Ad Server / Format
   ↓
Publisher Implementation
   ↓
Site Layout / JS / CSS
   ↓
User Experience
```

同じCreativeでも、配置によってUXは大きく変わる。

したがって、このプロジェクトの主評価対象は原則として:

> **広告クリエイティブそのものより、ユーザーが遭遇する広告UX全体。**

特にPublisher側の:

- 配置
- サイズ
- 頻度
- 表示タイミング
- 閉じ方
- 他UIとの干渉
- 複数広告の組み合わせ

を重視する。

---

# 7. What "Normal Advertising" Can Already Do

「普通に広告を出しただけでは、ああいう地獄にならないのか？」への現時点の整理。

## Yes / No

**広告ネットワークには、侵入的になり得るフォーマット自体は存在する。**

例えばGoogle Ad Managerには、

- Banner
- Native
- Interstitial
- Anchor
- Video
- Expandable/Collapsible等

のようなフォーマット/制御が存在する。

一方、Googleは誤クリックを誘発する配置や、広告をナビゲーション等と誤認させる実装を禁止している。

したがって、

> 「広告ネットワークが提供する正規フォーマット」
>
> と
>
> 「それをどう配置・組み合わせるか」
>
> と
>
> 「サイト側が独自JS/CSSで何を追加するか」

は分けて考える必要がある。

---

# 8. Ad Hell Generator

ゲーム開発用に、将来的に内部ツールとして以下を作る。

```text
┌───────────────────────────────┐
│ AD HELL GENERATOR              │
├───────────────────────────────┤
│                               │
│ Close                          │
│ □ Tiny Close                  │
│ □ Low Contrast                │
│ □ Moving Close                │
│ □ Fake Close                  │
│                               │
│ Interruption                   │
│ □ Popup                       │
│ □ Interstitial                │
│ □ Delayed Popup               │
│                               │
│ Persistence                    │
│ □ Respawn                     │
│ □ Multi-layer                 │
│                               │
│ Attention                      │
│ □ Auto Video                  │
│ □ Auto Sound                  │
│ □ Flashing                    │
│                               │
│ [ GENERATE HELL ]             │
└───────────────────────────────┘
```

このGeneratorから、

- Game Stage
- Automated Test Scenario
- Ad UX Evaluation Fixture

を同じパターン定義から生成する。

---

# 9. Sources / Standards

主要な基準・参考資料:

- Coalition for Better Ads — Better Ads Standards
  https://www.betterads.org/standards/

- Coalition for Better Ads — 2026 Desktop/Mobile Web Standards update
  https://www.betterads.org/blog/

- Google AdSense — Ad placement policies
  https://support.google.com/adsense/answer/1346295

- Google AdSense — Invalid traffic / deceptive placement guidance
  https://support.google.com/adsense/answer/2660562

- Google Ad Manager — Programmatic inventory rules for formats
  https://support.google.com/admanager/answer/17026876

- Google Ad Manager — Web interstitials
  https://support.google.com/admanager/answer/9840201

- Google Ad Manager — Web anchor ads
  https://support.google.com/admanager/answer/10452255

---

# 10. Open Questions / Future Calibration

以下は現時点では決め切らない。

1. Severity Scoreの最終値
2. Pattern間のInteraction Matrix
3. Mobile/DesktopでのSeverity差
4. 広告面積の最適なペナルティ曲線
5. 「広告の存在」そのものに対するPenaltyをどこまで入れるか
6. User離脱データをScoreへどう反映するか
7. AI判定とDeterministic判定の境界
8. Publisher / Ad Network / Creativeの責任分離
9. 実サイトランキング公開時の異議申立て・訂正プロセス
10. 法務・規約・名誉毀損等を踏まえた公開ルール

---

## Design Principle

> **広告を悪とするのではなく、ユーザー体験を壊す広告UXを測る。**

> **同じパターン定義を、ゲーム・評価・改善の3つで共有する。**

> **初期Scoreは仮説。実データによってCalibrationする。**
