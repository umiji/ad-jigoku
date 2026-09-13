# @ad-jigoku/pattern-catalog

Shared Kernel（ADR-001）。広告UXパターンのスキーマ・データ・クエリ API。
**何にも依存しない**（外部依存は zod のみ。React / DOM / Playwright / Date / Math.random を import しない）。

```text
docs/requirements/AD_UX_PATTERN_CATALOG.md   人間の source of truth（Markdown）
        ↓ TASK-004
packages/pattern-catalog/data/patterns/*.json  機械の source of truth（JSON）
```

**両者が食い違ったら Markdown が正。** これを CI（`pnpm catalog:parity`）で固定している。

## 1. 収録件数

全 **92 パターン**（カテゴリ A..K）。
TASK-004 の本文・ADR は「約90パターン」と丸めて書いているが、`AD_UX_PATTERN_CATALOG.md §2` の表を
数えると 92 行ある（CLS 14 / INT 10 / OBS 10 / ACC 8 / DEC 8 / ATT 7 / TIME 6 / PER 5 / LAY 6 / MOB 6 / COM 12）。
Markdown が正なので 92 を採用した（`src/version.json` の `patternCount` も 92）。

facet のカバレッジは `pnpm catalog:coverage` で確認する。

| facet | 件数 | 対象 |
|---|---:|---|
| `game` | 16 | GAME §23 の MVP セット（15 + CLS-01 Tiny Close） |
| `improve` | 16 | 同上 |
| `detect` | 12 | Phase 2 の決定論的検出対象 |
| `escape` | 0 | TASK-013F 以降 |
| `fixture` | 0 | TASK-02x 以降 |

## 2. コマンド

| コマンド | 何をするか |
|---|---|
| `pnpm catalog:validate --verbose` | zod parse + V-01..V-14（データ単体で検査できるもの） |
| `pnpm catalog:parity` | Markdown ↔ JSON の severity / gameDifficulty 一致検査。差分があれば「JSON をどう直すか」を出して exit 1 |
| `pnpm catalog:coverage` | facet カバレッジ表 |

`catalog:parity` は CI（`.github/workflows/ci.yml`）と root の `pnpm ci` に組み込まれている。

## 3. `dimensions` の付与方針（TASK-004 DoD）

`dimensions` は `CATALOG §1.2` の9次元（`interruption` / `obstruction` / `interactionFriction` /
`deception` / `attentionHijacking` / `persistence` / `timeCost` / `mobileImpact` / `cumulativeEffect`）を
`0..3` で持つ。Markdown 側には列がないので、**定義文（定義 列）から機械的に近い基準で判断した。**

### 3.1 値の意味

| 値 | 基準 |
|---:|---|
| 3 | そのパターンを**そのパターンたらしめている**次元。定義文が直接言及している |
| 2 | 定義文から必然的に導かれる強い副作用（例: 全画面オーバーレイ → `interruption` 2） |
| 1 | 条件付きで発生する副次的影響（例: 極小× → `timeCost` 1） |
| 省略 | 有意な影響がない。**0 を明示的に書かない**（`Partial<Record<...>>` なので「無い」と「0」を区別しない） |

### 3.2 カテゴリ既定と例外規則

- カテゴリの主軸は原則 3 を入れる（CLS→`interactionFriction`、INT→`interruption`、OBS→`obstruction`、
  DEC→`deception`、ATT→`attentionHijacking`、TIME→`timeCost`、PER→`persistence`、MOB→`mobileImpact`）
- ACC（誤クリック）は `interactionFriction` 3 + `deception` 2-3。「意図と結果がずれる」ことが本質なため
- LAY（レイアウト）は `interactionFriction` 3。押す対象が動くことが実害だから
- `mobileImpact` は「小さい画面で影響が増幅するか」。固定広告・面積占有・端の当たり判定に効くものへ 2-3。
  MOB-* は定義上すべて 3
- `cumulativeEffect` は「他パターンと重なると悪化するか」。COM-* は全件 3。
  単独パターンでも、重なりが実際に観測される定番（固定広告・密度・偽装系）へ 2
- `timeCost` は「待ち時間が発生するか」。待機が定義に含まれる TIME-* と CLS-03/CLS-04 は 3

### 3.3 意図的にやらなかったこと

