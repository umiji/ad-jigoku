# TASK-048 — 再評価と Before/After

- Milestone: M8 / Phase 3
- Depends on: 047
- Size: 1 session

> Phase 3 のタスクは概要レベル。

## Objective

PRODUCT §11 の Before/After を実装する。**プロダクトの重要機能。**

## Scope

- 再評価の実行
- Before/After の比較表示
- 改善履歴
- 共有可能な Before/After カード

## Key requirements

- **同一シナリオ・同一 scoringVersion での比較のみ**を許す
  （条件の揺れと改善効果を混ぜない / ARCHITECTURE §13）
- 条件が違う場合は比較せず、その旨を表示する
- 改善履歴を残す（PRODUCT §14: スコア変更履歴は可能な限り残す）
- 共有カードは PRODUCT §11 の形式

## Acceptance criteria

- [ ] 再評価ができる
- [ ] Before/After が比較表示される
- [ ] 条件が違う比較が拒否される
- [ ] 履歴が残る
- [ ] 共有できる

## Definition of Done

- 上記を満たす。**M8 完了 = Phase 3（Public Audit）完成**
