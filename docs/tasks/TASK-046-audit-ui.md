# TASK-046 — 監査 UI（URL入力 → 進捗 → レポート）

- Milestone: M8 / Phase 3
- Depends on: 045
- Size: 1 session

> Phase 3 のタスクは概要レベル。

## Objective

PRODUCT §9.1 の Basic Report を表示する UI を実装する。

## Scope

- URL 入力
- 進捗表示（測定中に何をしているか見せる。待ち時間の体感を下げる）
- Basic Report（`EVALUATOR_DESIGN.md §8.1`）
- mobile / desktop の比較表示

## Key requirements

- **`DESIGN.md` に準拠する。** LP とゲームと同じ世界観
- ただし**レポートではユーモアより客観性を優先**（DESIGN_REQ §24）
- 「指定条件下での自動評価」であることを明示（PRODUCT §22）
- スコアが仮説値ベースであることを適切に表示（OD-11）
- 検出根拠（evidence）が必ず見える（PRODUCT §8）
- **AI 判定（Vision detector）は有料診断のみで実行する**（`DECISIONS_v0.2.md` §8, D10 /
  `EVALUATOR_DESIGN.md §6`）。本タスクの Basic Report は決定論的検出（Layer 2）のみで構成し、
  Vision advisory を無料スコアに混ぜない

## Acceptance criteria

- [ ] URL を入れてレポートが見られる
- [ ] 全 Finding に根拠が表示される
- [ ] 測定条件が表示される
- [ ] mobile / desktop の差が見える
- [ ] `DESIGN.md §23` コンプライアンスパス実施済み

## Definition of Done

- 上記を満たす。**「UXが悪いです」だけを返していない**（PRODUCT §8 の禁止事項）
