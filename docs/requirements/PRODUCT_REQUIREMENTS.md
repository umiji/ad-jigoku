# PRODUCT_REQUIREMENTS.md

## 0. Document Status

- Status: Draft v0.1
- Scope: Product / Service layer
- Related documents:
  - `AD_UX_PATTERN_CATALOG.md`
  - `GAME_REQUIREMENTS.md`
- Implementation target: Web service
- Core mission:

> **広告そのものを悪とするのではなく、ユーザー体験を壊す広告UXを可視化し、改善を促す。**

---

# 1. Product Concept

本プロダクトは、以下の3つを一体化したWebサービスである。

1. **Game**
   - 広告地獄をゲームとして体験する
2. **Ad UX Evaluation**
   - 実際のWebサイトの広告UXを評価する
3. **Ranking / Improvement**
   - 広告UXを比較・可視化し、改善を促す

基本構造:

`Experience → Awareness → Evaluation → Improvement → Better UX`

ゲームは入口。

最終的な価値は、現実のWebサイトにおける広告UX改善につなげること。

---

# 2. Mission

## 2.1 Mission

> **Web上の「広告地獄」を減らす。**

より具体的には、

> **広告によってユーザーが本来得たいコンテンツに到達できない、読み続けられない、操作できない状態を減らす。**

## 2.2 Long-term KPI

最重要指標候補:

> **広告地獄から脱出したサイト数**

単純なPVやゲームDAUだけをNorth Starにしない。

ゲームが巨大化しても、現実のUX改善につながらなければMission達成とはみなさない。

---

# 3. Problem Definition

## 3.1 User-side Problem

Webユーザーは、

- 記事を読みたい
- 情報を調べたい
- 商品を比較したい
- 動画やコンテンツを見たい

だけなのに、

- 突然広告が出る
- 画面を覆われる
- 閉じる場所が分からない
- 閉じたと思ったら別の広告が出る
- スクロール中に広告が追従する
- 音が突然鳴る
- UIがズレる
- 本物のUIと広告の区別がつかない

などによって離脱する。

問題は広告の存在そのものではない。

> **広告によってユーザーの目的達成が過度に妨害されること。**

---

# 4. Target Users

## 4.1 Persona A — Web User

### Needs

- コンテンツを邪魔されずに利用したい
- 広告があっても構わない
- ただし、邪魔すぎるサイトは避けたい

### Product Value

- 広告UXの悪さを体験として理解できる
- サイトごとのUXを比較できる
- より良いサイトを選べる

---

# 4.2 Persona B — Site Operator

対象:

- メディア運営者
- ブログ運営者
- アフィリエイトサイト
- SaaS / Webサービス運営者
- Vibe Coder
- Indie Hacker
- 小規模事業者

### Problem

自分のサイトについて、

> 「広告が邪魔なのは分かっているが、どこまでが悪いUXなのか分からない。」

という問題がある。

特にVibe Coderは、

- Claude Code
- Codex
- Lovable
- v0
- その他AI開発ツール

によってサイトを高速に作れる一方、

**第三者視点でのUX評価が不足しやすい。**

### Product Value

- 客観的な広告UXスコア
- 問題箇所の特定
- 改善提案
- Before / After比較
- 再評価
- 認定バッジ

---

# 5. Core Product

## 5.1 Game

Purpose:

> ユーザー獲得 + UX問題の認知 + ブランド形成

詳細は `GAME_REQUIREMENTS.md` に定義する。

---

# 5.2 Ad UX Evaluation

Webサイトを対象として、

- 広告の位置
- 広告サイズ
- viewport占有率
- popup
- sticky
- close friction
- layout shift
- autoplay
- misleading UI
- interaction obstruction
- recurrence
- cumulative burden

などを評価する。

評価の基本ソース:

`AD_UX_PATTERN_CATALOG.md`

---

# 5.3 Ranking

サイトの広告UXを比較可能にする。

例:

- 広告UXランキング
- 広告地獄ランキング
- 今週の広告地獄
- 改善したサイト
- Most Improved
- Certified Sites

ただし、

> **「悪いサイトを永遠に晒すこと」がプロダクト目的になってはいけない。**

ランキングは改善を促すための手段。

---

# 6. Ad UX Score

## 6.1 Purpose

単純な「広告が多い / 少ない」ではなく、

> **ユーザー体験への負荷**

を測る。

---

# 6.2 Initial Formula

概念式:

`Ad UX Score = Σ(Pattern Severity × Frequency Multiplier × Viewport Impact Multiplier) + Interaction Penalty + Compound Penalty + Time Cost Penalty`

