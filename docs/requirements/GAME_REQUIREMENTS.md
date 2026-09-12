# GAME_REQUIREMENTS.md

## 0. Document Status

- Status: Draft v0.1
- Scope: Game layer only
- Source of truth for UX patterns: `AD_UX_PATTERN_CATALOG.md`
- Implementation target: Web game, initially desktop/mobile browser
- Core principle: **「広告を閉じるゲーム」ではなく、「広告地獄を生き抜き、叩き潰すゲーム」にする。**

---

# 1. Game Concept

## 1.1 Working Title

**ようこそ、広告地獄へ。**

Sub-title / positioning:

> 「記事を読みたいだけなのに。」

Player experiences exaggerated versions of real-world hostile ad UX and tries to complete a simple goal while surviving increasingly absurd interruptions.

The game is a parody of bad web advertising UX.

It should produce:

- 「あー、これあるわw」
- 「クソ広告きたw」
- 「今のは無理だろw」
- 「あと1回だけやる」
- 「このパターン、現実でも嫌い」

The game must not feel like a UX testing tool disguised as a game.

---

# 2. Product Goal

## 2.1 Primary Goal

Create a game that makes players enjoyably experience and recognize bad ad UX.

## 2.2 Secondary Goals

The game should:

1. Make common ad UX failures memorable.
2. Create shareable moments.
3. Generate a natural bridge to the real-world Ad UX evaluation service.
4. Create a reusable game simulation layer based on `AD_UX_PATTERN_CATALOG.md`.

## 2.3 Non-Goals

The MVP is NOT:

- an actual ad network
- a real advertisement deployment system
- a browser ad blocker
- a realistic simulation of every advertising technology
- a benchmark that claims scientific UX measurement
- a game whose primary mechanic is repeatedly clicking tiny close buttons

Actual deceptive advertisements must never be deployed as part of the game.

All hostile ad behavior is simulated locally.

---

# 3. Player Fantasy

The player is:

> **「広告地獄に放り込まれた一般ユーザー」**

The player has one simple objective:

> **読みたいコンテンツを最後まで読み切る。**

But the page keeps trying to stop them.

As the player progresses, they learn to:

- recognize dangerous patterns
- anticipate interruptions
- react quickly
- distinguish legitimate UI from deceptive UI
- prioritize which interruption to deal with
- maintain control under pressure

The emotional arc is:

**普通に読む → 邪魔される → キレる → 慣れる → 見切る → 完全攻略する**

---

# 4. Core Gameplay Loop

## 4.1 10–30 Second Micro Loop

Each encounter follows:

1. Player attempts to read / interact with content.
2. An ad UX pattern appears.
3. Player identifies what is happening.
4. Player chooses or performs the appropriate response.
5. The page reacts.
6. Another pattern appears.
7. Difficulty escalates.
8. Player reaches a checkpoint or fails.

The important point:

**The game is about maintaining control, not merely closing ads.**

---

# 5. Core Game Mechanic

## 5.1 Three Player Objectives

Every stage tracks three resources:

### A. Progress

How close the player is to completing the content.

### B. Time

How long the player takes.

### C. Patience

A finite resource representing tolerance for hostile UX.

Bad UX reduces patience.

Very bad UX can cause instant failure.

This creates a meaningful tradeoff:

> 「急いで処理するか、多少時間をかけて安全に処理するか」

---

# 6. Player Actions

The MVP should have a small but expressive action set.

### Primary

- Click
- Tap
- Scroll
- Drag
- Wait
- Back / escape
- Focus content

### Countermeasure actions

The exact UI can be styled as game mechanics rather than real browser controls.

Examples:

- **SMASH** — destroy the currently hostile ad
- **DODGE** — avoid a moving ad
- **FOCUS** — temporarily protect the content area
- **REPORT** — flag a deceptive pattern
- **ESCAPE** — recover from a takeover

Not every action should work on every pattern.

The player should learn the correct response.

---

# 7. Skill Expression

The game must reward skill rather than pure reaction speed.

## 7.1 Recognition

Player recognizes:

- fake close
- moving close
- popup
- sticky video
- autoplay sound
- fake download
- layout shift
- ad respawn
- multi-layer popup
- etc.

## 7.2 Reaction

Correct action must be performed quickly.

## 7.3 Prediction

Advanced players anticipate:

- popup timing
- respawn
- movement
- pattern combinations

## 7.4 Prioritization

Multiple problems can exist simultaneously.

Player decides:

> 「今どれを処理するのが一番危険か？」

This is more important than simply clicking the nearest button.

---

# 8. Why Players Replay

Replayability must come from several independent sources.

## 8.1 Randomized Ad Hell

Each run can combine different patterns.

Example:

