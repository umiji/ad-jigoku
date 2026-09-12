# TASK-013D — Creative データ基盤（数百件 + 実在ブランド NG 検査）

- Milestone: M2 / Phase 1
- Depends on: 004
- Size: 1 session
- **DECISIONS_v0.2.md §1.4 により新設**

## Objective

広告の「中身」（コピー・架空ブランド名・色・画像）を数百件のデータとして持ち、`rng('creative')` で
抽選できるようにする。シェル数が少なくても「同じ広告ばかり」に見えないための鍵。

## Context

`DECISIONS_v0.2.md §1.4`。実在ブランドを含まないことを CI で検査する（NG ワードリスト）。
初期件数と生成方法は Q4（`DECISIONS_v0.2.md §9`）: 生成 AI で下書き → 人が実在ブランド検査。

## Files to create

```text
packages/pattern-catalog/data/creatives/*.json     架空ブランド・コピー・カラーのデータ
packages/pattern-catalog/src/creative/selector.ts  CreativeSelector の実装
packages/pattern-catalog/src/creative/ng-words.ts  実在ブランド NG ワードリスト
scripts/check-creative-brands.ts                    NG ワード検査スクリプト（CI 実行）
```

## Implementation requirements

1. `Creative` のデータ型を定義する: `{ id, brandName, headline, body?, colorTokenSet, imageRef? }`
   （すべて架空。`colorTokenSet` は `DESIGN.md` のトークンのみ参照）
2. 初期データ件数は Q4 に従い「まず生成 AI で下書きし、人が実在ブランド検査を行う」運用にする。
   件数の下限は決めず、CI の NG 検査を通過したものから随時追加できる構造にする
3. `CreativeSelector`（`PATTERN_SCHEMA.md` §3 の `GameFacet.creative`）は抽選条件
   （カテゴリ・トーンなど）を受け取り、`rng('creative')` で1件確定する
4. **NG ワード検査（CI）**: 実在ブランド名・実在サービス名・実在商標をリストで持ち、
   Creative データに含まれていないことを検査する。新規データ追加時に自動実行する
5. 検査をすり抜けた場合の報告経路（Issue テンプレート等）を用意する（人手レビューの補完）

## Acceptance criteria

- [ ] Creative データが型付きで読み込める
- [ ] `rng('creative')` で決定論的に1件選べる（同一 seed で同一結果）
- [ ] NG ワード検査が CI に組み込まれ、実在ブランド名を含む Creative を追加すると CI が落ちる
- [ ] 既存の全 Creative データが NG 検査を通過している
- [ ] `GameFacet.creative` からこのデータを引ける状態になっている

## Test requirements

- NG ワード検査の単体テスト（意図的に実在ブランド名を混入させて検出を確認）
- 抽選の決定論テスト

## Definition of Done

- acceptance criteria を全て満たす
- TASK-013A/B/C のシェルが、このタスクの Creative データを使って多様な見た目を出せる状態
