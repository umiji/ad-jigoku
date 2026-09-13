---
name: ad-hell-design-system
version: 1.0
product: "ようこそ、広告地獄へ。"
purpose: "Claude Codeが本プロジェクトのUIを実装するときの唯一のビジュアル・インタラクション設計契約"
reference:
  primary: "AMIX"
  secondary: "Japanese browser games / parody sites / mobile games"
  source_urls:
    - "https://amix-design.com/tl/web-g-games/"
    - "https://amix-design.com/tl/town/about.html"
    - "https://amix-design.com/tl/web-motion/"
---

# DESIGN.md

> **これは「雰囲気の参考資料」ではない。UI実装時にClaude Codeが従う設計契約である。**
>
> 新しいUIを作るとき、ここに定義されていない色・フォント・コンポーネント・モーション・レイアウトを勝手に発明しない。
>
> **Core idea: 「広告を閉じることが、説明を読むことになる。」**

---

# 1. Design North Star

## Product experience

このプロダクトは普通のLPではない。

ユーザーは「説明を読む」のではなく、

`WELCOME → AD APPEARS → CLOSE → NEXT INFORMATION → AD APPEARS → CLOSE → ESCALATE`

という体験をする。

LPそのものが「広告地獄」のデモであり、説明UIそのものが広告UIである。

### One unforgettable idea

> **説明が全部、広告として出てくる。**

これを実装上の最優先ルールとする。

---

# 2. Aesthetic Direction

## Name

**Dark Internet Parody × Premium Web Experience**

## Tone

- dark
- cinematic
- mischievous
- slightly sinister
- funny
- internet-native
- polished
- game-like
- intentionally excessive

## The balance

`70% premium design / 30% ridiculous internet chaos`

「バカゲー」だが「雑なバカサイト」にはしない。

AMIXから借りるのは、

- experience-first thinking
- strong visual identity
- worldbuilding
- motion quality
- interaction as navigation
- playful discovery
- premium execution

であり、AMIXの具体的な素材・レイアウト・ロゴ・キャラクターをコピーしない。

---

# 3. Hard Rules

## MUST

1. Mobile-first.
2. Dark visual foundation.
3. Large, confident Japanese typography.
4. Ads are the primary UI metaphor.
5. Important explanations should appear as ad-like surfaces.
6. Closing an ad should usually advance the experience.
7. Visual hierarchy must remain understandable despite chaos.
8. Motion must communicate ad behavior, not exist only as decoration.
9. Use existing design tokens; do not invent near-identical values.
10. Every intentionally annoying interaction must remain safe and reversible.

## MUST NOT

1. Do not build a generic SaaS landing page.
2. Do not use the usual blue/purple AI-SaaS palette.
3. Do not make every element a rounded card.
4. Do not use excessive glassmorphism.
5. Do not use generic dashboard aesthetics.
6. Do not turn the site into a generic cyberpunk/neon template.
7. Do not add 3D/WebGL merely because it looks impressive.
8. Do not copy AMIX assets or proprietary visual elements.
9. Do not use real advertisers or real brands as fake ads.
10. Do not make the actual website maliciously annoying.

---

# 4. Color System

Use semantic roles. Never hard-code arbitrary colors in components.

```yaml
colors:
  bg:
    primary: "#080808"
    secondary: "#111111"
    elevated: "#181818"

  surface:
    popup: "#F4F1EA"
    popup_dark: "#1C1C1C"
    overlay: "rgba(0,0,0,0.72)"

  text:
    primary: "#F5F3EE"
    secondary: "#A8A5A0"
    inverse: "#0A0A0A"

  accent:
    danger: "#FF3B30"
    warning: "#FFD23F"
    electric: "#E8E8E8"
    success: "#7CFF6B"

  border:
    subtle: "rgba(255,255,255,0.12)"
    popup: "rgba(0,0,0,0.18)"
```

### Color roles

- `bg.primary`: global background.
- `bg.secondary`: large environmental sections.
- `surface.popup`: primary parody-ad surface.
- `accent.danger`: dangerous / intrusive / escalation states.
- `accent.warning`: countdowns and fake urgency.
- `accent.success`: completion / escape / improvement.
- `accent.electric`: sparse high-contrast highlights.

### Color constraint

Do not introduce another accent color without a design-system change.

Red should mean **intrusion / danger**, not simply "brand color".

---

# 5. Typography

Typography is one of the primary visual assets.

## Hierarchy

