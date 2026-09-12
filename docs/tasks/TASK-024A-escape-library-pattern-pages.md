# TASK-024A — escape 技法ライブラリ + `/patterns/[id]` 図鑑ページ

- Milestone: M4 / Phase 1
- Depends on: 004, 024
- Size: 1 session
- **DECISIONS_v0.2.md §6 により新設**

## Objective

ユーザー向け「今すぐの逃げ方」を共通ライブラリ（約15技法）として実装し、パターン図鑑ページ
`/patterns/[id]` で公開する。検索流入の入口（「広告 閉じられない スマホ」）にする。

## Context

`PATTERN_SCHEMA.md §5.5 EscapeFacet`、`DECISIONS_v0.2.md §6`。線引き（§6.4）: ブラウザ標準機能のみを
案内し、サードパーティの広告ブロッカーは推奨しない（`DESIGN_REQUIREMENTS.md` §21、
`PRODUCT_REQUIREMENTS.md` §31）。Q5（`DECISIONS_v0.2.md §9`）により Phase 1 に含める。

## Files to create

```text
packages/pattern-catalog/data/escape-techniques.json    約15種の技法データ
apps/web/src/patterns/[id]/page.tsx                      図鑑ページ（静的生成）
apps/web/src/patterns/[id]/EscapeSection.tsx
apps/web/src/patterns/[id]/ImproveSection.tsx
apps/web/src/patterns/PatternIndex.tsx                    一覧ページ
```

## Implementation requirements

1. `EscapeTechnique`（`PATTERN_SCHEMA.md §5.5`）を約15種実装する。例:
   `tap-backdrop` / `browser-back-once` / `back-longpress-history` / `reader-mode` / `tab-mute` /
   `site-audio-block` / `select-and-copy-text` / `close-tab-return-search`
2. 各技法は `browserNative: true` を持つ（型で強制。§6.4 の線引きを保証する）
3. `/patterns/[id]` は**静的生成**（`generateStaticParams` で全パターンIDから生成。ホスティングは
   Cloudflare Pages / `output: 'export'`、`ARCHITECTURE.md §16`）
4. ページ構成: パターン説明（`definition`）+ escape（`EscapeFacet` から技法を解決して表示）+
   improve（サイト運営者向け。既存の `ImproveFacet` を流用）
5. `escape` facet を持たないパターンは escape セクションを非表示にする（黙って空欄にしない。
   「このパターンのユーザー向け対処法は準備中」等、状態を明示する）
6. SEO: タイトル・meta description をパターン名・定義から生成する

## Acceptance criteria

- [ ] 約15種の技法データが実装され、`browserNative: true` を持つ
- [ ] `/patterns/[id]` が全パターンID分、静的生成される
- [ ] 各ページに escape と improve の両方が表示される（escape 未定義パターンは状態が明示される）
- [ ] サードパーティ広告ブロッカーへの言及が一切ない（テキスト検査）
- [ ] `DESIGN.md §23` のコンプライアンスチェックを実施し、結果を PR に記載
- [ ] `PATTERN_SCHEMA.md` V-14（`escape.techniques` の参照先が存在する）が通る

## Test requirements

- 全パターンIDに対する静的生成のスモークテスト
- 広告ブロッカー非言及のテキスト検査（CI）
- V-14 バリデーションテスト

## Definition of Done

- acceptance criteria を全て満たす
- TASK-024（結果画面）の `EscapeTips` から本タスクのデータを参照できる状態