- **severity から dimensions を機械的に割り戻していない。** severity は仮説値（`severitySource: "hypothesis"`）であり、
  そこから次元を逆算すると「仮説から仮説を作る」ことになるため。9次元はあくまで定義文の読解結果
- 9次元すべてを埋めることはしていない。空欄は「まだ測っていない」ではなく「効かない」の意味

## 4. MVP の Shell × Behavior 契約（GAME_ENGINE_DESIGN §7.1）

`game` facet を持つ 16 パターンが使う shell / behavior id は、TASK-013A/B/C（エンジン実装）との契約である。
**ここを変えると実装が壊れる。** 変更時は `test/data.test.ts` の `MVP_GAME` も同時に直すこと。

| Pattern | shell | behaviors（slot: id {params}） | comboTags |
|---|---|---|---|
| INT-01 Immediate Popup | `popup` | spawn: `spawn:immediate` / close: `close:instant` | popup |
| OBS-03 Large Sticky Bottom | `stickyBanner` | spawn: `spawn:immediate` / persist: `persist:sticky` | sticky |
| CLS-01 Tiny Close | `popup` | spawn: `spawn:immediate` / close: `close:tiny` {visualScale: 0.5} | popup, tiny-close |
| CLS-03 Delayed Close | `popup` | spawn: `spawn:immediate` / close: `close:delayed` {delayMs: 2000-4000} | popup, delayed-close, countdown |
| CLS-05 Moving Close | `popup` | spawn: `spawn:immediate` / close: `close:moving` {intervalMs: 700-1200, maxMoves: 6} | popup, moving-close |
| CLS-11 Fake Close | `popup` | spawn: `spawn:immediate` / close: `close:fake` {decoyCount: 1-2} | popup, fake-close |
| ATT-01 Auto-play Video | `videoPlayer` | spawn: `spawn:delayed` {afterMs: 1500-4000} / attention: `attention:autoplay-video` | autoplay-video |
| ATT-02 Auto-play Sound | `videoPlayer` | spawn: `spawn:delayed` {afterMs: 1500-4000} / attention: `attention:auto-sound` | autoplay-video, auto-sound |
| LAY-01 Layout Shift | `inlineRect` | spawn: `spawn:delayed` {afterMs: 1000-3000} / instability: `instability:shift` {shiftPx: 80-240} | layout-shift |
| OBS-01 Fullscreen Overlay | `interstitial` | spawn: `spawn:immediate` / surface: `surface:fullscreen` | fullscreen, interstitial |
| PER-01 Respawning Ad | `densityStack` | spawn: `spawn:immediate` / persist: `persist:respawn` {respawnDelayMs: 500-1500, maxRespawns: 2} | popup, respawn |
| DEC-02 Fake Download | `fakeDownload` | spawn: `spawn:delayed` {afterMs: 800-2500} / deception: `deception:fake-download` | fake-download |
| DEC-03 Fake Play | `fakePlay` | spawn: `spawn:delayed` {afterMs: 800-2500} / deception: `deception:fake-play` | fake-play |
| PER-02 Multi-layer Popup | `densityStack` | spawn: `spawn:immediate` / persist: `persist:multi-layer` {layers: 2-3, respawnDelayMs: 200-600} | popup, multi-layer |
| OBS-09 Excessive Ad Density | `densityStack` | spawn: `spawn:immediate` / persist: `persist:multi-layer` {layers: 3-4, respawnDelayMs: 0-200} | density, multi-layer |
| COM-03 Sticky + Popup | （なし。COM） | （なし。`composedOf` を生成器が同時起動する） | sticky, popup |

必要な shell 8 種 / behavior 16 種:
`popup` `stickyBanner` `videoPlayer` `inlineRect` `interstitial` `densityStack` `fakeDownload` `fakePlay` /
`spawn:immediate` `spawn:delayed` `close:instant` `close:tiny` `close:delayed` `close:moving` `close:fake`
`surface:fullscreen` `persist:sticky` `persist:respawn` `persist:multi-layer`
`attention:autoplay-video` `attention:auto-sound` `instability:shift` `deception:fake-download` `deception:fake-play`

### 4.1 `incompatibleWith`（対称。V-04）

