# DESIGN_REQUIREMENTS.md

## 0. Status

- Status: Draft / Implementation Baseline
- Product: 「ようこそ、広告地獄へ。」（仮）
- Scope: LP / Product entrance / Game entrance
- Primary device: Mobile
- Secondary device: Desktop
- Design benchmark: AMIX
- Core principle: **本気でふざける。**

---

# 1. Design Goal

このLPは「広告UXについて説明するLP」ではない。

**LP自体が広告地獄になっていること**を最優先要件とする。

ユーザーは説明を読むのではなく、

1. 広告地獄へ入る
2. 広告に邪魔される
3. 広告を閉じる
4. 次の情報へ進む
5. また広告に邪魔される
6. 最後に「このサイト、広告地獄をゲームにしてる」と理解する

という体験をする。

## Design thesis

> **「説明を広告にする。」**

LP上の重要情報は、通常のカードやセクションではなく、
広告ポップアップ／インタースティシャル／sticky ad／偽CTA等の形式で表示する。

---

# 2. Brand Direction

## 2.1 Mood

第一印象:

- 暗い
- 不穏
- ちょっと笑える
- 洗練されている
- インターネット感がある
- ゲームっぽい
- 少し悪趣味
- しかし安っぽくない

避ける:

- 明るいSaaS
- 白背景のスタートアップLP
- 一般的なTailwind UI
- 子供向けゲームサイト
- ホラーゲームそのもの
- 単なる「広告ブロッカー」感

## 2.2 Brand phrase

候補:

> 本気でふざける。

> ようこそ、広告地獄へ。

> あなたの記事を、読ませる気はありません。

> この先、広告が出ます。

最終コピーは実装前に確定する。

---

# 3. Visual Direction

## 3.1 Background

基本はDark Cinematic。

想定:
- nearly black
- charcoal
- deep gray
- very dark warm/red undertone

背景は完全な単色に固定しない。

軽い:
- noise
- grain
- vignette
- subtle gradient
- scanline
- texture

を使用して「普通のWebサイトではない」質感を作る。

ただし背景演出が広告UIより目立ってはいけない。

## 3.2 Accent

広告の危険信号を想起させるアクセントを使う。

候補:
- warning red
- toxic yellow
- electric white
- occasional neon green / blue

原則:

**アクセントカラーは広告の「警告」「CTA」「危険」を表現するために使う。**

サイト全体をネオンまみれにしない。

## 3.3 Typography

日本語を主役とする。

要求:
- 大きな日本語見出し
- 英字ラベルを補助として使用
- 数字を強く見せる
- 広告UIではサイズ差を意図的に大きくする
- 長文を避ける

Typography hierarchy:

1. Hero statement
2. Ad headline
3. Body
4. Small legal-looking copy
5. Fake advertiser metadata

「広告っぽい小さな注意書き」は演出として積極的に利用する。

---

# 4. Core Interaction Concept

## 4.1 LPそのものを広告地獄にする

通常:

`Hero → Feature → Explanation → CTA`

本プロジェクト:

`Welcome → Ad appears → Close → next explanation → Ad appears → Close → next explanation`

つまり、**広告を閉じる行為がページナビゲーションになる。**

## 4.2 First screen

最初の画面では極端に情報を減らす。

例:

> ようこそ、広告地獄へ。

小さく:

> このサイトでは、広告を閉じないと先に進めません。

CTA:

> ENTER HELL

または

> 地獄へ入る

ユーザーが押した瞬間に最初の広告が出現する。

---

# 5. Ad Popup Design System

広告ポップアップは本サービスの最重要コンポーネント。

## 5.1 Basic anatomy

各広告には可能な限り以下を持たせる。

- advertiser label
- ad headline
- image / abstract visual
- CTA
- fake close button
- real close button
- tiny legal text
- countdown
- close availability indicator
- position
- z-index
- animation state

## 5.2 Important principle

**「広告を完全に再現する」のではなく、「広告UXの嫌なパターンを安全にパロディ化する」。**

実在企業の広告・ロゴ・コピーを模倣しない。

## 5.3 Close interaction

広告ごとに閉じ方を変える。

例:

### Pattern A — Instant Close
普通に×を押せる。

### Pattern B — Delayed Close
3秒待たないと×が有効にならない。

表示:

`閉じるまで 2.7 sec`

