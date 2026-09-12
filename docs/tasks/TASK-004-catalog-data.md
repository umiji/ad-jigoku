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