- Run A: Popup → Sticky → Fake Close
- Run B: Autoplay Sound → Layout Shift → Respawn
- Run C: Fake Download → Popup → Multi-layer Popup

The player cannot memorize one fixed sequence.

## 8.2 Score Optimization

Score is based on:

- completion time
- damage taken
- unnecessary actions
- false clicks
- combo handling
- streak
- remaining patience

## 8.3 Pattern Mastery

Each pattern has a mastery level.

Example:

- Seen
- Survived
- Clean
- Perfect

This encourages players to understand the entire catalog.

## 8.4 Difficulty

Higher difficulties introduce:

- faster timing
- smaller safe areas
- more simultaneous patterns
- stronger combinations
- less warning
- more deceptive UI

## 8.5 Challenge Seeds

A run can have a reproducible seed.

This enables:

> 「この広告地獄、誰が一番うまく抜けられる？」

Potential future leaderboard feature.

---

# 9. Scoring

## 9.1 Base Score

Score should reward completion and penalize hostile UX exposure.

Conceptual model:

`Score = Completion Score + Speed Bonus + Accuracy Bonus + Combo Bonus + Survival Bonus - Damage Penalty - Time Penalty`

Do NOT directly equate higher UX severity with higher player reward.

The player's achievement is surviving difficult situations.

## 9.2 Clean Play Bonus

Reward:

- no false clicks
- no unnecessary actions
- no patience loss
- fast completion

## 9.3 Rage Bonus

A deliberate parody mechanic.

If the player successfully destroys several hostile patterns in succession:

> **RAGE MODE**

The screen can become increasingly absurd.

This should feel satisfying without becoming visually unreadable.

---

# 10. Combo System

Combos are important because individual ad patterns become more fun when composed.

Example:

### Combo: 「閉じさせる気がない」

- Popup
- Fake Close
- Delayed Close

### Combo: 「逃げても無駄」

- Sticky
- Popup
- Respawn

### Combo: 「何を押してるんだ」

- Fake Download
- Fake Play
- Invisible Click Zone

### Combo: 「広告地獄」

- Full-screen takeover
- Autoplay Sound
- Moving Close
- Respawn

Combo names should be humorous.

The catalog's Compound/Combo Patterns should be used as source data.

---

# 11. Difficulty Model

Difficulty is separate from UX severity.

Use the catalog's Game Difficulty value as the initial input.

Conceptual:

`Stage Difficulty = Pattern Difficulty + Interaction Complexity + Uncertainty + Time Pressure + Combo Complexity`

Do not simply use:

`Stage Difficulty = UX Severity`

A highly annoying but predictable ad can be easy to play.

A moderately annoying but unpredictable interaction can be difficult.

---

# 12. Stage Structure

## 12.1 Stage 1 — 「まだ普通のサイト」

Purpose:

- onboarding
- introduce basic interruption

Patterns:

- simple popup
- sticky ad
- basic close

Player learns the basic controls.

## 12.2 Stage 2 — 「ちょっと邪魔」

Introduce:

- delayed close
- autoplay video
- layout shift
- multiple ads

## 12.3 Stage 3 — 「なんかおかしくない？」

Introduce:

- fake close
- fake play
- fake download
- moving UI

## 12.4 Stage 4 — 「広告地獄」

Introduce combinations.

## 12.5 Stage 5 — 「脱出不能」

Introduce:

- respawn
- multi-layer popup
- full-screen takeover
- timing pressure
- multiple simultaneous threats

## 12.6 Endless Mode

After the core progression is complete:

> Survive as long as possible.

Patterns continuously escalate.

---

# 13. Content / Pattern Generation

The game must not hard-code every stage manually.

Use:

`AD_UX_PATTERN_CATALOG.md`

as the canonical pattern source.

Each game encounter should be generated from pattern definitions containing at least:

- pattern ID
- UX severity
- game difficulty
- category
- required interaction
- timing behavior
- uncertainty
- compatible combinations
- incompatible combinations
- visual simulation type

Future implementation should load this as structured data.

Recommended future data format:

`data/ad-ux-patterns.json`

Markdown remains the human-readable source/design document.

---

# 14. Pattern → Game Mechanic Mapping

Every catalog pattern must eventually define:

| Field | Purpose |
|---|---|
| `pattern_id` | Catalog reference |
| `game_mechanic` | What happens in game |
| `player_action` | Correct response |
| `failure_condition` | What counts as failure |
| `warning` | Whether warning is shown |
| `timing` | Spawn / delay / duration |
| `difficulty` | Game difficulty |
| `combo_tags` | Compatible combinations |
| `visual_type` | Simulation implementation |
| `score_effect` | Score impact |
| `patience_effect` | Patience damage |

This allows the game engine to become data-driven.

---

# 15. Fairness Rules

The game can be intentionally unfair-looking, but must be mechanically fair.

