# TASK-042 — 検出器 3: メディア・レイアウト・複合

- Milestone: M7 / Phase 2
- Depends on: 039
- Size: 1 session

> Phase 2 のタスクは概要レベル。

## Objective

メディア・レイアウト系の検出器と、`COM-*` の合成検出器を実装する。

## Scope

- `autoplay-media` — ATT-01, ATT-02
- `layout-stability` — LAY-01, LAY-03
- `compound` — COM-*（**他の Finding を入力に取る二段階検出器**）

## Key requirements

- `compound` は `PatternDefinition.composedOf` の全構成要素が検出されたときに
  合成 Finding を立てる（PATTERN_SCHEMA §10 の Open Question 1 の方針）
- `layout-stability` は Performance API の実測 CLS を使う
  （**ADR-006 は自サイトの話。実サイト測定では本物の CLS を測る**）
- `autoplay-media` はユーザー操作なしの `play()` / audio を検出

## Acceptance criteria

- [ ] 3検出器が実装される
- [ ] `compound` が構成要素から正しく合成 Finding を立てる
- [ ] CLS の実測値が Finding に入る
- [ ] ネガティブケースで誤検出しない

## Definition of Done

- 上記を満たし、**MVP 対象の10-15パターンの検出が揃う**（PRODUCT §25 Phase 2 完了条件）
