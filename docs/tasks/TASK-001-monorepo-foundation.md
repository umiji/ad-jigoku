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
4. `apps/web` は Next.js 15 App Router で初期化。**`next.config` に `output: 'export'` を設定し、
   Phase 1 の静的書き出しを最初から前提にする**（`docs/design/DECISIONS_v0.2.md` §8, D8）。
   ホスティングは Cloudflare Pages を前提とし、CD は Pages の GitHub 連携（push → 自動ビルド・デプロイ）
   に任せる。専用の deploy ワークフローを本タスクでは書かない（Non-goals）。
   トップページはプレースホルダでよい
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
- [ ] CI が main への PR で自動実行される

## Test requirements

- `scripts/check-deps.ts` の単体テスト（違反ケースを検出できること）

## Definition of Done

- 上記 acceptance criteria が全て満たされている
- README に「開発の始め方」が3行以内で書かれている

---

## 進捗記録

- 状態: 完了（2026-09-13）
- ブランチ: `feat/phase1-m0-m2`

### 決定ログ

#### 2026-09-13 pattern-catalog の外部依存は zod のみ許可
- 決定: `check-deps` の許可リストで `pattern-catalog` の外部依存を `zod` のみ許可する
- 却下案: 「依存ゼロ」（本タスク要件 5）→ TASK-003 の受け入れ基準「dependencies が zod のみ」と矛盾するため、後続タスクの要件を正とした
- 出典: TASK-003 acceptance criteria / session decision

#### 2026-09-13 ESLint はリポジトリルートから実行する
- 決定: 各パッケージの `lint` は `pnpm -w exec eslint packages/<name>` でルートから実行する
- 却下案: `eslint . --config ../../eslint.config.js` → ESLint 9 では `--config` 指定時に `files` パターンの基点が cwd になり、`packages/game-engine/**` の純粋層ルールが一致しなかった（違反ファイルが exit 0 で通過）
- 出典: session decision（実測で確認）

#### 2026-09-13 Next.js は 15.5 系を採用
- 決定: `next@^15.5`（タスク文書指定の 15 系最新）
- 却下案: Next 16 → 文書が 15 App Router を指定しており、静的書き出し要件に 16 の利点がない
- 出典: TASK-001 要件 4

### 作業ログ

- 2026-09-13: pnpm workspaces + Turborepo + TS strict + ESLint flat config + check-deps + Next 15 static export + CI を作成。lint の基点問題を修正。

### 証拠

```text
$ pnpm turbo run typecheck lint test   → Tasks: 18 successful, 18 total
$ pnpm check-deps                      → check-deps: OK
$ pnpm test:scripts                    → Tests 8 passed (8)
$ (game-engine に React import + Math.random + Date を書く) → 3 errors（no-restricted-imports / properties / globals）
$ (ui に GlassCard.tsx を作る)          → 1 error（no-restricted-syntax）
$ next build                           → ✓ Exporting (2/2)、out/index.html 生成
$ next dev -p 3123 → curl / → 200、「ようこそ、広告地獄へ。」を含む
```
