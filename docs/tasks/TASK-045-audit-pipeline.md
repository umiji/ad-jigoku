# TASK-045 — 監査ジョブパイプラインと API

- Milestone: M8 / Phase 3
- Depends on: 043
- Size: 1 session

> Phase 3 のタスクは概要レベル。

## Objective

`URL → Audit → Score → Report` のジョブパイプラインを実装する。

## Scope

- Postgres スキーマ（`ARCHITECTURE.md §12.2`）
- pg-boss によるジョブキュー
- `POST /api/audit` / `GET /api/audit/:id`
- worker のジョブ消費
- 同一ドメインの同時実行制限とクールダウン

## Key requirements

- 全 run に4つのバージョンを刻印（`ARCHITECTURE.md §13`）
- 失敗理由をユーザーに見せる（robots 拒否 / タイムアウト / 到達不能）
- アカウント不要（PRODUCT §30 D3: basic audit は no account）
- 濫用対策（レート制限）

## Acceptance criteria

- [ ] URL を投げるとレポートまで到達する
- [ ] 同一ドメインの同時実行が1本に制限される
- [ ] バージョンが全て記録される
- [ ] 失敗理由が返る

## Definition of Done

- 上記を満たす