## 15.1 Every Failure Must Be Explainable

After failure, the player should understand:

> 「今のは○○パターンにやられた」

## 15.2 No Impossible Input

Do not require:

- physically impossible reaction times
- inaccessible controls
- ambiguous outcomes without feedback

unless explicitly introduced as a joke mode.

## 15.3 Deception Must Be Learnable

Fake UI is acceptable.

But players must be able to learn its tell.

## 15.4 Difficulty Must Be Observable

Higher difficulty should come from:

- speed
- combinations
- uncertainty
- simultaneous threats

not arbitrary hidden rules.

---

# 16. Tutorial

Tutorial should be playable, not a text manual.

Example:

### Tutorial 1

A normal close button appears.

Player clicks it.

> 「広告、閉じた。」

### Tutorial 2

Close button moves.

> 「……逃げた。」

### Tutorial 3

Fake close appears.

Player clicks wrong target.

> 「それ広告じゃない。」

### Tutorial 4

Popup + sticky + fake close.

> 「ようこそ、広告地獄へ。」

Then the game begins.

---

# 17. UX / Presentation Direction

The visual design should intentionally resemble a familiar web page.

However:

- game UI should remain readable
- real brands should not be required
- simulated ads should use fictional content
- no real ad network code
- no real tracking scripts
- no real deceptive outbound links

The humor comes from recognizable UX patterns.

---

# 18. Catharsis

Catharsis is a core requirement.

The player should eventually be able to:

> **「うざい広告を合法的にゲーム内でぶっ壊す。」**

Possible effects:

- smash animation
- screen shake
- combo explosion
- rage meter
- humorous sound
- “BLOCKED” stamp
- score burst

The game should not encourage actual attacks against websites or advertisers.

The target of the joke is the UX pattern.

---

# 19. Game Modes

MVP:

1. **Story / Progression**
2. **Endless**

Post-MVP:

3. **Daily Challenge**
4. **Seed Challenge**
5. **Speedrun**
6. **Pattern Challenge**
7. **Worst UX Challenge**

Potential future mode:

### Real Site Challenge

A sanitized snapshot of a real site's UX behavior is converted into a game stage.

This requires separate legal, technical, and data-governance requirements and is NOT part of MVP.

---

# 20. Results Screen

After each run:

### Primary

- Clear / Failed
- Score
- Time
- Patience remaining

### Secondary

- Patterns encountered
- Patterns defeated
- Mistakes
- Best combo
- Personal best

### Educational element

Example:

> **今回の主犯**
>
> 「Fake Close」
>
> 閉じるためのUIに見せかけて別の操作を誘導するパターン。

This is where the game begins connecting entertainment to UX education.

---

# 21. Shareability

The result screen should produce a compact shareable summary.

Example:

> **広告地獄 Lv.7 脱出成功**
>
> 00:48.21
> 14パターン突破
> ノーミス
>
> 主犯：Fake Close × Respawn
>
> 「広告を閉じたら、広告が増えた。」

Potential share formats:

- screenshot
- URL to seeded challenge
- short result text

Do not make social sharing a prerequisite for core gameplay.

---

# 22. Real-World Service Connection

The game should naturally lead to:

> 「じゃあ、このサイトは実際どれくらい広告UXが悪いの？」

Possible CTA:

**「あなたのサイトを広告地獄チェック」**

This leads to the separate Ad UX evaluation product.

The game itself must not pretend that game score equals real-world UX score.

The relationship is:

`Game Pattern Knowledge → UX Awareness → Real Site Evaluation`

---

# 23. MVP Definition

The first playable MVP should contain:

### Core

- 1 playable page
- 10–15 high-quality ad UX patterns
- pattern-driven spawning
- click / tap / scroll interaction
- patience
- progress
- score
- failure / success
- restart
- basic results screen

### Required patterns

Recommended first set:

1. Popup
2. Sticky Bottom
3. Delayed Close
4. Moving Close
5. Fake Close
6. Autoplay Video
7. Autoplay + Sound
8. Layout Shift
9. Full-screen Overlay
10. Respawning Ad
11. Fake Download
12. Fake Play
13. Multi-layer Popup
14. Ad Density Hell
15. Sticky + Popup combo

### Explicit MVP exclusion

Do NOT attempt to implement all ~80 catalog patterns initially.

The first milestone is:

> **「10分触れば、もう一回やりたくなる」**

not:

> 「80種類実装した。」

---

# 24. MVP Acceptance Criteria

The MVP is acceptable only if:

### Fun

- A new player understands the basic objective within 30 seconds.
- A new player can complete at least one stage without reading a manual.
- Failure produces a clear understanding of what happened.
- Restart takes almost no time.
- The second run meaningfully differs from the first.

### Variety

