# TASK-043 — スコアラーとバージョニング

- Milestone: M7 / Phase 2
- Depends on: 040-042
- Size: 1 session

> Phase 2 のタスクは概要レベル。

## Objective

`CATALOG §3` の式を実装し、`ARCHITECTURE.md §13` のバージョニングを成立させる。

## Scope

- `packages/evaluator-core/src/scoring/`
- `ScoreBreakdown`（`EVALUATOR_DESIGN.md §6`）
- Frequency Multiplier / Viewport Impact / Interaction Penalty / Compound Penalty / Time Cost
- 正規化関数（`§6.1`。K は実測後に決定）
- 複数 `scoringVersion` の共存

## Key requirements

- **純粋関数。** 同じ Finding[] から常に同じスコア
- 内訳が全て取得できる（PRODUCT §8 Evidence-First）
- `confidence: 'vision'` は `scoreContributing: false` として除外し、
  `excluded` に理由付きで記録（`EVALUATOR_DESIGN.md §9.3`）
- 保存済み evidence に対して任意の `scoringVersion` を適用できる
- **異なる scoringVersion のスコアを比較できないようにする**（型か API で）

## Acceptance criteria

- [ ] `CATALOG §3` の式が実装されている
- [ ] 内訳が全項目取得できる
- [ ] 保存済み evidence から再スコアできる（再クロールなし）
- [ ] 複数バージョンが共存できる
- [ ] Vision Finding がスコアに入らない
- [ ] 正規化関数が単調（改善が必ず点数に反映される）

## Definition of Done

- 上記を満たし、**severity を1つ変えて全履歴を再計算するデモが動く**（ADR-004 の実証）
