# TASK-004 — カタログ Markdown → JSON 変換（全パターン）

- Milestone: M0 / Phase 1
- Depends on: 003
- Size: 1 session

## Objective

`docs/requirements/AD_UX_PATTERN_CATALOG.md` の全 90 パターンを
`packages/pattern-catalog/data/patterns/*.json` に変換し、
Markdown と JSON の整合を CI で検査できるようにする。

## Context

ADR-001。Markdown が人間の source of truth、JSON が機械の source of truth。
乖離したら Markdown を正とする。この関係を CI で固定する。

## Files to create

```text
packages/pattern-catalog/data/patterns/cls.json    A. Close / Dismiss Friction (14)
packages/pattern-catalog/data/patterns/int.json    B. Unexpected Interruption (10)
packages/pattern-catalog/data/patterns/obs.json    C. Screen Obstruction (10)
packages/pattern-catalog/data/patterns/acc.json    D. Interaction / Accidental Click (8)
packages/pattern-catalog/data/patterns/dec.json    E. Deceptive / Camouflaged (8)
packages/pattern-catalog/data/patterns/att.json    F. Motion / Audio / Attention (7)
packages/pattern-catalog/data/patterns/time.json   G. Timing / Waiting (6)
packages/pattern-catalog/data/patterns/per.json    H. Persistence / Recurrence (5)
packages/pattern-catalog/data/patterns/lay.json    I. Layout / Visual Stability (6)
packages/pattern-catalog/data/patterns/mob.json    J. Mobile-specific (6)
packages/pattern-catalog/data/patterns/com.json    K. Compound / Combo (12)
scripts/catalog-parity.ts                          Markdown ↔ JSON 整合検査
```

## Implementation requirements

1. **全 90 パターンを投入する。** ただし facet は段階的でよい:
   - 全パターン: `id`, `category`, `name`, `definition`, `severity`, `gameDifficulty`, `dimensions`
   - MVP 15 パターン（GAME §23）: `game` facet を完全に埋める
   - Phase 2 対象 10-15 パターン: `detect` facet を埋める
   - 残りは facet なし（カバレッジレポートに未実装として出る）
2. `dimensions` は CATALOG §1.2 の9次元。Markdown には明示されていないので、
   **定義文から判断して埋める。埋めた根拠をコミットメッセージに残す**
3. `improve` facet は MVP 15 パターン分を書く。`adFriendlyAlternative` は必須（V-09）
4. `scripts/catalog-parity.ts`:
   - Markdown のテーブルをパースして ID / Severity / Game Difficulty を抽出
   - JSON と比較し、差分があれば **Markdown 側を正として何を直すべきか**を出力
   - CI に組み込む
5. `pnpm catalog:coverage` で facet カバレッジ表を出力する
   （どのパターンが game/detect/improve/fixture を持つか）

## Acceptance criteria

- [ ] 90 パターンすべてが JSON に存在し、`catalog:validate` が通る
- [ ] `catalog-parity` が Markdown と JSON の一致を確認できる
- [ ] Markdown の severity を1つ書き換えると parity 検査が落ちる
- [ ] MVP 15 パターンが完全な `game` facet を持つ
- [ ] `catalog:coverage` がカバレッジ表を出す
- [ ] 導出 gameDifficulty とカタログ値の乖離が ±1 を超えるパターンが一覧化され、
      各件について「どちらが正しいか」の判断がコメントとして残っている

## Test requirements

- parity スクリプトの単体テスト
- 全 JSON が zod スキーマを通ること
- `COM-*` の `composedOf` の参照先がすべて実在すること

## Definition of Done

- acceptance criteria を全て満たす
- `dimensions` の付与方針が `packages/pattern-catalog/README.md` に記録されている

---

## 進捗記録

- 状態: 完了（2026-09-13）。実装はサブエージェント（opus）、検証・コミットはコントローラ

### 決定ログ

#### 2026-09-13 パターン数は 92（Markdown が正）
- 決定: `AD_UX_PATTERN_CATALOG.md` の表は 92 行（14+10+10+8+8+7+6+5+6+6+12）。タスク文書・設計文書の「90」は概数として扱い、JSON は 92 件、`version.json.patternCount = 92`
- 却下案: 90 に合わせて 2 件を落とす → Markdown が source of truth（ADR-001）に反する
- 出典: catalog-parity の実測

#### 2026-09-13 MVP の shell / behavior 契約
- 決定: MVP 15 + CLS-01 の game facet は `packages/pattern-catalog/README.md §4` の表（shell id / behavior id / params 名）に固定。TASK-013A/B/C・017〜022 はこの表を契約として実装する
- 却下案: なし
- 出典: TASK-004 brief（GAME_ENGINE_DESIGN §7.1 の展開）

#### 2026-09-13 COM-* は game facet に shell / behaviors を持たない
- 決定: COM-03 等は `composedOf` の構成要素を生成器が同時起動する（TASK-003 の schema 改訂に追従）
- 出典: GAME_ENGINE_DESIGN §7.1

### 作業ログ

- 2026-09-13: data/patterns/*.json（92 件、MVP 16 件に game + improve、12 件に detect）、scripts/catalog-parity.ts（+10 tests）、bin/catalog-coverage.ts、src/data.ts（loadCatalog）、README（dimensions 方針・V-10 判断）。CI に catalog:parity を追加。

### 証拠

```text
$ pnpm catalog:validate → 92 patterns, 0 errors, 0 warnings
$ pnpm catalog:parity   → OK (92 patterns, Markdown ↔ JSON 一致)
$ (Markdown の CLS-05 severity を書き換え) → exit 1「Markdown が正: JSON の CLS-05.severity を 16 に直す」→ revert
$ pnpm catalog:coverage → game 16/92, detect 12/92, improve 16/92, escape 0/92, fixture 0/92
$ pnpm turbo run typecheck lint test --filter=@ad-jigoku/pattern-catalog → 103 tests passed
$ pnpm test:scripts → 18 passed / $ pnpm check-deps → OK
```

### 未解決の懸念

- parity は severity / gameDifficulty のみ比較（definition.ja の drift は検出しない）
- dimensions は定義文からの単独判断。レビュー未実施
