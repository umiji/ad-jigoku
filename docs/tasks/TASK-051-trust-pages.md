# TASK-051 — 評価基準公開・方法論・ポリシー

- Milestone: M9 / Phase 4
- Depends on: 049
- Size: 1 session

> Phase 4 のタスクは概要レベル。

## Objective

PRODUCT §23 の信頼性要件を満たすページ群を実装する。

## Scope

- 評価基準の公開（= `AD_UX_PATTERN_CATALOG.md` の Web 版）
- スコア算出方法の説明
- 測定条件（シナリオ）の公開
- 再評価制度 / 異議申立ての説明
- データ削除・修正ポリシー
- 利用規約 / プライバシーポリシー
- Evaluation Version の履歴と変更理由

## Key requirements

- **公開する基準と実際の実装が一致していることを CI が保証する**
  （TASK-004 の parity 検査がここで効く）
- カタログの Markdown からページを生成する。二重管理しない
- Severity が仮説値であることを明示（CATALOG 冒頭の注記 / OD-11）
- スコア式を実際に読める形で公開する

## Acceptance criteria

- [ ] 評価基準がカタログから自動生成されている
- [ ] スコア式が公開されている
- [ ] 測定条件が公開されている
- [ ] 各ポリシーが存在する
- [ ] バージョン履歴が見られる
- [ ] 公開内容と実装の一致が CI で保証されている

## Definition of Done

- 上記を満たす。**M9 完了 = Phase 4（Ranking）完成**