```yaml
type:
  display:
    size: "clamp(3rem, 10vw, 8rem)"
    weight: 800
    line_height: 0.95
    letter_spacing: "-0.04em"

  h1:
    size: "clamp(2.5rem, 7vw, 5rem)"
    weight: 800
    line_height: 1.0

  h2:
    size: "clamp(1.8rem, 4vw, 3.5rem)"
    weight: 700
    line_height: 1.05

  body:
    size: "1rem"
    weight: 400
    line_height: 1.7

  ad_headline:
    size: "clamp(1.2rem, 3vw, 2.4rem)"
    weight: 800
    line_height: 1.05

  ad_meta:
    size: "0.65rem"
    weight: 600
    line_height: 1.2
    letter_spacing: "0.08em"

  ad_legal:
    size: "0.55rem"
    weight: 400
    line_height: 1.35
```

Use a Japanese-capable sans-serif. Prefer a distinctive Japanese grotesk / modern sans over a default system-only appearance.

Do not use more than 3 font families.

Do not use decorative display fonts for ordinary body copy.

## 5.1 Font family（追記提案 2026-09-13 / TASK-002）

> 実装で採用した値。`DESIGN.md` は「日本語対応 sans-serif を 3 ファミリ以下」としか定めて
> いなかったため、実体を 1 つに固定して追記する。オーナーはレビューのうえ承認 / 差し戻しをする。

```yaml
font_family:
  sans: "'M PLUS 2 Variable', 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', 'Noto Sans JP', 'Yu Gothic', Meiryo, system-ui, sans-serif"
```

可変フォント `M PLUS 2 Variable` を 1 ファミリだけ採用し、以降は OS 標準の日本語フォントへ
フォールバックする（`DESIGN_REQUIREMENTS.md §3.3`）。ファミリを増やさない。

---

# 6. Layout System

## Principle

Whitespace is used to make the chaos feel intentional.

The page should contain large quiet areas between bursts of ad activity.

```yaml
spacing:
  unit: 4
  scale: [4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192]
```

## Container

- mobile horizontal padding: `20px`
- desktop horizontal padding: `32px`
- max content width: `1280px`

Do not make every section a centered max-width card.

The environment itself is part of the composition.

---

# 7. Hero

The first screen is deliberately quiet.

### Required

Large headline:

> ようこそ、広告地獄へ。

Supporting copy:

> このサイトでは、広告を閉じないと先に進めません。

Primary CTA:

> 地獄へ入る

The first interaction starts the experience.

### Hero visual

- almost-black background
- large typography
- subtle grain/noise
- sparse warning elements
- no popup until the user commits

The contrast between the quiet hero and the first intrusive ad is intentional.

---

# 8. Ad Popup System

`AdPopup` is a canonical component.

Every ad popup must feel like a believable web advertisement while remaining clearly fictional.

## Anatomy

```text
┌─────────────────────────────┐
│ PR / Sponsored          ×   │
│                             │
│   HEADLINE                  │
│                             │
│   short copy                │
│                             │
│   [ CTA ]                   │
│                             │
│ tiny legal-looking text     │
└─────────────────────────────┘
```

## Required states

```yaml
ad:
  close:
    instant
    delayed
    moving
    fake
  position:
    center
    corner
    edge
    sticky
  lifecycle:
    entering
    visible
    closable
    closing
    closed
    respawning
```

---

# 9. Ad Pattern Mapping

The following patterns are canonical.

| Pattern | Visual behavior | Purpose |
|---|---|---|
| Instant Close | normal × | onboarding |
| Delayed Close | countdown before × | irritation |
| Tiny Close | visually small × | parody |
| Moving Close | × shifts slightly | difficulty |
| Fake Close | fake × triggers decoy | deception parody |
| Sticky Ad | follows viewport | persistence |
| Respawn | another ad appears | escalation |
| Layered Ad | ads stack | chaos |
| Fullscreen | covers content | interruption |
| Layout Shift | content moves | instability |
| Fake Download | CTA looks like download | deceptive UI parody |
| Fake Play | CTA resembles play button | deceptive UI parody |

The actual game pattern catalog remains the source of truth for gameplay behavior.

---

# 10. LP Progression

The visual intensity must increase as the user scrolls.

```text
01 WELCOME
    quiet

02 INTERRUPTION
    one popup

03 ANNOYANCE
    delayed close

04 PERSISTENCE
    sticky popup

05 DECEPTION
    fake close

06 CHAOS
    layered popups

07 AD HELL
    multiple simultaneous interruptions

08 ESCAPE
    clear resolution

09 GAME / AUDIT
    normal product navigation
```

Do not start at maximum chaos.

Escalation is part of the storytelling.

---

# 11. Scroll as Interaction

Scrolling should reveal new behavior.

Examples:

- a popup enters from outside the viewport
- a sticky ad follows
- an ad appears after a threshold
- content shifts slightly
- an ad becomes closable only after 3 seconds
- closing one popup reveals the next

Do not hijack browser scrolling.

The user always retains normal page control.

---

# 12. CTA System

Primary CTA should look like an ad CTA, but its destination must be truthful.

Examples:

