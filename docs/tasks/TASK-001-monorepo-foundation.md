# TASK-001 — monorepo 基盤とツールチェーン

- Milestone: M0 / Phase 1
- Depends on: —
- Size: 1 session

## Objective

pnpm workspaces + Turborepo の monorepo を立ち上げ、**依存方向のルールを CI で強制できる状態**にする。

## Context

`ARCHITECTURE.md §5.1` が定める依存ルールが、このプロジェクトの設計の背骨になっている。
「game-engine が DOM を import しない」「evaluator-core が Playwright を import しない」が
守られなくなった瞬間に、seed 再現も evidence 再スコアも壊れる。
最初のタスクでこれを機械化しておく。

## Files to create

```text
package.json                    workspace root
pnpm-workspace.yaml
turbo.json
tsconfig.base.json
.eslintrc.cjs  (または eslint.config.js)
.gitignore
.editorconfig
vitest.workspace.ts
scripts/check-deps.ts           パッケージ間依存の検査
packages/pattern-catalog/package.json   (空のスタブ)
packages/game-engine/package.json       (空のスタブ)
packages/evaluator-core/package.json    (空のスタブ)
packages/ui/package.json                (空のスタブ)
packages/safety/package.json            (空のスタブ)
apps/web/                               (Next.js 初期化)
.github/workflows/ci.yml
```

## Implementation requirements

1. Node 22 / pnpm。`packageManager` フィールドで固定
2. TypeScript strict（`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` を有効）
3. Turborepo のパイプライン: `build` / `typecheck` / `lint` / `test`
4. `apps/web` は Next.js 15 App Router で初期化。トップページはプレースホルダでよい
   **ホスティングは Cloudflare Pages（DECISIONS_v0.2.md §8、ADR-008 改訂）。** `next.config` に
   `output: 'export'` を設定し、静的書き出しで成立させる（アダプタ不要）。CD は Pages の GitHub 連携を使い、
   Vercel 向けの設定・シークレットは追加しない
5. **依存検査スクリプト** `scripts/check-deps.ts` を実装する:
   - 各 package の `package.json` の `dependencies` を読み、`ARCHITECTURE.md §5.1` の
     許可マトリクスと突き合わせる
   - `packages/*` が `apps/*` に依存していないこと
   - `pattern-catalog` の依存が空であること
6. eslint の `no-restricted-imports` で:
   - `packages/game-engine` から `react`, `react-dom` を禁止
   - `packages/game-engine` から `Date`, `Math.random`, `setTimeout` の使用を禁止
     （カスタムルールまたは `no-restricted-globals` / `no-restricted-properties`）
   - `packages/evaluator-core` から `playwright`, `playwright-core` を禁止
7. CI（GitHub Actions）で `typecheck` → `lint` → `test` → `check-deps` を実行

## Non-goals

- デザイントークン（TASK-002）
- CD / デプロイ設定
- Dockerfile

## Acceptance criteria

- [ ] `pnpm install && pnpm turbo typecheck lint test` がクリーンに通る
- [ ] `pnpm check-deps` が通る
- [ ] `packages/game-engine` に `import React from 'react'` を書くと lint が落ちる
- [ ] `packages/game-engine` に `Math.random()` を書くと lint が落ちる
- [ ] `apps/web` が `pnpm dev` で起動する
- [ ] `apps/web` が `output: 'export'` で `pnpm build` → 静的ファイル一式を出力できる
- [ ] CI が main への PR で自動実行される

## Test requirements

- `scripts/check-deps.ts` の単体テスト（違反ケースを検出できること）

## Definition of Done

- 上記 acceptance criteria が全て満たされている
- README に「開発の始め方」が3行以内で書かれている
