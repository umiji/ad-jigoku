# ADR-008: monorepo 構成と技術スタック

- Status: Proposed — **§20 OD-1, OD-2, OD-4 でレビュー対象**
- Date: 2026-09-12

## Decision（提案）

| 領域 | 選択 | 理由 |
|---|---|---|
| リポジトリ | pnpm workspaces + Turborepo | 依存方向を package 境界で機械的に強制できる（AD-1, AD-3） |
| 言語 | TypeScript strict | スキーマが契約の中心なので型が効く |
| Web | Next.js 15 App Router | Phase 1 は静的、Phase 3-4 で SSR/ISR が要る。移行コストを前払いしない |
| スタイル | デザイントークン(TS→CSS変数) + Tailwind v4 `@theme` バインド | DESIGN.md のトークンを唯一の実体にしつつ実装速度を保つ |
| スキーマ | zod | 実行時検証 + 型導出を1箇所で |
| テスト | Vitest / fast-check / Playwright | 単体・property・e2e |
| DB (Phase2+) | Postgres + Drizzle | 未確定でよい (OD-8) |
| キュー (Phase2+) | pg-boss | 運用対象を増やさない |
| Worker (Phase2+) | 常駐コンテナ + Playwright | serverless で Chromium を回さない (AD-11) |

## 却下した案

- **Nx / Bazel**: 過剰
- **単一 Next.js アプリでディレクトリ分割**: 初速は速いが、game-engine の純粋性が守られる保証がない。
  このプロジェクトは境界を守ること自体が要件
- **Vite SPA + 別途静的LP**: Phase 3 で結局 SSR が要る
- **Redis / SQS**: Phase 2 の負荷では過剰

## 特に議論したい点

**Tailwind を使うか**（OD-1）。DESIGN.md は "Do not substitute generic Tailwind aesthetics for
this design system" と書いている。これはツールの禁止ではなく見た目の禁止だと解釈しているが、
「誘惑を断つために最初から入れない」という判断もありうる。
任意値 (`bg-[#ff0000]`, `w-[123px]`) の lint 禁止とトークンバインドで規律は保てる、というのが提案側の立場。