- `広告地獄を体験する`
- `サイトを診断する`
- `地獄ランキングを見る`

CTA hierarchy:

```yaml
primary:
  background: "accent.danger"
  text: "text.inverse"

secondary:
  background: "transparent"
  border: "border.subtle"
  text: "text.primary"
```

Avoid pill-shaped CTA buttons unless the ad concept specifically requires them.

Prefer rectangular / slightly irregular ad-like buttons.

---

# 13. Microcopy

Copy should feel like Japanese web advertising parody.

Use:

- `PR`
- `Sponsored`
- `重要なお知らせ`
- `今だけ`
- `あと3秒`
- `閉じる`
- `本当に閉じますか？`
- `おすすめ`
- `あなたにおすすめ`

But do not reproduce actual advertiser copy.

The humor comes from recognizing the pattern.

---

# 14. Motion

Motion is part of the design system.

```yaml
motion:
  fast: "120ms"
  normal: "240ms"
  dramatic: "420ms"
  escalation: "700ms"
```

## Preferred motion

- abrupt slide-in
- subtle scale-in
- delayed appearance
- sticky tracking
- layered reveal
- close collapse
- occasional shake
- scroll-triggered entrance

## Avoid

- constant floating
- excessive parallax
- slow cinematic transitions everywhere
- animation for animation's sake

The motion language should feel like **bad advertising**, executed with **good interaction design**.

## 14.1 Easing（追記提案 2026-09-13 / TASK-013）

> `DESIGN.md §14` は duration しか定義しておらず、`DESIGN_REQUIREMENTS.md §18` が要求する
> "easing" のトークンが存在しなかった。popup の enter / close を実装するには必要なので追記を提案する。
> オーナーはレビューのうえ承認 / 差し戻しをする。

```yaml
motion:
  easing:
    standard: "cubic-bezier(0.2, 0, 0, 1)"
    abrupt: "cubic-bezier(0.4, 0, 1, 1)"
    exit: "cubic-bezier(0.4, 0, 0.2, 1)"
```

- `standard`: 通常の出現・状態変化。終わりだけ強く減速する（premium 側の質感）
- `abrupt`: 「広告が割り込んでくる」動き。加速したまま着地する（§14 abrupt slide-in）
- `exit`: 閉じる / 消える。`close collapse` に使う

3 つより増やさない。増やしたくなったら duration との組み合わせを疑う（§3 MUST 9）。

---

# 15. Depth / Layering

Z-index is part of the storytelling.

```yaml
z_index:
  page: 0
  ambient: 10
  sticky: 100
  popup: 500
  popup_stack: 600
  critical: 800
  system: 1000
```

Use overlapping windows deliberately.

Do not put every component at an arbitrary `z-index: 9999`.

---

# 16. Border / Radius / Shadow

The product should not look like a conventional rounded SaaS UI.

```yaml
shape:
  base_radius: "4px"
  popup_radius: "2px"
  button_radius: "2px"
  card_radius: "6px"
```

Prefer:

- borders
- hard edges
- subtle offsets
- restrained shadows

over:

- huge soft shadows
- 20px+ rounded cards
- glassmorphism
- floating dashboard cards

A popup should feel like a browser ad window, not a SaaS card.

## 16.1 Shadow（追記提案 2026-09-13 / TASK-013）

> `DESIGN.md §16` は shadow を「restrained」という方針だけで値を定義しておらず、
> `DESIGN_REQUIREMENTS.md §18` が要求する shadow トークンが存在しなかった。
> popup / sticky の浮きを実装するには必要なので追記を提案する。
> オーナーはレビューのうえ承認 / 差し戻しをする。

```yaml
shadow:
  popup: "0 2px 0 rgba(0,0,0,0.6), 0 12px 32px rgba(0,0,0,0.45)"
  sticky: "0 -1px 0 rgba(255,255,255,0.08), 0 -8px 24px rgba(0,0,0,0.4)"
```

どちらも「ハードな 1-2px のオフセット + 抑制されたぼかし」の 2 層構成で、
§16 の "borders, hard edges, subtle offsets, restrained shadows" に従う。
`0 24px 80px` のような巨大なぼかしは追加しない（SaaS カードになる）。

影は**色ではなく深度**の表現なので、`§4` の semantic color role は増やさない。
この 2 つより増やさない。

---

# 17. Imagery

Prefer:

1. typography
2. abstract ad graphics
3. fictional product imagery
4. texture
5. iconography
6. 3D only when justified

Avoid stock photography.

Avoid AI-generated "startup people" imagery.

Avoid generic game characters unless a real character system is designed.

---

# 18. AMIX Influence

AMIX is a **design philosophy reference**, not a template.

Borrow:

- high-concept website experience
- worldbuilding
- playful exploration
- strong graphic identity
- motion
- unconventional navigation
- polished execution
- browser-first interaction

