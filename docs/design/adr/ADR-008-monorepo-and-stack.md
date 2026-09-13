# ADR-008: monorepo 構成と技術スタック

- Status: **Accepted**（`ARCHITECTURE.md §20` OD-1, OD-2, OD-4 決着済み）
- Date: 2026-09-12
- v0.2 改訂: 2026-09-12（`DECISIONS_v0.2.md` §8, D8/D10 によりホスティング/ワーカー/ストレージ行を更新）

## Decision

| 領域 | 選択 | 理由 |
|---|---|---|
| リポジトリ | pnpm workspaces + Turborepo | 依存方向を package 境界で機械的に強制できる（AD-1, AD-3） |
| 言語 | TypeScript strict | スキーマが契約の中心なので型が効く |
| Web | Next.js 15 App Router | Phase 1 は **静的書き出し**（`output: 'export'`）。Phase 3-4 で SSR/ISR が要る。移行コストを前払いしない |
| ホスティング | **Cloudflare Pages**（v0.2, D8） | Vercel Hobby の商用不可条項（広告掲載＝商用）を回避 |
| スタイル | デザイントークン(TS→CSS変数) + Tailwind v4 `@theme` バインド | DESIGN.md のトークンを唯一の実体にしつつ実装速度を保つ |
| スキーマ | zod | 実行時検証 + 型導出を1箇所で |
| テスト | Vitest / fast-check / Playwright | 単体・property・e2e |
| DB (Phase2+) | Postgres (Neon) または D1 | **Phase 2 で決定**（OD-8。未確定でよい） |
| キュー (Phase2+) | **GitHub Actions `workflow_dispatch`**（v0.2, D10） | public repo で無制限。専用ミドルウェアを増やさない |
| Worker (Phase2+) | **GitHub Actions** + Playwright（v0.2, D10） | 常駐コンテナ運用（Fly.io）を廃止し、固定費と運用対象を減らす |
| ストレージ (Phase2+) | **Cloudflare R2**（v0.2, D8） | 10GB 無料・egress 無料。S3 から置き換え |

## 却下した案

- **Nx / Bazel**: 過剰
- **単一 Next.js アプリでディレクトリ分割**: 初速は速いが、game-engine の純粋性が守られる保証がない。
  このプロジェクトは境界を守ること自体が要件
- **Vite SPA + 別途静的LP**: Phase 3 で結局 SSR が要る
- **Redis / SQS**: Phase 2 の負荷では過剰
- **Vercel + Fly.io 常駐ワーカー + pg-boss + S3**（v0.1 案）: 商用不可条項・固定費・運用対象の増加という
  3つの理由で v0.2 にて却下（`DECISIONS_v0.2.md` §8）

## 決着した論点

**Tailwind を使うか**（OD-1）→ **A で決着**。DESIGN.md の "Do not substitute generic Tailwind
aesthetics" はツールの禁止ではなく見た目の禁止と解釈し、任意値 (`bg-[#ff0000]`, `w-[123px]`) の
lint 禁止とトークンバインドで規律を保つ。
