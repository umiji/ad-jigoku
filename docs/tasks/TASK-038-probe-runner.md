# TASK-038 — Probe runner（Playwright / シナリオ実行）

- Milestone: M7 / Phase 2
- Depends on: 037
- Size: 1 session
- **DECISIONS_v0.2.md §8 により改訂**: 実行環境は常駐ワーカーではなく **GitHub Actions**
  （`workflow_dispatch` がキュー代わり）。Evidence の保存先は S3 ではなく **Cloudflare R2**

> Phase 2 のタスクは概要レベル。

## Objective

Playwright でシナリオを実行し、`EvidenceBundle` を出力する。**判定は一切しない。**

## Context

`EVALUATOR_DESIGN.md §3`。測定条件を固定して公開する（PRODUCT §22）ため、
シナリオはバージョン付きの明示的な定義にする。

## Scope

- `apps/evaluator-worker/src/probe/`（GitHub Actions のジョブとして実行される想定。常駐プロセスにしない）
- `Scenario` 型とシナリオ実行エンジン
- MVP シナリオ `article-read-v1`（`EVALUATOR_DESIGN.md §3`）
- mobile / desktop の2プロファイル
- `attemptCloseAllOverlays` の実装（`§3.1`。CLS-* 群の測定の核心）
- 収集した EvidenceBundle を Cloudflare R2 にアップロードする処理（`EVALUATOR_DESIGN.md §9`）

## Key requirements

- `evaluator-worker` 以外に Playwright が漏れないこと（`check-deps`）
- robots.txt 尊重 / レート制限 / 明示的な User-Agent（`§3.2`）
- タイムアウトで打ち切っても部分 evidence を出せること
- 同一 URL / 同一シナリオで evidence の構造が安定すること

## Acceptance criteria

- [ ] 実サイト1つに対して evidence が出力される
- [ ] mobile / desktop 両方で動く
- [ ] robots.txt で拒否されたサイトで適切に中断する
- [ ] `attemptCloseAllOverlays` が閉じる試行の結果（閉じた/無反応/遷移発生）を記録する
- [ ] 判定ロジックが一切含まれていない（レビュー観点）

## Definition of Done

- 上記を満たす。**スコア計算のコードが1行も入っていないこと**
