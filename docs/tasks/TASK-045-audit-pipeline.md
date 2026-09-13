# TASK-045 — 監査ジョブパイプラインと API

- Milestone: M8 / Phase 3
- Depends on: 043, 038
- Size: 1 session

> Phase 3 のタスクは概要レベル。
> **v0.2 改訂（`DECISIONS_v0.2.md` §8, D10）**: ジョブキューを pg-boss から
> **GitHub Actions `workflow_dispatch`** に変更する。pg-boss / Fly.io の記述は削除する。

## Objective

`URL → Audit → Score → Report` のジョブパイプラインを実装する。

## Scope

- Postgres (Neon) または D1 スキーマ（`ARCHITECTURE.md §12.2`。DB 自体は OD-8 で Phase 2 決定）
- **GitHub Actions `workflow_dispatch` によるジョブキュー**（TASK-038 の probe ワーカーを呼び出す）
- `POST /api/audit` / `GET /api/audit/:id`
- worker（Actions run）のジョブ消費
- 同一ドメインの同時実行制限とクールダウン（Actions の concurrency グループで制御）

## Key requirements

- 全 run に4つのバージョンを刻印（`ARCHITECTURE.md §13`）
- 失敗理由をユーザーに見せる（robots 拒否 / タイムアウト / 到達不能）
- アカウント不要（PRODUCT §30 D3: basic audit は no account）
- 濫用対策（レート制限）
- **pg-boss / Fly.io 常駐コンテナは使用しない**（ADR-008 参照）

## Acceptance criteria

- [ ] URL を投げるとレポートまで到達する
- [ ] 同一ドメインの同時実行が1本に制限される
- [ ] バージョンが全て記録される
- [ ] 失敗理由が返る

## Definition of Done

- 上記を満たす
