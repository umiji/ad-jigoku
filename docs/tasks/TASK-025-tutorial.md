# TASK-025 — プレイアブルチュートリアル

- Milestone: M4 / Phase 1
- Depends on: 024
- Size: 1 session

## Objective

GAME §16 のチュートリアルを実装する。**テキストマニュアルにしない。**

## Context

GAME §24「新規プレイヤーが30秒以内に目的を理解する」「マニュアルなしで1ステージクリアできる」。
MVP Acceptance Criteria の Fun セクションの筆頭。

## Files to create

```text
packages/game-engine/src/stage/data/tutorial.json
apps/web/src/game/tutorial/TutorialOverlay.tsx
apps/web/src/game/tutorial/steps.ts
```

## Implementation requirements

1. GAME §16 の4ステップをそのまま:
   - T1: 普通の × が出る → 押す → 「広告、閉じた。」
   - T2: × が動く → 「……逃げた。」
   - T3: 偽 × が出る → 間違える → 「それ広告じゃない。」
   - T4: popup + sticky + fake close → 「ようこそ、広告地獄へ。」
2. `forcedPatterns` を使ったステージ定義で実装する。**チュートリアル専用のコードパスを作らない**
   （同じエンジン・同じ simulator で動くこと）
3. T3 で**わざと間違えさせる**が、失敗にはしない。patience も減らさない
4. コピーは短く、広告風のトーン（DESIGN §13）
5. スキップ可能。ただし初回は既定で表示
6. チュートリアル完了を localStorage に記録
7. チュートリアル中も `reducedMotion` / キーボード操作が効く

## Acceptance criteria

- [ ] 30秒以内に完了する
- [ ] チュートリアル専用のゲームロジックが存在しない（forcedPatterns だけで実現）
- [ ] T3 で間違えても失敗しない
- [ ] スキップできる
- [ ] キーボードだけで完了できる
- [ ] **マニュアルを読まずに Stage 1 がクリアできる**（他人にテストしてもらう）

## Test requirements

- e2e: チュートリアル完走
- スキップの動作
- 専用コードパスがないことのレビュー

## Definition of Done

- acceptance criteria を全て満たす
- 実際に誰かに触ってもらい、30秒以内に理解できたかを記録する