### Pattern C — Tiny Close
小さな×。

ただし実際のタップ領域は最低限確保し、ゲームとして不公平にしない。

### Pattern D — Moving Close
×が少し移動する。

### Pattern E — Fake Close
偽×を押すと広告CTAが反応する。

実際の外部サイトへは遷移しない。

### Pattern F — Sticky
スクロールしても広告が付いてくる。

### Pattern G — Respawn
閉じた直後に次の広告が出る。

### Pattern H — Layered
広告を閉じると下から別広告が出る。

---

# 6. Scroll Experience

スクロールは単なるページ移動ではない。

## Stage 0

「ようこそ、広告地獄へ」

↓

## Stage 1

最初の広告ポップアップ。

閉じると:

「広告が邪魔です。」

↓

## Stage 2

別の広告。

閉じると:

「だから、このサイトを作りました。」

↓

## Stage 3

複数広告。

閉じると:

「広告そのものが悪いわけではありません。」

↓

## Stage 4

広告UX評価の説明。

↓

## Stage 5

ゲームへのCTA。

↓

## Stage 6

実サイト診断へのCTA。

この構造により、説明内容そのものが広告体験の中に埋め込まれる。

---

# 7. Escalation

LPを下へ進むほど「広告地獄」が悪化する。

| Section | 状態 |
|---|---|
| Hero | 広告なし |
| Intro | 1 popup |
| Problem | delayed close |
| Explanation | sticky |
| Product | layered popup |
| Game | multiple popup |
| Final CTA | ad hell |

ただし、ユーザーが永遠に閉じ続ける構造にはしない。

各ステージには明確な終了条件を持たせる。

---

# 8. Product Explanation UI

説明は通常のカードではなく、広告として表現する。

例:

### 広告1

`PR`

> Webサイトを見ていたら
> 広告に邪魔されたこと、ありませんか？

[閉じる ×]

### 広告2

`Sponsored`

> その「イラッ」を
> ゲームにしました。

[3秒後に閉じる]

### 広告3

> さらに、
> 実際のWebサイトも診断します。

[サイトを診断する]

---

# 9. CTA Design

CTAも広告風にする。

普通:

`ゲームを始める`

ではなく、

> **今すぐ無料で遊ぶ**

小さく:

`Sponsored by your curiosity`

ただしCTA自体は明確に何をするか分かること。

重要CTA:

- 広告地獄を体験する
- サイトを診断する
- 地獄ランキングを見る

---

# 10. Game Transition

LPの最後は広告地獄の最高潮にする。

例:

画面上に広告が3〜5枚重なる。

最後の広告:

> おめでとうございます。
>
> あなたは広告地獄を
> 体験しました。

[ GAME START ]

ボタンを押すとゲーム本体へ。

この瞬間だけ通常UIに切り替わる。

---

# 11. Motion Requirements

Motionは「おしゃれな演出」ではなく広告UXの再現に使う。

Required:
- popup enter
- popup scale/fade
- abrupt slide-in
- sticky follow
- delayed close countdown
- close animation
- layered reveal
- scroll-linked movement
- subtle background motion

重要:

**アニメーション開始前に内容が理解不能になるほど待たせない。**

---

# 12. Sound / Haptics

MVPでは任意。

将来的には:
- popup sound
- fake notification
- click sound
- error sound
- countdown tick
- haptic feedback

ただし自動再生は禁止。

「広告地獄を批判するサイト自身が、勝手に音を鳴らす」という矛盾を避ける。

---

# 13. Mobile First

最優先デバイスはスマートフォン。

Requirements:
- 片手操作
- popupはviewport内で成立
- close targetはタップ可能
- scroll interruptionが過度にならない
- viewport height変動に対応
- safe-area対応
- landscapeでも破綻しない

Desktopはmobile experienceを拡張する。

---

# 14. Anti-Ads Principle

最重要ルール。

> **このサイト自身が「広告地獄」になってユーザーを本当に不快にさせてはいけない。**

ゲームとしての「不快」は演出する。

しかし以下は禁止:

- 外部サイトへの意図しない遷移
- 実課金
- 個人情報取得
- 強制広告視聴
- 音声自動再生
- ブラウザ操作の妨害
- back button hijack
- 意図しないダウンロード
- 実際のダークパターン
- 永久に閉じられないUI

