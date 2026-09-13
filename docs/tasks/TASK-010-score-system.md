# TASK-010 — スコアシステム（onClear 導出 + triage bonus）

- Milestone: M1 / Phase 1
- Depends on: 009
- Size: 1 session

> **v0.2 改訂（`DECISIONS_v0.2.md` §5.3）**: `scoreEffect`（パターン個別の手打ちスコア値）を廃止し、
> 難易度3軸からの導出に変更する。加えて、TASK-009 で計算した `threat` を使った **triage bonus**
> （Prioritization の評価）を追加する。

## Objective

GAME §9 のスコアモデルを実装する。

`Score = Completion + Speed + Accuracy + Combo + Survival + Triage - Damage - Time`

## Context

`GAME_ENGINE_DESIGN.md §9, §9.4`。**重要な禁止事項が1つある**（下記）。

## Files to create

```text
packages/game-engine/src/score/score.ts
packages/game-engine/src/score/on-clear.ts     onClear 導出（BASE × 難易度3軸の平均）
packages/game-engine/src/score/triage.ts       ★ v0.2 追加。triage bonus / chain 判定
packages/game-engine/src/score/breakdown.ts    結果画面用の内訳
```

## Implementation requirements

1. GAME §9.1 の式をそのまま実装
2. **禁止: `score += pattern.severity`。**
   GAME §9.1 が「UX severity が高いほどプレイヤー報酬が高い」構造を明示的に禁止している。
3. **`scoreEffect` は廃止（`PATTERN_SCHEMA.md §3` で削除済み）。** `onClear` は
   `GameFacet.interactionComplexity` / `uncertainty` / `timePressure` の平均から導出する:
   ```text
   onClear = BASE × mean(interactionComplexity, uncertainty, timePressure)
   ```
   severity からは引き続き導出しない。90パターンの手調整を不要にする（`GAME_ENGINE_DESIGN.md §9.4.1`）
4. **Triage bonus（`GAME_ENGINE_DESIGN.md §9.4.1`）**: 広告を処理した瞬間、その時点で最も
   `threat`（TASK-009）が高い広告を処理したかを判定し、正しければ triage bonus を加算する。
   連続で正しければ chain に乗せ、既存コンボ機構（TASK-011）に統合できる形にする
5. Clean Play Bonus（GAME §9.2）: 誤クリック0 / 不要操作0 / patience 無損失 / 高速完了
6. 内訳を必ず保持する（結果画面で「なぜこの点数か」を出す。triage bonus も内訳に含める）
7. 誤クリック（`mistake`）のカウントを正確に。偽×を押した、CTA を押した、
   関係ない場所を連打した、をそれぞれ別種別で記録
8. **ランダム連打が最適戦略にならないこと**を数値で保証する（GAME §24 Skill）

## Acceptance criteria

- [ ] スコア内訳が全項目分解されて取得できる（triage bonus を含む）
- [ ] `severity` を変更してもプレイヤーのスコアが変わらない（テストで保証）
- [ ] `onClear` が難易度3軸の平均から一貫して導出される（パターン個別の手打ち値が存在しない）
- [ ] 最も threat の高い広告を先に処理した場合に triage bonus が付く
- [ ] 順序を無視して処理した場合は triage bonus が付かない（テストで両ケースを比較）
- [ ] Clean Play でボーナスが付く
- [ ] 連打戦略のスコアが、正しく対処した場合のスコアを下回る（シミュレーションテスト）
- [ ] 同一 seed / 同一入力で同一スコアになる

## Test requirements

- `severity` 非依存テスト（**必須**。カタログの severity を書き換えて同スコアを確認）
- 戦略比較テスト: random-spam / naive / optimal の3戦略でスコア順が `optimal > naive > spam`
- triage bonus のテスト: 「threat 順に処理」vs「近い順に処理」でスコアが異なることを確認
- 内訳の合計が総得点と一致する

## Definition of Done

- acceptance criteria を全て満たす
- `docs/design/GAME_ENGINE_DESIGN.md §9.1` の禁止事項がコードコメントとして該当箇所に書かれている
