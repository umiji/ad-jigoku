# DECISIONS_v0.2.md — 設計改訂（会話レビューの反映）

- Status: **Accepted（オーナーレビュー済み）**
- Date: 2026-09-12
- 優先順位: **本文書は v0.1 の設計文書・タスク文書と矛盾する場合、本文書が優先する。**
  反映作業（`docs/HANDOFF_DOC_UPDATE.md`）完了後、本文書は各文書に吸収される。

> 目的: オーナーとのレビューで決まった 10 件の決定と、それを成立させるための新設計を、
> 実装に着手できる精度で記述する。細部の展開（タスク文書・ADR 本文）は別エージェントが行う。

---

# 0. 決定事項一覧

| # | 決定 | 影響範囲 |
|---|---|---|
| D1 | **90パターンを組み合わせて無数のバリエーションを生成する**ことを前提にする | §1〜§4（本文書の中心） |
| D2 | パターンの実装単位は「見た目シェル × 挙動スロット × 中身データ」の**2軸+データ** | §1 |
| D3 | ゲーム画面は**偽ブラウザ枠（BrowserFrame）**の中に描く | §2 |
| D4 | ステージは**エンカウンターテンプレート**で構造化し、生成器が埋める | §3 |
| D5 | **Prioritization（優先順位づけ）**をメカニクスとして実装する | §5 |
| D6 | パターン定義に **`escape` facet（ユーザー向け脱出ノウハウ）**を追加する | §6 |
| D7 | **M4 完了を「面白さゲート」**にする。通過しなければ M5/M6 に進まない | §7 |
| D8 | ホスティングは **Cloudflare Pages**。Phase 1 は静的書き出し | §8 |
| D9 | **実広告はコンテンツページのみ**。ゲーム/LP は偽物のみ。自己診断スコアを公開 | §8 |
| D10 | 診断は**無料=スクリプト / 有料=AI**。診断実行環境は **GitHub Actions** | §8 |

MVP は引き続き **15 パターン**（GAME §23）。D1 は「アーキテクチャが 80+ パターンの組み合わせを
受け入れられること」であって「MVP で全部作ること」ではない。

---

# 1. パターンモデル v2: 見た目 × 挙動 × 中身

## 1.1 v0.1 の誤り

v0.1 は `simulatorId` 1つでパターンの実装を指していた。これは挙動しか表現しておらず、
見た目が本質であるカテゴリ E（偽装系）を表現できない。撤回する。

## 1.2 構造

```text
広告インスタンス = Shell（見た目） × Behaviors（挙動。スロット毎に最大1） × Creative（中身）
```

```ts
type GameFacet = {
  shell: ShellId                                   // 見た目。ShellRegistry のキー
  behaviors: Partial<Record<Slot, BehaviorSpec>>   // 挙動。スロット毎に最大1つ
  creative?: CreativeSelector                      // 中身の抽選条件
  frame?: FrameCapability[]                        // 必要な偽ブラウザ機能（§2）

  playerActions: PlayerAction[]
  correctInaction?: boolean
  failureCondition: FailureCondition
  warning: 'none' | 'subtle' | 'explicit'
  interactionComplexity: 1|2|3|4|5
  uncertainty: 1|2|3|4|5
  timePressure: 1|2|3|4|5
  comboTags: ComboTag[]
  incompatibleWith: PatternId[]
  patienceEffect: { onSpawn: number; onMistake: number; perSecondAlive: number }  // perSecondAlive = 放置コスト（§5）
  education: { ja: string }
  maxCloseDelayMsOverride?: number
  // scoreEffect は削除。難易度3軸から導出する（§5.3）
}

type Slot =
  | 'spawn'        // いつ出るか
  | 'surface'      // どこに・どの大きさで
  | 'close'        // どう閉じる／閉じにくいか
  | 'persist'      // 閉じた後どうなるか
  | 'attention'    // 注意をどう奪うか
  | 'instability'  // レイアウトをどう揺らすか
  | 'deception'    // 何に偽装するか
  | 'hitbox'       // 当たり判定をどう歪めるか

type BehaviorSpec = { id: BehaviorId; params?: Record<string, number | Range> }
```

スロット数は約 8。増やしてよいが、**1スロット1挙動**の原則は崩さない（衝突解決を不要にするため）。