- At least 10 patterns can appear.
- At least 3 meaningful pattern combinations exist.
- Pattern selection is not completely predictable.

### Skill

- Better recognition improves performance.
- Faster reactions improve performance.
- Random clicking is not an optimal strategy.

### Catharsis

- Successful handling feels rewarding.
- The player can visibly neutralize hostile patterns.

### Product connection

- Results identify encountered UX patterns.
- The game can eventually link those patterns to the real Ad UX evaluation system.

---

# 25. Technical Design Principles

## 25.1 Data Driven

Game logic should consume structured pattern definitions.

## 25.2 Deterministic Seeds

Random runs should be reproducible by seed.

## 25.3 Simulation Only

No real ad network integration.

## 25.4 Testable

Each pattern should be independently testable.

## 25.5 Extensible

Adding a new catalog pattern should not require rewriting the game engine.

Desired flow:

`Add Pattern Definition → Register Visual/Interaction Handler → Automatically Available to Stage Generator`

---

# 26. Separation of Concerns

The project should maintain three distinct layers.

### Layer 1 — Pattern Knowledge

`AD_UX_PATTERN_CATALOG.md`

Defines:

> What is bad UX?

### Layer 2 — Game Rules

`GAME_REQUIREMENTS.md`

Defines:

> How does bad UX become fun gameplay?

### Layer 3 — Implementation Tasks

Future task files define:

> How do we build it?

Do not mix implementation details into the catalog.

Do not put UX evaluation formulas into the game rules unless required for gameplay.

---

# 27. Future Task Artifact Structure

The final project documentation should eventually contain:

```text
docs/
├── requirements/
│   ├── AD_UX_PATTERN_CATALOG.md
│   ├── GAME_REQUIREMENTS.md
│   └── PRODUCT_REQUIREMENTS.md
│
└── tasks/
    ├── TASK-001-project-foundation.md
    ├── TASK-002-pattern-data-model.md
    ├── TASK-003-game-state.md
    ├── TASK-004-ad-simulation-engine.md
    ├── TASK-005-pattern-popup.md
    ├── ...
    └── TASK-XXX-results-and-replay.md
```

Each task must be independently understandable by Claude Code.

---

# 28. Task Granularity Rule

One task = one independently executable unit.

A task should have:

- Objective
- Context
- Preconditions
- Files to create/change
- Exact implementation requirements
- Acceptance criteria
- Test requirements
- Dependencies
- Definition of Done

A task must NOT say:

> 「ゲーム部分を実装する」

Instead:

> 「PatternDefinition型とJSONローダーを実装し、指定された14項目を読み込める状態にする」

---

# 29. Implementation Order

The eventual Claude Code task list should broadly follow:

1. Project foundation
2. Pattern data schema
3. Pattern catalog → structured data conversion
4. Game state
5. Stage generator
6. Base interaction engine
7. Basic ad visual system
8. Popup
9. Sticky
10. Delayed close
11. Moving close
12. Fake close
13. Autoplay video/sound simulation
14. Layout shift
15. Full-screen overlay
16. Respawn
17. Fake download/play
18. Multi-layer popup
19. Combo system
20. Difficulty system
21. Score system
22. Patience system
23. Progression
24. Results screen
25. Replay / seed
26. Endless mode
27. Tutorial
28. Polish / audio / effects
29. Automated tests
30. Production build / deployment

This is a planning order, not yet the final task list.

---

# 30. Design Decisions Still Open

These should be resolved before implementation where they materially affect architecture.

### Q1. Primary input model

A. Mouse/touch simulation  
B. Browser-like cursor interaction  
C. Hybrid

**Current recommendation: C.**

### Q2. Destruction mechanic

A. Literal clicking/closing  
B. Dedicated “SMASH” action  
C. Contextual actions

**Current recommendation: C with a strong SMASH/catharsis presentation.**

### Q3. Content objective

A. Read article
B. Find information
C. Complete a task
D. Hybrid

**Current recommendation: D.**

### Q4. Failure

A. Patience reaches zero
B. Time limit
C. Both

**Current recommendation: C, with patience as the primary fail state.**

### Q5. Real-site data in game

**MVP: No.**

Use fictional/local simulations first.

---

# 31. Success Definition

The game succeeds if a player says:

> 「広告ウザいって思ったことある人なら、これ絶対わかる。」

and then:

> 「もう一回やる。」

The second sentence is the most important KPI for the game.

---

# 32. Core Principle

> **広告を閉じることをゲームにするのではない。**
>
> **「ユーザーの時間と注意を奪うUX」を、プレイヤーが見抜き、避け、叩き潰す体験をゲームにする。**

The game layer should remain fun even if the player never visits the real-world Ad UX evaluation service.

The service layer should benefit from the game, but must not be required to make the game enjoyable.