- OBS-01 ↔ OBS-09（全画面が覆っている上に密度を積んでも、密度が見えない）
- OBS-09 ↔ PER-02（どちらも多層スタックで、同時に出すと何が起きているか読めない）

### 4.2 `patienceEffect` の設計（GAME_ENGINE_DESIGN §9.4）

threat = drain + block − trapRisk。**「近いものから押す」が最適にならない**ように値を置いている。

| 種別 | perSecondAlive | onMistake | 意図 |
|---|---:|---:|---|
| ATT-02 自動音声 | 3 | 6 | 最優先で止める |
| OBS-01 全画面 | 1.5 | 6 | 次に閉じる（block が乗る） |
| PER-02 / COM-03 | 1.5 | 8-10 | 層が増える前に処理 |
| OBS-03 下部固定 | 0.5 | 4 | 余裕があれば |
| CLS-11 偽× | 0 | 25 | 慌てず最後に、慎重に |
| DEC-02 / DEC-03 偽UI | 0 | 30 | 触らない（`correctInaction: true`） |

## 5. 導出 gameDifficulty との乖離（V-10 / TASK-004 acceptance）

`computeGameDifficulty`（`src/derived.ts`）= `clamp(round(cbrt(ic × unc × tp) × (0.5 + severity/20)), 1, 5)`。
V-10 は乖離が **±1 を超えたとき** warn する。**現状 V-10 warning は 0 件。**

乖離が ±1 ちょうど（warn しないが記録しておくべきもの）は 3 件。いずれも
**カタログ値（Markdown）を正とし、JSON の 3 軸は現実的な操作難度のまま据え置いた。**

| ID | カタログ | 導出 | ic/unc/tp | どちらが正しいか |
|---|---:|---:|---|---|
| INT-01 Immediate Popup | 2 | 1 | 1/1/2 | **カタログが正。** 操作そのものは「×を1回押す」で導出値 1 が実態に近いが、ゲームでは最初に出会う敵であり、カタログの 2 は「Normal = 基準」の意味を持つ。3 軸を水増しして 2 に合わせると、`onClear`（3軸平均から導出）まで上がって報酬設計が歪む |
| OBS-03 Large Sticky Bottom | 2 | 1 | 1/1/2 | **カタログが正。** 単独なら導出 1 で妥当。ただし固定広告は「放置すると他と積み重なる」ことが難度の本体で、その効果は 3 軸ではなく `cumulativeEffect` と threat 側に入っている |
| CLS-01 Tiny Close | 2 | 1 | 3/1/2 | **カタログが正。** severity 5（Low）が係数 0.75 として効いて導出が下がっている。狙いの精度は要求される（ic=3）ので、体感難度はカタログの 2 が近い。severity と gameDifficulty が独立軸である（CATALOG §1.3）ことの実例 |

3件とも `severityFactor`（0.5 + severity/20）が低 severity 側を押し下げる挙動に起因する。
`derived.ts` を触るのは TASK-003 の管轄なので、ここでは変更していない。

## 6. パターンを追加・変更する手順

1. **先に `docs/requirements/AD_UX_PATTERN_CATALOG.md` を直す。** Markdown が正（ADR-001）
2. `data/patterns/<category>.json` を直す。キー順は `test/samples.ts` に合わせる
   （id → category → name → definition → severity → severitySource → gameDifficulty → dimensions →
   composedOf → game → detect → improve → escape → fixture）
3. `pnpm catalog:parity` — Markdown と一致しているか
4. `pnpm catalog:validate --verbose` — V-01..V-14
5. `pnpm --filter @ad-jigoku/pattern-catalog test` — 件数・MVP 契約・COM 参照
6. `pnpm catalog:coverage` — facet の抜けを確認

新しい shell / behavior を増やす場合はエンジン実装（TASK-013A/B/C）とセットでなければ
V-05 / V-13 で落ちる。**JSON だけ先に増やさない。**

### 禁止事項

- `AD_UX_PATTERN_CATALOG.md` にないパターン ID を JSON に足さない（CLAUDE.md §2.4）
- 実在企業の広告・ブランド・コピーを `name` / `definition` / `education` / `improve` に書かない（DESIGN.md §3）
- `improve.adFriendlyAlternative` に「広告をやめる」と書かない。「広告は出したまま、UX を直す」だけを書く（V-09 / PRODUCT §31）
