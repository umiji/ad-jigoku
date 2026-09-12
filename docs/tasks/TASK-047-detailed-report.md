# TASK-047 — 詳細レポートと改善提案

- Milestone: M8 / Phase 3
- Depends on: 046
- Size: 1 session

> Phase 3 のタスクは概要レベル。

## Objective

PRODUCT §9.2 / §10 の詳細レポートを実装する。

## Scope

- パターンごとの分析
- 再現手順
- evidence（スクリーンショット付き）
- 優先順位付き改善提案
- 期待されるスコア改善

## Key requirements

- `ImproveFacet`（PATTERN_SCHEMA §5）から生成する
- **`adFriendlyAlternative` を必ず出す**（PRODUCT §31: `Ads = Bad` ではない）
- PRODUCT §10 の
  `Problem → Evidence → Why → Recommended change → Expected impact → Re-audit` の構造
- 改善の期待値が `expectedSeverityReduction` から計算される

## Acceptance criteria

- [ ] 全 Finding に改善提案が付く
- [ ] 「広告を維持したまま改善する案」が必ず含まれる
- [ ] 期待スコア改善が表示される
- [ ] 優先順位が付いている（effort × impact）

## Definition of Done

- 上記を満たす
