# TASK-044 — 検出精度ハーネス（precision/recall CI）

- Milestone: M7 / Phase 2
- Depends on: 043
- Size: 1 session

> Phase 2 のタスクは概要レベル。

## Objective

フィクスチャに対する検出精度を測り、CI で回帰を検出する。

## Context

`EVALUATOR_DESIGN.md §7`。**公開ランキングをやるなら誤検出は検出漏れより致命的**（PRODUCT §23）。

## Scope

- `packages/evaluator-core/test/accuracy/`
- パターン別 precision / recall / 測定値の誤差
- ネガティブケースでの誤検出率
- 精度レポートの出力（CI のアーティファクト）

## Key requirements

- 実サイトを回帰テストに使わない（向こうが勝手に変わる）
- **精度が閾値を下回ったら CI を落とす**
- calibration set（手動アノテーション済みスナップショット）の枠組みを用意する

## Acceptance criteria

- [ ] パターン別の精度が出る
- [ ] 精度低下で CI が落ちる
- [ ] ネガティブケースの誤検出率が閾値以下
- [ ] 精度レポートが読める形で出力される

## Definition of Done

- 上記を満たす。**M7 完了 = Phase 2（Pattern Evaluation Engine）完成**