最終スコアは0–100に正規化する想定。

高いほど悪い。

---

# 6.3 Evaluation Dimensions

最低限:

1. Interruption
2. Obstruction
3. Interaction Friction
4. Deception
5. Attention Hijacking
6. Persistence
7. Time Cost
8. Mobile Impact
9. Cumulative Effect

これらは`AD_UX_PATTERN_CATALOG.md`と共通化する。

---

# 7. Evaluation Architecture

評価は4層で構成する。

## Layer 1 — Browser Evidence

Playwright等で取得:

- viewport
- DOM
- bounding box
- position
- fixed / sticky
- z-index
- click target
- navigation
- history
- scroll
- media state
- network
- screenshot
- performance metrics
- accessibility tree

## Layer 2 — Deterministic Rules

機械的に測定可能な項目。

例:

- viewportの何%を広告が覆っているか
- closeまで何秒かかったか
- popupが何回出たか
- layout shift量
- autoplay状態
- sticky継続時間

## Layer 3 — Vision / AI

定量化しにくい項目。

例:

- fake closeっぽさ
- native UIとの類似
- 視認性
- 広告と本文の区別
- deceptive appearance

AIは最終判定をブラックボックス化しない。

**検出根拠を保存する。**

## Layer 4 — Human Calibration

将来的に、

- ユーザー評価
- アンケート
- 行動データ

によってスコアを補正する。

---

# 8. Evidence-First Principle

すべての評価結果は、

> **「なぜこの点数になったのか」**

を説明できなければならない。

Example:

```text
Score: 82 / 100

Detected:
- Full-screen overlay
- Delayed close: 4.2 sec
- Sticky video: 18.4% viewport
- Layout shift: CLS 0.31
- Popup recurrence: 3 times

Major penalty:
- Full-screen interruption
- Delayed dismissal
- Repeated interruption
```

AIが、

> 「UXが悪いです。」

だけを返すのは禁止。

---

# 9. Audit Report

## 9.1 Basic Report

無料 / 初回評価で提供する候補:

- Overall score
- Detected patterns
- Severity
- Screenshots
- Basic explanation
- Mobile / Desktop difference

## 9.2 Detailed Report

有料候補:

- pattern-by-pattern analysis
- reproduction steps
- evidence
- impact analysis
- prioritized improvements
- expected score improvement
- Before / After comparison

---

# 10. Improvement Recommendation

単なる「悪いです」で終わらせない。

各問題に対して:

```text
Problem
↓
Evidence
↓
Why it hurts UX
↓
Recommended change
↓
Expected impact
↓
Re-audit
```

を提供する。

Example:

> Sticky video occupies 22% of mobile viewport.

↓

> Reduce occupied area to <10%.

↓

> Re-test.

↓

> Score: 78 → 54.

---

# 10.5 User-side Remedy（escape）

> v0.2 追加（`docs/design/DECISIONS_v0.2.md` §6, D6）。詳細は同文書を参照。

改善提案（§10）は運営者向けの「直し方」。しかし、運営者が直してくれるまで待てないユーザーにも価値を提供する。

- パターン定義に**ユーザー向けの脱出ノウハウ（`escape` facet）**を持たせる
- ブラウザ標準機能のみを案内する。サードパーティの広告ブロッカーは推奨しない
- 表示面: 結果画面（ゲーム）/ `/patterns/[id]` 図鑑ページ / 診断レポートの参考欄

---

# 11. Before / After

プロダクトの重要機能。

表示:

```text
BEFORE
Ad UX Score: 81
Major issues: 6

AFTER
Ad UX Score: 43
Major issues: 2

Improvement
-38 points
```

これを、

- サイト運営者
- SNS
- ランキング

で共有できるようにする。

---

# 12. Certification

将来的なプロダクト機能。

例:

### Ad UX Certified

一定基準を満たしたサイトに発行。

条件例:

- Score < 30
- No Critical patterns
- Mobile compliance
- Re-audit within defined period

バッジには評価日時を含める。

---

# 13. Ranking Design

## 13.1 Negative Ranking

初期の話題性を作るため、

> **広告地獄ランキング**

を用意する。

ただし、以下を必須とする。

- 評価日時
- 対象URL
- 測定条件
- 検出パターン
- スコア根拠
- 再評価申請

## 13.2 Positive Ranking

長期的にはこちらを強化する。

- Most Improved
- Best Ad UX
- Most User-Friendly
- Certified Sites

## 13.3 Ranking Philosophy

目標:

`Bad Site → Public Feedback → Improvement → Recognition`

であって、