Do not borrow:

- exact composition
- logo
- character design
- specific 3D assets
- proprietary graphics
- typography treatment copied directly
- page structure copied section-for-section

The target is:

> **AMIX-level intentionality × Japanese internet parody × ad-UX satire.**

---

# 19. Responsive Rules

## Mobile

Mobile is the primary composition.

- popup width: `calc(100vw - 32px)` maximum
- minimum close target: `44px × 44px`
- avoid simultaneous popups that make the page unusable
- maintain readable type
- preserve safe-area insets
- never require precision dragging

## Desktop

Use the additional width for:

- asymmetric popup placement
- overlapping windows
- environmental typography
- larger negative space
- more simultaneous visual layers

Do not simply stretch the mobile layout.

---

# 20. Accessibility / Safety

This project parodies dark patterns without becoming a real dark pattern.

### NEVER

- trap focus
- trap browser back
- prevent scrolling
- trigger downloads
- open external tabs unexpectedly
- autoplay sound
- collect data through fake UI
- make a button impossible to close
- require a real advertisement view
- use real brand impersonation

### MUST

- keyboard accessible controls
- visible focus state
- reduced-motion support
- semantic buttons
- accessible close labels
- clear action feedback

### Reduced motion

When `prefers-reduced-motion: reduce` is active:

- disable moving close
- remove large transforms
- reduce popup animation
- retain the interaction logic

---

# 21. Component Vocabulary

Prefer these canonical components before creating new ones.

```text
HellHero
HellSection
AdPopup
AdMeta
AdCountdown
FakeCloseButton
DelayedClose
MovingClose
StickyAd
LayeredAd
AdCTA
AdEscalation
HellProgress
EscapePanel
GameEntry
AuditEntry
BrowserFrame
AdSlot
EscapeCard
```

`BrowserFrame` / `AdSlot` / `EscapeCard` は v0.2 で追加された（`docs/design/DECISIONS_v0.2.md` §2, §8.1, §6）。

- `BrowserFrame`: ゲーム領域を包む偽ブラウザ UI。実ブラウザの外観を模倣しない（SAFE-12）
- `AdSlot`: `provider: 'simulated' | 'network'` を持つ広告枠。ルートごとに許可される provider が異なる（§18.5）
- `EscapeCard`: `escape` facet を表示するユーザー向け脱出ノウハウカード

If a new component is needed, first determine whether an existing canonical component can be extended.

Do not create:

`CoolCard`, `ModernCard`, `PremiumCard`, `GlassCard`, `FeatureCard`

unless the design system is explicitly changed.

---

# 22. Data-Driven Ad UI

Ad content and behavior must be data-driven.

Conceptual type:

```ts
type AdPopupConfig = {
  id: string
  pattern: AdPattern
  label: string
  headline: string
  body?: string
  closeMode: "instant" | "delayed" | "moving" | "fake"
  delayMs?: number
  position: "center" | "corner" | "edge" | "sticky"
  action: "close" | "continue" | "game" | "audit"
}
```

The design system defines the visual language.

The pattern catalog defines the behavioral vocabulary.

The game/product requirements define where each pattern is used.

---

# 23. Design QA

After every meaningful UI implementation, Claude Code must perform a DESIGN.md compliance pass.

Check:

- [ ] dark foundation
- [ ] correct semantic colors
- [ ] correct typography hierarchy
- [ ] no arbitrary new colors
- [ ] no generic rounded-card drift
- [ ] no generic SaaS components
- [ ] popup behavior matches the intended ad pattern
- [ ] motion has a purpose
- [ ] mobile remains the primary experience
- [ ] accessibility rules are preserved
- [ ] the UI still feels premium despite the parody

If a rule conflicts with the current implementation, fix the implementation rather than silently redefining the design system.

---

# 24. Final Test

Before considering a page complete, ask:

### 5 seconds
**「これは普通のLPではない」と分かるか？**

### 30 seconds
**「広告を閉じながら説明を読むサイト」だと分かるか？**

### 1 minute
**「広告そのものではなく、広告UXをネタにしている」と分かるか？**

### After leaving
**一番覚えているのが「暗いおしゃれなサイト」ではなく「広告を閉じまくった体験」になっているか？**

If not, the design has failed.

---

# 25. Implementation Instruction

For any UI task:

1. Read this file before implementation.
2. Identify the relevant tokens/components.
3. Reuse canonical components.
4. Implement the smallest coherent surface.
5. Run a DESIGN.md compliance review.
6. Fix violations before declaring the task complete.

**Do not substitute generic Tailwind aesthetics for this design system.**

The desired result is:

> **A beautifully designed website that behaves like a terrible advertisement.**
>
> **Not a terrible website that happens to contain advertisements.**
