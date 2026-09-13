# TASK-038 — Probe runner（Playwright / シナリオ実行、GitHub Actions ワーカー）

- Milestone: M7 / Phase 2
- Depends on: 037
- Size: 1 session

> Phase 2 のタスクは概要レベル。
> **v0.2 改訂（`DECISIONS_v0.2.md` §8, D10）**: 実行環境を Fly.io 常駐コンテナから
> **GitHub Actions**（`workflow_dispatch`）に、ストレージを S3 から **Cloudflare R2** に変更する。
> pg-boss は使用しない。

## Objective

GitHub Actions 上で Playwright によりシナリオを実行し、`EvidenceBundle` を R2 に出力する。
**判定は一切しない。**

## Context

`EVALUATOR_DESIGN.md §3, §9`。測定条件を固定して公開する（PRODUCT §22）ため、
シナリオはバージョン付きの明示的な定義にする。

## Scope

- `apps/evaluator-worker/src/probe/`
- `Scenario` 型とシナリオ実行エンジン
- MVP シナリオ `article-read-v1`（`EVALUATOR_DESIGN.md §3`）
- mobile / desktop の2プロファイル
- `attemptCloseAllOverlays` の実装（`§3.1`。CLS-* 群の測定の核心）
- `.github/workflows/probe.yml`（`workflow_dispatch` トリガー。キュー代わり）
- Evidence の Cloudflare R2 アップロード

## Key requirements

- `evaluator-worker` 以外に Playwright が漏れないこと（`check-deps`）
- robots.txt 尊重 / レート制限 / 明示的な User-Agent（`§3.2`）
- タイムアウトで打ち切っても部分 evidence を出せること
- 同一 URL / 同一シナリオで evidence の構造が安定すること
- **pg-boss / Fly.io 常駐コンテナは使用しない**（v0.1 案は却下済み。ADR-008 参照）

## Acceptance criteria

- [ ] 実サイト1つに対して evidence が R2 に出力される
- [ ] `workflow_dispatch` から実行できる
- [ ] mobile / desktop 両方で動く
- [ ] robots.txt で拒否されたサイトで適切に中断する
- [ ] `attemptCloseAllOverlays` が閉じる試行の結果（閉じた/無反応/遷移発生）を記録する
- [ ] 判定ロジックが一切含まれていない（レビュー観点）

## Definition of Done

- 上記を満たす。**スコア計算のコードが1行も入っていないこと**
