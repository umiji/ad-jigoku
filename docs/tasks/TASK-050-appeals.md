# TASK-050 — 異議申立て・訂正フロー

- Milestone: M9 / Phase 4
- Depends on: 049
- Size: 1 session

> Phase 4 のタスクは概要レベル。

## Objective

PRODUCT §14 の異議申立て・訂正を実装する。

## Context

公開ランキングを行う以上、これは**任意機能ではなく必須機能**。
ADR-004（evidence 保存）がここで効く。同一 evidence での再判定を提示できる。

## Scope

- 異議申立てフォーム
- 再評価の実行
- 結果の更新と履歴保持
- 削除要求の受付（PRODUCT §30 D5）

## Key requirements

- 最低限（PRODUCT §14）: 評価対象URL / 評価日時 / 再現条件 / 再評価 / 結果更新 / 履歴保持
- **スコア変更履歴を残す**
- 削除要求に応じて evidence とレポートを消せる
- 対応状況が申立て者から見える

## Acceptance criteria

- [ ] 異議申立てができる
- [ ] 再評価が実行される
- [ ] 履歴が残る
- [ ] 削除要求が処理できる
- [ ] 対応状況が追える

## Definition of Done

- 上記を満たす
