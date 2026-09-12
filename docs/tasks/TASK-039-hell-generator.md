# TASK-039 — Hell Generator（フィクスチャ + 期待値）

- Milestone: M7 / Phase 2
- Depends on: 004, 038
- Size: 1 session

> Phase 2 のタスクは概要レベル。

## Objective

パターン定義から**実際に動くフィクスチャサイト**と**期待される検出結果**を生成する。

## Context

`ARCHITECTURE.md §3.1`。**このタスクが評価エンジンの正解データを作る。**
これがないと、検出器が正しいかを検証する手段が人手レビューしかなくなる。
CATALOG §8 の Ad Hell Generator の実体。

## Scope

- `packages/hell-generator/src/`
- `FixtureFacet.builderId` に対応する builder 群
- 生成物: `fixtures/<name>/index.html` + `expected.json`
- **ネガティブケース**（正常な Cookie バナー、小さなサイドバー広告など）
- ゲームステージ定義の生成（同じ定義から / CATALOG §8）

## Key requirements

- 生成されたフィクスチャが**実際にそのパターンを示す**こと（人間が見て確認できる）
- `expected.json` が `PatternDefinition.fixture.expected` から生成されること
- ネガティブケースが最低10件あること（誤検出の回帰テスト用）
- 生成が決定論的であること

## Acceptance criteria

- [ ] MVP 対象パターン分のフィクスチャが生成される
- [ ] ネガティブケースが10件以上ある
- [ ] 生成されたサイトを目視で確認して、意図したパターンになっている
- [ ] 同じパターン定義からゲームステージも生成できる

## Definition of Done

- 上記を満たし、`fixtures/` が CI から参照できる状態