## 1.3 Shell（見た目シェル）

```ts
interface Shell {
  readonly id: ShellId
  readonly parts: AdPart[]          // 描画する部位（close / fake-close / cta / media / label ...）
  readonly supports: Slot[]         // 受け付ける挙動スロット
  readonly frame?: FrameCapability[]
  // React コンポーネント + CSS は packages/ui/shells/<id>/ に独立して置く
}
```

- **シェルは独立モジュール。** 各シェルが自分の HTML/CSS/JS を持つ。共通化しない
- 生成器は `shell.supports ⊇ behaviors のスロット集合` を検証する（`close:moving` は close 部位のあるシェルにしか差せない）

MVP の想定シェル（8）: `popup` / `interstitial` / `stickyBanner` / `videoPlayer` / `fakeDownload` / `fakePlay` / `inlineRect` / `densityStack`
post-MVP: `fakeNav` / `nativeCard` / `toast` / `sideRail` / `fakeNext` ...

**カテゴリ E（偽装系 8 パターン）は 1 パターン 1 シェル**。ここは設計品質の勝負所で、「本気でふざける」の予算を最も配分する場所。

## 1.4 Creative（中身）

コピー・架空ブランド名・色・画像を **数百件のデータ**として持ち、`rng('creative')` で抽選する。
シェルが少なくても「同じ広告ばかり」に見えない鍵はここ。実在ブランドを含まないことを CI で検査する（NG ワードリスト）。

## 1.5 挙動レジストリ

```ts
interface Behavior<S = unknown> {
  readonly id: BehaviorId
  readonly slot: Slot
  readonly friction: number          // 公平性計算用の重み（§3.3）
  readonly load: number              // 認知負荷（§3.3）
  init(params, ctx): S
  onTick(s, ctx): BehaviorResult<S>
  onIntent(s, intent, ctx): BehaviorResult<S>
}
```

挙動は約 20 個。**新パターン追加の典型はコードゼロ**（既存シェル + 既存挙動の組み合わせを JSON に書く）。
コードが要るのは「新しいシェル」か「新しい挙動」を足すときだけ。

## 1.6 90 パターンのゲーム化可能性

BrowserFrame（§2）を前提にすると、90 のうち **約 85 がゲーム化可能**。

| 不可・保留 | 理由 |
|---|---|
| MOB-06 Orientation Disruption | 端末の向きを偽装できない |
| MOB-05 Keyboard/Viewport Conflict | 偽コメント欄を足せば可能。post-MVP |
| ATT-07 Cursor 誘導 | デスクトップ限定。優先度低 |
| OBS-05 Side Rail | デスクトップ限定。つまらない |

「ゲーム化不可」は捨てるのではなく、`game` facet なし＝評価専用として全部残す。

---

# 2. BrowserFrame（偽ブラウザ枠）

## 2.1 何か

ゲーム領域を、**偽のブラウザ UI（タブ／URL バー／戻る・進む／独自スクロールコンテナ）**で包む。
広告は「偽ブラウザの中のページ」に出る。

## 2.2 なぜ必要か

v0.1 では INT-06 Back-Intercept、ACC-06 Scroll Hijack、CLS-14 Close State Reset、PER-04 Cross-page、
INT-04 Click-Triggered Interstitial は **SAFE-03/06 に抵触するため実装不可能**だった。
偽ブラウザ枠があれば、これらは**偽の戻るボタン・偽のスクロール・偽のページ遷移**に対して作用させられる。
実ブラウザの `history` と `window.scroll` には一切触れない。**安全性は「気をつける」ではなく構造で保証される。**

これが D1（90 組み合わせ）を成立させる最大の enabler。

## 2.3 設計

```ts
type FrameCapability = 'back' | 'url' | 'tabs' | 'scrollContainer' | 'textInput' | 'linkNav'

// 端末プロファイルごとに提供する capability
mobile:  ['back', 'url', 'scrollContainer', 'linkNav']
desktop: ['back', 'url', 'tabs', 'scrollContainer', 'linkNav', 'textInput']
```

- パターンは `frame` で必要 capability を宣言。生成器は現プロファイルで満たせないパターンを候補から外す
- 偽ページ遷移 = 同じ記事の別セクションへ「遷移したフリ」。実 URL は変えない（`history.replaceState` すら使わない）
- モバイルでは枠を最小化（上部の細いバーのみ）。縦の実面積を食わない