つまり:

**annoying by design, safe by implementation.**

---

# 15. Information Architecture

LPは以下の順序を基本とする。

1. Welcome
2. First interruption
3. Problem recognition
4. Why this exists
5. What the game does
6. What the evaluator does
7. Real-world ranking / improvement
8. Final challenge
9. Game CTA
10. Audit CTA

---

# 16. Responsive Layout

Desktop:
- floating ads
- wider composition
- multiple overlapping windows
- large typography
- more environmental background

Mobile:
- vertical composition
- larger relative popup
- controlled overlap
- fewer simultaneous elements
- gesture-focused interaction

同じ情報構造を維持する。

---

# 17. Component Architecture

Design components should be data-driven.

Required components:

- `HellHero`
- `AdPopup`
- `FakeCloseButton`
- `DelayedClose`
- `StickyAd`
- `LayeredAd`
- `AdCountdown`
- `AdMeta`
- `HellSection`
- `HellCTA`
- `AdEscalation`
- `GameEntry`
- `AuditEntry`

Ad popup content should be represented as data, not hard-coded component trees.

Example conceptual model:

```ts
type AdPopupConfig = {
  id: string
  pattern: AdPattern
  headline: string
  body?: string
  advertiserLabel?: string
  closeMode: "instant" | "delayed" | "moving" | "fake"
  delayMs?: number
  position: "center" | "corner" | "edge" | "sticky"
  action: "close" | "continue" | "game" | "audit"
}
```

---

# 18. Design Tokens

Tokens should be centralized.

Required token groups:

- background
- surface
- border
- text
- muted text
- danger
- warning
- accent
- typography
- radius
- shadow
- z-index
- motion duration
- easing

Exact values should be tuned during implementation.

---

# 19. Accessibility

Despite the parody, real usability must remain high.

Requirements:
- keyboard navigation
- visible focus
- sufficient contrast
- reduced-motion support
- semantic buttons
- screen-reader labels for close
- no inaccessible fake controls
- no time limit that prevents access to information

If reduced motion is enabled:
- remove aggressive movement
- preserve state changes
- preserve interaction logic

---

# 20. Performance

The design must feel premium without becoming heavy.

Priorities:
1. HTML/CSS interaction
2. lightweight JS
3. CSS animation
4. SVG
5. Canvas
6. WebGL only when it materially improves the experience

Do not add Three.js merely because AMIX uses it.

---

# 21. What Not To Build

Do not turn this into:

- generic SaaS landing page
- generic game landing page
- horror game
- ad blocker landing page
- WebGL technology demo
- neon cyberpunk template
- endless popup annoyance with no purpose

The concept must remain legible:

> **広告を閉じることが、説明を読むことになる。**

---

# 22. Design Acceptance Criteria

LP is considered successful when:

### Concept
- [ ] 5 seconds以内に「広告地獄」が理解できる
- [ ] 30秒以内に「広告を閉じながら説明を読む」構造が理解できる
- [ ] 通常のSaaS LPと明確に違う

### Visual
- [ ] Dark / cinematic
- [ ] 高品質なタイポグラフィ
- [ ] 広告UIが主役
- [ ] 安っぽいパロディになっていない
- [ ] AMIXの「体験品質」は参考にするがコピーにはなっていない

### Interaction
- [ ] Popupが自然に出現する
- [ ] 閉じると次の情報へ進む
- [ ] 3秒待ちなど広告UXの特徴を安全に再現できる
- [ ] スクロールに意味がある
- [ ] モバイルで片手操作できる

### Product
- [ ] Game CTAが自然に理解できる
- [ ] Audit CTAが自然に理解できる
- [ ] LPだけでプロダクトの思想が伝わる

### Trust
- [ ] 本物の広告ではないことが明確
- [ ] 実際の外部遷移や課金が発生しない
- [ ] サイト自身がユーザーを本当に拘束しない

---

# 23. Design North Star

最終的なデザイン判断は以下で行う。

> **「このサイトを見ている人は、説明を読んでいるのか、広告地獄を体験しているのか？」**

理想は、その境界が分からないこと。

そして最後に、

> 「あ、これ自体が広告地獄のデモだったのか。」

と気づかせる。

**本気でふざける。**
**広告UXをパロディにする。**
**でもUXは絶対に壊さない。**
