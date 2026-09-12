# TASK-045 — 監査ジョブパイプラインと API

- Milestone: M8 / Phase 3
- Depends on: 043
- Size: 1 session
- **DECISIONS_v0.2.md §8 により改訂**: ジョブキューは pg-boss ではなく **GitHub Actions
  `workflow_dispatch`**。常駐ワーカー（Fly.io 等）は前提にしない

> Phase 3 のタスクは概要レベル。

## Objective

`URL → Audit → Score → Report` のジョブパイプラインを実装する。

## Scope

- DB スキーマ（`ARCHITECTURE.md §12.2`。Neon または D1、OD-8 で未確定）
- **GitHub Actions `workflow_dispatch` によるジョブキュー**（pg-boss / Fly.io 常駐は使わない）
- `POST /api/audit`（Actions を起動）/ `GET /api/audit/:id`（status ポーリング）
- Actions workflow でのジョブ実行、結果とEvidenceの Cloudflare R2 への保存
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