## 2.4 安全制約（新規 SAFE-12）

**偽ブラウザ枠は実ブラウザの UI を模倣してはならない。**
Browser-in-the-Browser はフィッシング手法であり、ユーザーに偽の URL バーを信用させる訓練をしてはいけない。

- Safari / Chrome の外観をコピーしない。`DESIGN.md` のダーク様式で、明らかに「ゲーム内 UI」と分かる見た目にする
- 偽 URL バーに実在ドメインを表示しない（架空ドメインのみ）
- 常時「これはゲーム内の偽ブラウザです」相当のラベルを最小限に置く（初回のみ強調）

---

# 3. 組み合わせ生成の設計

## 3.1 v0.1 の生成器の問題

「候補から k 個ランダムに抽選」は、**無数のバリエーション**を作れるが**面白さを保証しない**。
純粋ランダムの組み合わせは、手作り 15 ステージより体験が劣る（ローグライクの既知の教訓）。

## 3.2 エンカウンターテンプレート

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

## 3.3 合成妥当性ルール（生成時に全チェック）

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

## 3.4 seed の安定性（rendezvous hashing）

カタログにパターンを追加すると、配列インデックス抽選では**過去の全 seed の結果が変わる**。共有された Seed Challenge が壊れる。

対策: 候補ごとに `w = hash(seed, stream, patternId)` を計算し、上位 k を採る（rendezvous / HRW hashing）。
パターン追加は「新パターンの w が上位に入った場合」だけ結果を変える。既存 seed の大半は保存される。

加えて seed URL に `catalogVersion` を含め、不一致時は「旧バージョンの地獄です」と明示する。黙って違う結果を出さない。

## 3.5 テスト方針（組み合わせ爆発への回答）

全組み合わせのテストは不可能。以下で代替する。

1. **挙動を単体で**（約 20 個）
2. **シェルを単体で**（約 8〜15 個、視覚回帰）
3. **カタログ定義の 90 通り**を通す
4. **property test**: ランダム seed × 1000 で R1〜R8 と SAFE-01 が成立
5. **残余リスクを明示**: 個別の組み合わせの「理不尽さ」は CI では検出できない。プレイテストで発見し、`incompatibleWith` と `friction` 値に還元する運用にする

---

# 4. 90 組み合わせ方針への懸念（オーナーへの回答）

| # | 懸念 | 対処 | 残るリスク |
|---|---|---|---|
| C1 | **面白さの希釈**。無数のバリエーション ≠ 面白い。純粋ランダムは手作りに劣る | §3.2 テンプレート。物語ステージは構造を固定し中身だけ変える | テンプレート設計の質に依存。プレイテスト必須（§7） |
| C2 | **組み合わせの不公平**。個別に公平でも合成で理不尽になる | §3.3 R4/R5。摩擦上限と認知負荷予算 | 閾値の初期値は勘。実プレイで調整 |
| C3 | **見た目のコスト**。偽装系 8 パターンは 1 つずつ専用デザインが要る | MVP は fakeDownload / fakePlay の 2 つに絞る | 残り 6 は post-MVP。設計工数が最も重い領域 |
| C4 | **同じ広告ばかりに見える**。シェルが少ないので挙動が違っても既視感が出る | §1.4 Creative を数百件持つ | コンテンツ作業。生成は容易だが実在ブランド混入の検査が要る |
| C5 | **seed の互換性**。カタログ更新で共有済み地獄が変わる | §3.4 rendezvous hashing + バージョン明示 | 完全な互換は不可能。「大半が保存される」まで |
| C6 | **テスト不能領域**。全組み合わせは検証できない | §3.5 | 理不尽な組み合わせはプレイヤーが最初に発見する |
| C7 | **BrowserFrame のフィッシング類似性** | §2.4 SAFE-12 | 見た目の判断に依存。デザイン QA で確認 |
| C8 | **スコープの膨張**。「組み合わせられる」が「全部作ってから出す」になる | MVP 15 を固定（GAME §23）。アーキテクチャは 85 を受け入れるが、実装は 15 | 規律の問題。CLAUDE.md §4 で禁止済み |

C1 と C2 が本質。**「無数に作れる」より「どれを引いても面白い」のほうが難しい**。テンプレートと合成ルールはそのための投資。

