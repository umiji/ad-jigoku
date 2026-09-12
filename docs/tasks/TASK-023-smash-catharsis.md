# TASK-023 — SMASH とカタルシス演出

- Milestone: M4 / Phase 1
- Depends on: 017-022
- Size: 1 session

## Objective

GAME §18 のカタルシスを実装する。
**「うざい広告を合法的にゲーム内でぶっ壊す」体験がこのゲームの報酬。**

## Context

GAME §18 は Catharsis を **core requirement** と明記している。
ここが弱いと「ただ不快なだけのゲーム」になり、Second-run rate（最重要KPI）が死ぬ。

## Files to create

```text
apps/web/src/game/effects/SmashEffect.tsx
apps/web/src/game/effects/ScreenShake.tsx
apps/web/src/game/effects/BlockedStamp.tsx
apps/web/src/game/effects/RageOverlay.tsx
apps/web/src/game/effects/particles.ts       Canvas（演出のみ / ADR-003 の例外）
```

## Implementation requirements

1. `Effect` を宿主で実行する（`GAME_ENGINE_DESIGN.md §10`）。
   **演出にゲームロジックを持たせない**
2. SMASH:
   - 広告が砕ける。破片が飛ぶ（Canvas パーティクル）
   - 「BLOCKED」スタンプ
   - スコアバースト
   - 短い screen shake
   - **手応えが最優先。** 240ms 以内に全部が始まること（DESIGN §14 `normal`）
3. RAGE MODE:
   - chain が閾値を超えると画面が派手になる
   - **ただし読めなくならない**（GAME §9.3 の但し書き）。本文とHUDの可読性を維持
   - level に上限（TASK-011 で実装済み）
4. `reducedMotion`:
   - shake / パーティクルを止める
   - **代わりに色・スタンプ・スコア表示で手応えを出す。** 満足感をゼロにしない
5. Canvas は演出専用。ゲームロジック・入力判定を持たせない（ADR-003）
6. 性能: パーティクルの上限数を設け、低スペック端末で fps が落ちたら自動的に削減

## Acceptance criteria

- [ ] 広告を破壊したときに明確な手応えがある（プレイテストで確認）
- [ ] 演出中も本文と HUD が読める
- [ ] `reducedMotion` でも達成感がある
- [ ] Canvas にゲームロジックがない
- [ ] 60fps を維持する（中位端末で計測）
- [ ] 演出は 240ms 以内に始まる
- [ ] **演出が実際のダークパターンになっていない**（画面を占拠して操作不能にしない）

## Test requirements

- 性能テスト（パーティクル最大時の fps）
- reducedMotion での演出差分テスト
- 演出中に操作を受け付けることの e2e

## Definition of Done

- acceptance criteria を全て満たす
- 「これは気持ちいいか」を実際に触って評価し、結果を PR に書く
