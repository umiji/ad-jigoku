# TASK-024A — escape 技法ライブラリ + `/patterns/[id]` 図鑑ページ

- Milestone: M4 / Phase 1
- Depends on: 004, 024
- Size: 1 session

> **v0.2 新規（`DECISIONS_v0.2.md` §6 全体、D6）**: `escape` facet（ユーザー向け脱出ノウハウ）を
> 実際にデータ化し、結果画面（TASK-024）と公開図鑑ページの両方から参照できるようにする。

## Objective

`data/escape-techniques.json`（約15種の技法ライブラリ）を整備し、各パターンから ID 参照できる
状態にする。あわせて `/patterns/[id]` 図鑑ページ（パターン説明 + escape + improve）を実装する。

## Context

`PATTERN_SCHEMA.md §5.5`、`PRODUCT_REQUIREMENTS.md §10.5`、`DECISIONS_v0.2.md §6.2, §6.3`。
図鑑ページは「広告 閉じられない スマホ」のような検索流入の入口になる（Q5: Phase 1 に含める）。

## Files to create

```text
packages/pattern-catalog/data/escape-techniques.json
packages/pattern-catalog/src/escape/lookup.ts       techniques ID → EscapeTechnique 解決
apps/web/src/app/patterns/[id]/page.tsx             静的生成される図鑑ページ
apps/web/src/app/patterns/[id]/EscapeSection.tsx
apps/web/src/app/patterns/[id]/ImproveSection.tsx
```

## Implementation requirements

1. `EscapeTechnique`（`PATTERN_SCHEMA.md §5.5`）を約15種定義する:
   `tap-backdrop` / `browser-back-once` / `back-longpress-history` / `reader-mode` /
   `tab-mute` / `site-audio-block` / `select-and-copy-text` / `close-tab-return-search` 等
2. **ブラウザ標準機能のみを案内する。サードパーティの広告ブロッカーは推奨しない**
   （`DECISIONS_v0.2.md §6.4`。根拠: `DESIGN_REQUIREMENTS.md §21`, `PRODUCT_REQUIREMENTS.md §31`）
   - リーダーモード・タブミュート・サイト別音声設定は「遮断」ではなく「表示の切り替え」なので許容
3. 各 `EscapeTechnique.steps` は `device: 'both' | 'mobile' | 'desktop'` を持ち、
   デバイス別の手順差を表現する
4. `/patterns/[id]` は静的生成（`generateStaticParams`）。全カタログ ID 分のページを事前生成する
5. ページ構成: パターン説明（definition）+ `EscapeSection`（`escape.techniques` を推奨順表示）
   + `ImproveSection`（`improve` facet。運営者向け）
6. V-14（`escape.techniques` の参照先が存在すること）が CI で検証されることを確認する

## Acceptance criteria

- [ ] 約15種の技法が定義され、複数パターンから参照される（1技法を複数パターンが共有できる）
- [ ] `/patterns/CLS-11` 等、個別パターンページが静的生成される
- [ ] サードパーティ広告ブロッカーへの言及がゼロ（レビュー観点）
- [ ] `escape.techniques` の参照切れが CI（V-14）で検出される
- [ ] `DESIGN.md §23` のコンプライアンスパス実施済み

## Test requirements

- V-14 バリデーションのテスト（意図的な参照切れで検出できること）
- 静的生成の全パターンページに対するスモークテスト（404 がないこと）

## Definition of Done

- acceptance criteria を全て満たす
- TASK-024 の結果画面から `EscapeCard` 経由でこのデータを参照できることを確認済み
