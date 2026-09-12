# TASK-040 — 検出器 1: 幾何・占有・密度

- Milestone: M7 / Phase 2
- Depends on: 039
- Size: 1 session

> Phase 2 のタスクは概要レベル。

## Objective

幾何ベースの決定論的検出器を実装する。

## Scope

`EVALUATOR_DESIGN.md §5.1` のうち:
- `viewport-occupancy` — OBS-01, OBS-03, OBS-04, MOB-01
- `sticky-persistence` — OBS-03, OBS-06, OBS-07
- `close-geometry` — CLS-01, CLS-06, CLS-09, CLS-13
- `ad-density` — OBS-09, OBS-10

## Key requirements

- 純粋関数（`EvidenceBundle → Finding[]`）。Playwright を import しない
- 「広告である」の判定は `EVALUATOR_DESIGN.md §5.2` の3段階シグナルに従う。
  **弱いシグナルだけで断定しない**
- 各 Finding が `measured` と `evidence` を持つ（PRODUCT §8）
- フィクスチャ（TASK-039）に対する precision / recall を測る

## Acceptance criteria

- [ ] 4検出器が実装され、フィクスチャで検出される
- [ ] ネガティブケースで誤検出しない
- [ ] 全 Finding が evidence 参照を持つ
- [ ] Playwright を import していない

## Definition of Done

- 上記を満たし、精度数値が記録されている