`Bad Site → Permanent Public Shaming`

ではない。

---

# 14. Appeals / Corrections

公開ランキングを行う場合、サイト運営者からの訂正・再評価を受け付ける。

最低限:

- 評価対象URL
- 評価日時
- 再現条件
- 再評価
- 結果更新
- 履歴保持

スコア変更履歴は可能な限り残す。

---

# 15. Site Owner Flow

想定フロー:

```text
URL入力
↓
無料Audit
↓
Score
↓
問題箇所
↓
改善提案
↓
改善
↓
Re-audit
↓
Score改善
↓
Certification
```

---

# 16. User Flow

## 16.1 Game-first Flow

```text
Game
↓
面白い
↓
広告UXパターンを知る
↓
「実際のサイトは？」
↓
Ranking / Evaluation
```

## 16.2 Site-first Flow

```text
自分のサイトをAudit
↓
Score
↓
問題発見
↓
改善
↓
Re-audit
↓
Certification
```

---

# 17. Growth Loop

## 17.1 Game Loop

`Play → Fail → Retry → Improve → Share`

## 17.2 Ranking Loop

`Search Site → See Ranking → Share → More Sites Evaluated`

## 17.3 Owner Loop

`Audit → Improve → Re-audit → Share Certification`

## 17.4 Mission Loop

`More Awareness → More Audits → More Improvements → Better Web UX`

---

# 18. Business Model

## 18.1 Free

- Game
- Basic ranking
- Basic site audit
- Basic score

目的:

> ユーザー獲得 / 認知 / データ蓄積

## 18.2 Paid Audit

候補:

- Detailed report
- Prioritized recommendations
- Mobile/Desktop comparison
- Historical comparison
- Re-audit

## 18.3 Monitoring

将来的に:

- Scheduled audit
- Score change alerts
- New UX violation detection
- Regression monitoring

Subscription modelと相性が良い。

## 18.4 Certification

- Certification
- Badge
- Verification page

を有料または一定条件で提供する可能性。

---

# 18.5 Ad Placement Policy

> v0.2 追加（`docs/design/DECISIONS_v0.2.md` §8.1, D9）。詳細は同文書を参照。

```text
ゲーム / LP ルート                          : 実広告ネットワーク禁止（偽クリエイティブのみ） ← SAFE-13 で強制
記事 / ランキング / 図鑑 / レポート ルート    : 実広告可。お行儀のよい配置のみ
```

- `AdSlot` コンポーネントに `provider: 'simulated' | 'network'` を持たせ、ルート種別で `network` を型・テストで拒否する
- ネットワークは AdSense より **アフィリエイト（自前クリエイティブ）を優先**する（誤クリック BAN の仕組みがないため）
- **自己診断スコアを公開する**: 自サイトを自分の診断にかけ、結果を掲げる（§31「Ads = Bad ではない」の実演）

---

# 19. Pricing Philosophy

初期は価格最適化より、

> **「本当に改善に金を払う人がいるか」**

を検証する。

最初から複雑なSaaS料金体系を作らない。

MVPでは:

1. Free Audit
2. Paid Detailed Audit

程度で十分。

---

# 20. Data Strategy

プロダクトの競争力は、

> **広告UXパターンの知識 + 実サイトの観測データ**

に蓄積される。

保存候補:

- URL
- domain
- timestamp
- viewport
- detected patterns
- evidence
- score
- screenshot
- evaluation version
- re-audit result

個人情報・不要なユーザー追跡データは収集しない。

---

# 21. Evaluation Versioning

スコアは時間とともに変わり得る。

そのため:

`Evaluation Version`

を持つ。

Example:

```text
Evaluation Version: v0.1
Pattern Catalog: v0.1
Evaluator: v0.1
Timestamp: 2026-XX-XX
```

これにより、

> 「去年80点だったのに今70点になった」

という比較の意味を保てる。

---

# 22. Real-site Evaluation Constraints

MVPでは、

- 公開Webサイト
- 一般的なブラウザ環境
- 定義したviewport
- 定義した回数のページ遷移

など条件を固定する。

評価結果は、

> **「指定条件下での自動評価」**

として表示する。

「Webサイト全体の絶対的なUX品質」と表現しない。

---

# 23. Legal / Trust Requirements

公開ランキングを行うため、信頼性を重視する。

最低限:

- 評価基準の公開
- スコア算出方法の説明
- 評価日時
- 評価条件
- 再評価制度
- 異議申立て
- データ削除 / 修正ポリシー
- 利用規約
- プライバシーポリシー

特に、

> 「クソサイト」

