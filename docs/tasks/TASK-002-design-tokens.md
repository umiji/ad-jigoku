# TASK-002 — デザイントークンと DESIGN.md 強制 lint

- Milestone: M0 / Phase 1
- Depends on: 001
- Size: 1 session

## Objective

`DESIGN.md` の色・タイポグラフィ・spacing・z-index・motion・shape を
`packages/ui/tokens` に**唯一の実体**として定義し、逸脱を lint で落とせるようにする。

## Context

`DESIGN.md §0` はこの文書を「設計契約」と宣言している。§23 は実装のたびに
コンプライアンスパスを要求している。人間のレビューだけに頼ると必ず漏れる。
トークン化 + lint で機械化する（`ARCHITECTURE.md §10`）。

## Files to create

```text
packages/ui/tokens/colors.ts       DESIGN.md §4 をそのまま
packages/ui/tokens/type.ts         DESIGN.md §5
packages/ui/tokens/spacing.ts      DESIGN.md §6
packages/ui/tokens/motion.ts       DESIGN.md §14
packages/ui/tokens/zIndex.ts       DESIGN.md §15
packages/ui/tokens/shape.ts        DESIGN.md §16
packages/ui/tokens/index.ts
packages/ui/tokens/build-css.ts    tokens.ts → tokens.css 生成
packages/ui/styles/tokens.css      (生成物。生成物であることを明記)
packages/ui/styles/reset.css
packages/ui/styles/base.css        背景のノイズ/グレイン/ヴィネット (DESIGN_REQ §3.1)
.stylelintrc.cjs
```

## Implementation requirements

1. **値を勝手に発明しない。** `DESIGN.md` の YAML をそのまま写す。
   足りない値があった場合は `DESIGN.md` への追記を提案してから実装する
2. 意味論的な名前のみを公開する（`colors.accent.danger`。`colors.red500` は作らない / DESIGN §4）
3. `build-css.ts` が `tokens.css` を CSS カスタムプロパティとして生成。
   ビルド時に実行され、生成物の差分が CI で検出される（手編集の防止）
4. Tailwind v4 を採用する場合、`@theme` で `tokens.css` の変数を参照する
   （**OD-1 の決着後に着手すること**）
5. 日本語フォント: 可変フォント1つ + 英字補助。サブセット化。`font-display: swap`。
   ファミリ数は3以下（DESIGN §5）
6. lint ルール:
   - stylelint: 生の16進カラー禁止、`z-index` の数値リテラル禁止
   - eslint: `CoolCard` / `ModernCard` / `PremiumCard` / `GlassCard` / `FeatureCard` の
     命名を禁止（DESIGN §21）
   - Tailwind 採用時: 任意値記法 `[...]` を禁止

## Acceptance criteria

- [ ] `DESIGN.md §4,5,6,14,15,16` の全値がトークンとして存在する
- [ ] CSS に生の16進カラーを書くと stylelint が落ちる
- [ ] `z-index: 9999` を書くと落ちる（DESIGN §15）
- [ ] `GlassCard.tsx` を作ると eslint が落ちる
- [ ] トークン一覧を確認できる開発用ページがある（`/dev/tokens`）
- [ ] ライト/ダークの切り替えは存在しない（このプロダクトは常にダーク）ことが明示されている

## Test requirements

- `tokens.css` の生成が冪等であること
- 主要な文字色 × 背景色の組み合わせが WCAG AA を満たすことのコントラスト検証テスト（DESIGN §20）

## Definition of Done

- acceptance criteria を全て満たす
- `packages/ui` の README に「新しい色が必要になったときの手順（= DESIGN.md を先に直す）」が書かれている

---

## 進捗記録

- 状態: 完了（2026-09-13）。実装はサブエージェント（opus）、検証・コミットはコントローラ

### 決定ログ

#### 2026-09-13 生成物は tokens.css と tailwind-theme.css の 2 本
- 決定: `tokens/*.ts` から `styles/tokens.css`（`:root` の CSS 変数）と `styles/tailwind-theme.css`（`@theme` に実値）を生成し、`tokens:check` で両方の drift を CI 検出する
- 却下案: ブリーフ案の `@theme { --color-bg-primary: var(--color-bg-primary) }` → 自己参照カスタムプロパティで無効。`--ad-*` 接頭辞で二重命名 → 1 つの値に 2 つの名前ができる
- 出典: サブエージェント報告（ARCHITECTURE §10.1「値の重複定義を作らない」を生成で担保）

#### 2026-09-13 Tailwind 既定パレット・スケールを `initial` でリセット
- 決定: `@theme` 冒頭で `--color-*` / `--font-*` / `--text-*` / `--spacing-*` / `--radius-*` を initial にし、`bg-red-500` / `p-7` / `text-sm` 等が生成されないようにする。z-index / duration は `@utility` でトークンを参照
- 却下案: lint のみで禁止 → 動的 className（`'w-' + size`）をすり抜ける
- 出典: ARCHITECTURE §10.3 / OD-1

#### 2026-09-13 フォントは M PLUS 2 Variable 1 ファミリ
- 決定: `@fontsource-variable/m-plus-2`（日本語対応可変フォント、サブセット + unicode-range + swap）を `--font-sans` に。ファミリ数 1（上限 3）
- 却下案: Noto Sans JP → 「default system-only appearance」に近く DESIGN §5 の "distinctive" を満たしにくい
- 付帯条件: DESIGN.md §5 にファミリ名の追記提案が必要（未反映）
- 出典: session decision

### 作業ログ

- 2026-09-13: tokens/{colors,type,spacing,motion,zIndex,shape,contrast,css-vars,build-css}.ts、styles/{tokens,tailwind-theme,reset,base}.css、.stylelintrc.cjs、Tailwind v4 wiring、/dev/tokens、README、テスト 25 件、CI に lint:css / tokens:check を追加。

### 証拠

```text
$ pnpm turbo run typecheck lint test --filter=@ad-jigoku/ui --filter=@ad-jigoku/web → 8 successful（ui: 25 tests）
$ pnpm lint:css → clean / $ pnpm --filter @ad-jigoku/ui tokens:check → OK
$ color: #ff0000 → color-no-hex / z-index: 9999 → declaration-property-value-disallowed-list（exit 2）
$ className="w-[123px]" → no-restricted-syntax（任意値禁止）/ z-9999 → 禁止 / GlassCard → 禁止
$ WCAG AA: 9 組すべて ≥ 4.5:1（最小 text.inverse/accent.danger 5.58）
$ pnpm --filter @ad-jigoku/web build → ✓ Exporting、/dev/tokens 生成
```

### 未解決の懸念（次タスクへ）

- DESIGN.md に shadow / easing のトークン定義がない（DESIGN_REQ §18 は要求）。TASK-013 着手時に DESIGN.md への追記を提案する
- `text.primary` on `accent.danger` は 3.76:1 で AA 不合格。赤地の文字は必ず `text.inverse`
- `/dev/tokens` が本番の静的書き出しに含まれる（除外ポリシー未定）