---

# 5. Prioritization（優先順位づけ）メカニクス

## 5.1 なぜ

GAME §7.4 は「今どれを処理するのが一番危険か」を「一番近いボタンを押すことより重要」と位置づけている。
v0.1 にはこれを評価する仕組みがなく、どの順で処理しても同スコアだった。**要件の最重要スキルが設計から抜けていた。**

## 5.2 脅威モデル

各アクティブ広告に、毎 tick 計算される **threat** を持たせる。

```ts
threat(ad) = drain(ad)          // patienceEffect.perSecondAlive（放置コスト）
           + block(ad)          // 本文を覆って progress を止めているか（0 or 定数）
           - trapRisk(ad)       // 焦って触ると大ダメージ（onMistake が大きい）→ 後回しが正解
```

設計上の狙い:

| 種別 | drain | block | trapRisk | 正解 |
|---|---|---|---|---|
| 自動音声 | 高 | 0 | 低 | **最優先で止める** |
| 全画面オーバーレイ | 中 | 高 | 低 | 次に閉じる |
| 下部固定バナー | 低 | 中 | 低 | 余裕があれば |
| 偽×付きポップアップ | 0 | 中 | **高** | **慌てず最後に、慎重に** |
| 偽ダウンロード | 0 | 0 | 高 | **触らない（REPORT）** |

「近いものから押す」「全部即座に閉じる」が最適にならない。判断が要る。

## 5.3 評価（triage bonus）

広告を処理した瞬間、**その時点で最も threat の高い広告を処理したか**を判定し、正しければ triage bonus。
連続で正しければ chain に乗る（既存コンボ機構に統合）。ヘッドレスで決定論的に計算できる。

スコアの `onClear` はパターン個別の手打ち値を廃止し、難易度 3 軸から導出する:
`onClear = BASE × mean(interactionComplexity, uncertainty, timePressure)`
severity からは導出しない（GAME §9.1 の禁止を維持）。90 パターンの手調整を不要にするため。

---

# 6. `escape` facet（ユーザー向け脱出ノウハウ）

## 6.1 位置づけ

`improve` = サイト運営者向け「直し方」。`escape` = ユーザー向け「逃げ方」。**同じパターン定義に、2つの読者への答え**を持つ。
これはプロダクトに欠けていた「運営者が直してくれるまで待てないユーザーへの価値」を埋める。

## 6.2 構造

技法は共通ライブラリに置き、パターンからは ID 参照する（90 パターン分の文章を書かない。技法は約 15 種で足りる）。

```ts
type EscapeFacet = {
  techniques: EscapeTechniqueId[]      // 推奨順
  note?: { ja: string }                // パターン固有の補足
}
// data/escape-techniques.json
type EscapeTechnique = {
  id: string
  title: { ja: string }
  kind: 'immediate' | 'preventive'
  steps: { ja: string; device: 'both' | 'mobile' | 'desktop' }[]
  browserNative: true                  // 常に true。§6.4
}
```

技法の例: `tap-backdrop` / `browser-back-once` / `back-longpress-history` / `reader-mode` / `tab-mute` / `site-audio-block` / `select-and-copy-text` / `close-tab-return-search`

## 6.3 表示面

1. **結果画面**: 失敗の原因（culprit）パターンの技法のみ。「今回の主犯」の直下
2. **図鑑ページ** `/patterns/[id]`: パターン説明 + escape + improve。**検索流入の入口**（「広告 閉じられない スマホ」）
3. **診断レポート**: 運営者向け改善提案の横に「ユーザーはこう逃げています」を参考掲載

## 6.4 線引き（決定済み）

**ブラウザ標準機能のみを案内する。サードパーティの広告ブロッカーは推奨しない。**
根拠: DESIGN_REQ §21（広告ブロッカーの LP にしない）、PRODUCT §31（Ads = Bad ではない）、Persona B が有料顧客。
リーダーモード・タブミュート・サイト別音声設定は「遮断」ではなく「表示の切り替え」なので許容。

---

# 7. 面白さゲート（M4）

