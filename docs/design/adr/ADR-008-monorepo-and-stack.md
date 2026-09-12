# ADR-008: monorepo 構成と技術スタック

- Status: Accepted（§20 OD-1, OD-2, OD-4 決着済み。DECISIONS_v0.2.md により §8 のインフラ部分を改訂）
- Date: 2026-09-12（改訂）

## Context

初版（Proposed）はホスティングに Vercel、診断ワーカーに Fly.io 常駐 + pg-boss、ストレージに S3 を
想定していた。オーナーレビュー（`DECISIONS_v0.2.md` §8）で、Vercel Hobby プランの商用不可条項に
広告掲載サービスが抵触することが判明し、インフラ方針を全面的に見直した。

## Decision

| 領域 | 選択 | 理由 |
|---|---|---|
| リポジトリ | pnpm workspaces + Turborepo | 依存方向を package 境界で機械的に強制できる（AD-1, AD-3） |
| 言語 | TypeScript strict | スキーマが契約の中心なので型が効く |
| Web | Next.js 15 App Router | OD-2 で決着。Phase 1 は `output: 'export'` の静的書き出し |
| ホスティング | **Cloudflare Pages**（v0.1: Vercel から変更） | Hobby の商用不可条項を回避（広告掲載 = 商用） |
| スタイル | デザイントークン(TS→CSS変数) + Tailwind v4 `@theme` バインド | OD-1 で決着。DESIGN.md のトークンを唯一の実体にしつつ実装速度を保つ |
| スキーマ | zod | 実行時検証 + 型導出を1箇所で |
| テスト | Vitest / fast-check / Playwright | 単体・property・e2e |
| DB (Phase2+) | Neon または Cloudflare D1 | **未確定のまま（OD-8）**。Phase 2 で決定 |
| 診断ワーカー (Phase2+) | **GitHub Actions**（v0.1: pg-boss + Fly.io 常駐から変更） | public repo で実行時間無制限。`workflow_dispatch` がキュー代わり |
| オブジェクトストレージ (Phase2+) | **Cloudflare R2**（v0.1: S3 から変更） | 10GB 無料・egress 無料 |

## 却下した案

- **Nx / Bazel**: 過剰
- **単一 Next.js アプリでディレクトリ分割**: 初速は速いが、game-engine の純粋性が守られる保証がない。
  このプロジェクトは境界を守ること自体が要件
- **Vite SPA + 別途静的LP**: Phase 3 で結局 SSR が要る
- **Vercel**: Hobby プランの商用不可条項。Pro は固定費が要る（DECISIONS_v0.2.md §8）
- **Fly.io 常駐 + pg-boss**: 固定費と運用対象が増える。public repo なら GitHub Actions で代替可能
- **Redis / SQS**: Phase 2 の負荷では過剰

## Consequences

### 良い
- 固定費ゼロで Phase 1〜2 を運用できる（独自ドメインの年額のみ）
- GitHub Actions は public repo で無制限なので、診断実行回数の心配をしなくてよい

### 悪い
- GitHub Actions は「常駐サーバ」ではないため、実行開始までの待ち時間（キュー・cold start）が
  Fly.io 常駐より長くなり得る。Evaluator のホスティング自体の要否は OD-7 として未決のまま残す
- Cloudflare Pages は Vercel ほど Next.js 機能への統合が深くない（Phase 3 の動的化で再検証が要る）
