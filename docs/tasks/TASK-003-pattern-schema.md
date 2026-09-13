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

---

## 進捗記録

- 状態: 完了（2026-09-13）

### 決定ログ

#### 2026-09-13 escape facet もスキーマに含める
- 決定: `PATTERN_SCHEMA.md §5.5`（v0.2 D6）の `EscapeFacet` / `EscapeTechnique` と V-14 を本タスクで実装
- 却下案: 「V-01..V-12 のみ」（本タスク文書の記載）→ 設計文書側が §5.5 / V-13 / V-14 を既に定義しており、後回しにすると TASK-004 のデータ投入時にスキーマ変更が発生するため
- 出典: PATTERN_SCHEMA.md §5.5, §8

#### 2026-09-13 導出 gameDifficulty の正規化式
- 決定: `round(cbrt(ic×unc×tp) × (0.5 + severity/20))` を 1..5 に clamp。乗法構造（CATALOG §4）を保ちつつ 1-5 のカタログ列と比較可能にする
- 却下案: `severity/20 × ic × unc × tp` の生値（最大 125）→ カタログの 1-5 と直接比較できず V-10 が機能しない
- 付帯条件: V-10 は warn のみ。式の妥当性は TASK-004 で 90 件に当てて確認する
- 出典: session decision（`src/derived.ts` のコメントに記載）

#### 2026-09-13 BehaviorId は `<slot>:<name>` 形式
- 決定: BehaviorId にスロット名を接頭辞として持たせ、`behaviors` のキー（スロット）と一致することを zod で検査（R1 スロット排他の型+検証）
- 却下案: 自由文字列 → スロット不一致を registry 解決まで検出できない
- 出典: session decision

### 作業ログ

- 2026-09-13: zod v4 で §2-§6 + §5.5 のスキーマ、`parsePatterns`（パターンID + フィールドパス付きエラー）、query API、V-01..V-14（V-05/06/07/13 は registry 注入）、`catalog:validate` CLI、11 カテゴリ + CLS-11 / COM-12 のサンプルとテスト 38 件。

### 証拠

```text
$ pnpm --filter @ad-jigoku/pattern-catalog typecheck lint test → 3 files, 38 tests passed
$ pnpm catalog:validate → catalog:validate: 0 patterns, 0 errors, 0 warnings（データは TASK-004）
$ pnpm check-deps → OK（pattern-catalog の dependencies は zod のみ）
test/load-query.test.ts: 不正 JSON で "CLS-11 › severity" / "INT-01 › game.warning" を含むエラーを検証
```
