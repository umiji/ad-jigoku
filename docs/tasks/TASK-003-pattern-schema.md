# TASK-003 — パターンスキーマとバリデータ

- Milestone: M0 / Phase 1
- Depends on: 001
- Size: 1 session

## Objective

`docs/design/PATTERN_SCHEMA.md` の型を zod スキーマとして実装し、
JSON を検証・ロードできるようにする。バリデーションルール V-01..V-12 のうち
データ単体で検査可能なものを実装する。

## Context

これが Shared Kernel（ADR-001）の中身。Game / Evaluator / Hell Generator / Improvement の
4つがこの型に依存するので、ここが後から変わると全部が動く。
**Phase 1 のうちにスキーマを固める。**

## Files to create

```text
packages/pattern-catalog/src/schema/pattern.ts       PatternDefinition の zod スキーマ
packages/pattern-catalog/src/schema/game.ts          GameFacet
packages/pattern-catalog/src/schema/detect.ts        DetectFacet
packages/pattern-catalog/src/schema/improve.ts       ImproveFacet
packages/pattern-catalog/src/schema/fixture.ts       FixtureFacet
packages/pattern-catalog/src/schema/index.ts
packages/pattern-catalog/src/load.ts                 JSON 読み込み + parse
packages/pattern-catalog/src/query.ts                フィルタ / 互換性判定 API
packages/pattern-catalog/src/validate.ts             V-01..V-12
packages/pattern-catalog/src/version.json
packages/pattern-catalog/bin/catalog-validate.ts     CLI
packages/pattern-catalog/data/patterns/.gitkeep
```

## Implementation requirements

1. `PATTERN_SCHEMA.md §2-§6` の型をそのまま zod で表現する。
   スキーマと設計文書が食い違ったら**設計文書を直してから**実装する
2. `PatternId` はカテゴリコードのプレフィックスを型レベルで制約する
3. `load()` は parse 失敗時に**どのパターンのどのフィールドか**が分かるエラーを出す
4. `query.ts` が提供する API:
   - `byCategory(code)`
   - `byGameDifficulty(range)`
   - `withGameFacet()` / `withDetectFacet()`
   - `areCompatible(a, b)` — `incompatibleWith` の双方向判定
   - `resolveCompound(id)` — `composedOf` の展開
5. `validate.ts` に V-01..V-12 を実装。ただし simulator/detector 実装の存在確認
   （V-05, V-06, V-07）は registry がまだないので**インターフェースだけ用意し、
   呼び出し側から実装マップを注入する形**にする
6. 導出 gameDifficulty の計算（PATTERN_SCHEMA §7）を実装し、V-10 の警告を出す

## Non-goals

- 実データの投入（TASK-004）
- simulator / detector の実装

## Acceptance criteria

- [ ] `PATTERN_SCHEMA.md` の全フィールドが zod スキーマに存在する
- [ ] 不正な JSON を食わせると、パターンID + フィールド名を含むエラーが出る
- [ ] `pnpm catalog:validate` が CLI として動く
- [ ] `packages/pattern-catalog` の `dependencies` が zod のみ（`check-deps` が通る）
- [ ] カタログの 11 カテゴリ（A-K）すべてを表現できることを、各カテゴリ1件のサンプルで示す

## Test requirements

- 各 facet のスキーマ単体テスト（正常系 + 異常系）
- `areCompatible` の対称性テスト
- V-01..V-12 の各ルールが違反を検出できることのテスト

## Definition of Done

- acceptance criteria を全て満たす
- カタログの最も複雑なパターン（`COM-12 Infinite Hell`、`CLS-11 Fake Close`）が
  スキーマで表現できることをサンプルデータで実証している