のような人格・企業への攻撃ではなく、

> **「広告UXスコア 87 / 100」**

という測定可能な表現を基本とする。

---

# 24. Brand Tone

プロダクトの表現は、

**毒舌 × ユーモア × データ**

を基本とする。

例:

> 「閉じるボタン、逃げました。」

> 「記事より広告のほうが前に出てきました。」

> 「広告を閉じたら、広告が増えました。」

ただし、評価レポートではユーモアより客観性を優先する。

---

# 25. MVP Scope

## Phase 1 — Game MVP

詳細:

`GAME_REQUIREMENTS.md`

目的:

> 本当に面白いか検証。

## Phase 2 — Pattern Evaluation Engine

目的:

> カタログを実際のブラウザ観測に接続。

対象:

- 10–15 patterns
- desktop/mobile
- screenshot evidence
- basic scoring

## Phase 3 — Public Audit

URLを入力すると:

`URL → Audit → Score → Report`

## Phase 4 — Ranking

- Public score
- Ranking
- Most Improved

## Phase 5 — Owner Product

- Detailed audit
- Re-audit
- Certification
- Monitoring

---

# 26. MVP Non-Goals

最初から以下を作らない。

- 全広告ネットワーク対応
- 全Webサイトの完全自動評価
- 高精度AI判定の完成
- 複雑なアカウントシステム
- 高度なSaaS課金
- 大規模ランキング
- リアル広告配信
- ブラウザ拡張
- 実ユーザーの行動追跡

まず、

> **Game + Pattern Catalog + Basic Evaluation**

のコアを成立させる。

---

# 27. Success Metrics

## Game

- First-play completion
- Retry rate
- Session length
- Second-run rate
- Share rate

特に:

> **Second-run rate**

を重要視する。

## Evaluation

- Audit completion rate
- URL再入力率
- Report閲覧率
- Re-audit rate

## Owner

- Free → Paid conversion
- Improvement completion
- Re-audit conversion
- Certification conversion

## Mission

最重要:

> **改善されたサイト数**

---

# 28. Product Architecture Concept

全体:

```text
                    ┌──────────────────┐
                    │ AD UX Pattern DB │
                    └────────┬─────────┘
                             │
             ┌───────────────┼───────────────┐
             ↓               ↓               ↓
          GAME          EVALUATOR        RANKING
             │               │               │
             ↓               ↓               ↓
         Players        Site Owners       Public
             │               │               │
             └───────────────┼───────────────┘
                             ↓
                       IMPROVEMENT
                             ↓
                       BETTER WEB UX
```

Pattern DBが共通基盤。

---

# 29. Source of Truth

役割を明確に分ける。

### `AD_UX_PATTERN_CATALOG.md`

> 広告UXパターンの定義

### `GAME_REQUIREMENTS.md`

> パターンをどうゲーム化するか

### `PRODUCT_REQUIREMENTS.md`

> サービスとして何を提供するか

### Future evaluator spec

> 実サイトをどう測定するか

### Future task files

> Claude Codeでどう実装するか

---

# 30. Open Decisions Before Implementation

以下は実装に大きく影響するため、後続タスク生成前に必要に応じて確定する。

## D1. Initial evaluator target

A. Article/news sites
B. Any public webpage
C. User-submitted URL only

Current recommendation:

**A → C → B**

まず広告UX問題が顕著な記事・メディア系サイトに集中する。

## D2. Public ranking scope

A. Automatically crawl
B. User-submitted sites
C. Curated sites

Current recommendation:

**C + B**

初期は品質をコントロールする。

## D3. Account requirement

Game:

**No account**

Audit:

**No account for basic audit**

Paid / monitoring:

**Account required**

## D4. Score visibility

Basic score should be public.

Detailed evidence may be partially restricted for site-owner workflow.

## D5. Screenshot policy

Screenshots are useful evidence, but storage, copyright, robots/terms, and takedown handling must be addressed before public ranking at scale.

---

# 31. Key Product Principle

本プロダクトは、

> **「広告をなくすサービス」ではない。**

目指すのは、

> **「広告があっても、ユーザーが目的を達成できるWeb」**

である。

広告はサイト運営者にとって重要な収益源であり得る。

したがって、

`Ads = Bad`

ではなく、

`User-hostile Ad UX = Bad`

という立場を維持する。

---

# 32. Final Product Definition

一言で表現すると:

> **広告地獄をゲームで笑い飛ばし、現実のWebサイトの広告UXを測って、改善までつなげるサービス。**

Long-term:

> **「広告UXをちゃんと評価・改善する」という市場を作る。**
