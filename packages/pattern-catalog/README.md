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
| `pnpm check-creatives`（root） | Creative のコピーに実在ブランドが混入していないか検査。1 件でもあれば exit 1 |

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

---

## 7. Creative（広告の中身。TASK-013D / DECISIONS_v0.2 §1.4）

```text
data/creatives/<kind>.json        架空ブランド・コピーのデータ（312 件）
src/creative/schema.ts            zod スキーマと統制語彙（kind / tag / theme）
src/creative/selector.ts          読み込み（静的 import + メモ化）と決定論的な抽選
src/creative/ng-check.ts          実在ブランド NG 検査の純粋ロジック
../../data/ng-words/brands.json   NG ワードリスト（リポジトリ root。240 語）
../../scripts/check-creative-brands.ts  上記を突き合わせる薄い CLI（`pnpm check-creatives`）
```

`広告インスタンス = Shell（見た目） × Behaviors（挙動） × Creative（中身）`。
MVP のシェルは 8 種しかないので、**「同じ広告ばかりに見える」（DECISIONS_v0.2 §4 C4）を防ぐ変数は
実質ここしかない。**

### 7.1 Q4 の決定（DECISIONS_v0.2 §9 / TASK-013D DoD）

| 項目 | 決定 |
|---|---|
| 初期目標件数 | **300 件**（実際の投入は **312 件** = 12 kind × 26） |
| 生成方法 | **AI が下書き → NG ワード検査を CI で機械実行 → 人のレビュー**。3 段目（人の目視レビュー）は**未実施**。実装者は AI であり、自分の書いたコピーを自分で「実在ブランドなし」と保証していない。CI が担保しているのは「NG リストに載っている語が入っていないこと」だけである |
| 検査の位置づけ | NG リストは**網羅ではなく既知分の防波堤**。リストにない実在ブランドは通る。公開前に人が一度通しで読むこと |

### 7.2 件数

**312 件 / 架空ブランド 94 種 / `legal` 付き 310 件（99.4%）。**

| kind | 件数 | 架空ブランド | 使っている theme |
|---|---:|---:|---|
| `sale` | 26 | 14 | danger / popup / popupDark / warning |
| `notice` | 26 | 12 | danger / popup / warning |
| `download` | 26 | 8 | danger / popup / warning |
| `video` | 26 | 7 | danger / popup / popupDark / warning |
| `app` | 26 | 9 | danger / popup / popupDark / warning |
| `dating` | 26 | 6 | danger / popup / popupDark / warning |
| `finance` | 26 | 8 | danger / popup / warning |
| `health` | 26 | 8 | danger / popup / warning |
| `game` | 26 | 7 | danger / popupDark |
| `news` | 26 | 6 | danger / popup / popupDark / warning |
| `survey` | 26 | 5 | danger / popup / warning |
| `subscription` | 26 | 6 | danger / popup / warning |

`theme` は **DESIGN.md §4 の役割名**（`popup` / `popupDark` / `danger` / `warning`）であって色ではない。
Creative に生のカラーコードは持たせない（色を持たせた瞬間にデザイントークンが二重管理になる）。

### 7.3 抽選が決定論である理由

抽選は `selectCreative(creatives, selector, creativeIndex)` の 1 本だけで、**乱数を引かない**。

エンジンはステージ生成のときに `rng('creative')` を 1 回引いて `creativeIndex`（0..999999）を
`ScheduledSpawn` に焼いている（`game-engine/src/stage/generate.ts` の `bakeSpawn`）。
UI はその index を持ってきて引くだけ。実行中に引き直さないので、同じ seed なら常に同じ広告が出る（ADR-002）。

プールは **`id` の昇順に並べ替えてから**剰余を取る。JSON ファイルの並び順を変えただけで
同じ seed のリプレイが変わる、という事故を防ぐため。

`filterCreatives` は `kinds`（いずれかに一致）と `tags`（全部を持っている）の AND。
**0 件になったら全件にフォールバックする。** 中身が空の広告を描くくらいなら、題材が合っていない
広告を描くほうがマシだから。

### 7.4 Creative を追加する手順

1. `data/creatives/<kind>.json` に追記する。`id` は `cr-<kind>-<4桁連番>`、**全ファイルを通して一意**
2. `tags` は `src/creative/schema.ts` の `CREATIVE_TAGS`（統制語彙）から選ぶ。自由文字列は入らない
3. 文字数上限: `brand` 2..14 / `headline` 24 / `body` 60 / `cta` 12 / `legal` 60
4. `pnpm check-creatives`（root）— 実在ブランド検査
5. `pnpm --filter @ad-jigoku/pattern-catalog test` — 件数・kind 別下限・id 一意・抽選の決定論

### 7.5 NG ワードを追加する手順

`data/ng-words/brands.json`（リポジトリ root）の `terms` に 1 行 1 語で足して、`updated` を更新する。
配列はソート済み・重複なしで保つ（`scripts/check-creative-brands.test.ts` が検査している）。

判定は両辺を正規化してからの**部分一致**である（`normalizeForBrandCheck`）。

1. NFKC（`ａｍａｚｏｎ` / 半角カタカナ `ｱﾏｿﾞﾝ` を正規形へ）
2. 小文字化
3. ひらがな → カタカナ（`あまぞん`）
4. 空白・記号の除去（`amazon prime` / `ア・マ・ゾ・ン`）

そのため **2 文字程度の短い語を入れてはいけない。** 無関係な架空コピーに巻き添えで一致する。
`au` ではなく `auひかり` / `auペイ`、`LINE` ではなく `linemo` のように、
誤検知が出ない長さまで具体化して登録する。

### 7.6 禁止事項

- 実在の企業 / 商品 / 有名人 / ドメイン名を書かない（DESIGN.md §3 MUST NOT 9）。
  **1 文字違いの近似表記（`Gooogle` の類）も禁止。** 検査を通っても意図が悪いものは通してはいけない
- URL を書かない（`headline` / `body` / `legal` すべて）
- `theme` に生の色コードを書かない（DESIGN.md §4）
- **NG 検査に落ちたときに NG リストから語を外して通さない。** 直すのはコピーのほう