- **ゲート位置**: TASK-024（結果画面）完了時点 = 「遊ぶ → 結果 → もう一回」が初めて成立する地点
- **手順**: 5 人以上に説明なしで触ってもらう。GAME §24 Fun 節の 5 項目 + **2 回目プレイ率**を記録
- **通過条件**: 2 回目プレイ率 ≥ 60%（初期値。オーナーが調整可）かつ「何のゲームか」を 30 秒以内に言語化できる
- **不通過時**: M5/M6 に**進まない**。テンプレート・threat 値・摩擦値の調整に戻る。設計変更が要るなら本文書を改訂
- 根拠: GAME §25 Phase 1 の目的は「本当に面白いか検証」。§1.1「UX 検証ツールをゲームと呼んではいけない」

---

# 8. インフラ・運用の改訂

| 項目 | v0.1 | v0.2 |
|---|---|---|
| ホスティング | Vercel | **Cloudflare Pages**（Hobby の商用不可条項を回避。広告掲載＝商用） |
| Phase 1 の形態 | Next.js 動的 | **Next.js 静的書き出し**（アダプタ不要。Phase 3 で動的化を再判断） |
| 診断ワーカー | Fly.io 常駐 + pg-boss | **GitHub Actions**（public repo で無制限。`workflow_dispatch` がキュー代わり） |
| オブジェクトストレージ | S3 | **Cloudflare R2**（10GB 無料・egress 無料） |
| DB | Neon | Neon または D1。**Phase 2 で決定**（今は不要） |
| AI 判定 | advisory | **有料診断のみで実行**。無料診断は決定論的検出のみ。API 費用は課金時のみ発生 |
| 固定費 | — | 独自ドメイン（年 ¥2,000 程度）のみ推奨 |

## 8.1 実広告ポリシー（新規）

```text
ゲーム / LP ルート      : 実広告ネットワーク禁止（偽クリエイティブのみ）   ← SAFE-13 で強制
記事 / ランキング / 図鑑 / レポート : 実広告可。お行儀のよい配置のみ
```

- `AdSlot` コンポーネントに `provider: 'simulated' | 'network'` を持たせ、ルート種別で `network` を型・テストで拒否
- ネットワークは AdSense より**アフィリエイト（自前クリエイティブ）を優先**。誤クリック BAN の仕組みがない
- **自己診断スコアを公開する**: 自サイトを自分の診断にかけ「広告を掲載していて Score 12/100」を掲げる。PRODUCT §31 の実演
- 要件文書の改訂が必要: GAME §2.3 / §17 の「実広告ネットワークのコードを入れない」→「**ゲーム内では**入れない」

## 8.2 新規 SAFE

| ID | 内容 |
|---|---|
| SAFE-12 | BrowserFrame は実ブラウザ UI を模倣しない。実在ドメインを偽 URL バーに出さない |
| SAFE-13 | ゲーム / LP ルートに実広告ネットワークのスクリプトが存在しない（CSP + ルート単位の静的検査） |

---

# 9. 残る未決事項

| # | 内容 | 決める時期 |
|---|---|---|
| Q1 | `FRICTION_CAP` / `LOAD_BUDGET` の初期値 | TASK-008 実装時に仮置き → 面白さゲートで調整 |
| Q2 | 面白さゲートの通過閾値（2回目プレイ率） | ゲート実施前にオーナーが決定 |
| Q3 | MVP で実装するシェル 8 種の最終確定 | TASK-013 系の着手時 |
| Q4 | Creative データの初期件数と生成方法 | TASK-013 系。生成 AI で下書き → 人が実在ブランド検査 |
| Q5 | 図鑑ページ `/patterns/[id]` を Phase 1 に含めるか | 推奨: 含める（静的生成で追加コストが小さく、SEO 入口になる） |

---

# 10. 用語追加（CLAUDE.md §6 へ）

| 用語 | 意味 |
|---|---|
| Shell | 広告の見た目。独立した HTML/CSS/JS モジュール |
| Behavior | 広告の挙動。スロットに差す部品 |
| Slot | 挙動の差し込み口。1 スロット 1 挙動 |
| Creative | 広告の中身データ（コピー・架空ブランド・色） |
| BrowserFrame | ゲーム領域を包む偽ブラウザ UI。ハイジャック系パターンの安全な作用先 |
| Encounter Template | ステージを構成する役割スロットの列。生成器が埋める |
| threat | 各広告の放置コスト。Prioritization の基礎 |
| escape | パターン定義のユーザー向け脱出ノウハウ facet |
