# TASK-010 — スコアシステム

- Milestone: M1 / Phase 1
- Depends on: 009
- Size: 1 session
- **DECISIONS_v0.2.md §5.3 により改訂**: `scoreEffect` を廃止し、`onClear` を難易度3軸から導出する。
  Prioritization の判定結果として **triage bonus** を追加する

## Objective

GAME §9 のスコアモデルを実装する。

`Score = Completion + Speed + Accuracy + Combo + Survival + Triage - Damage - Time`

## Context

`GAME_ENGINE_DESIGN.md §9`、`§9.4`（threat / triage bonus）。**重要な禁止事項が1つある**（下記）。

## Files to create

```text
packages/game-engine/src/score/score.ts
packages/game-engine/src/score/breakdown.ts    結果画面用の内訳
packages/game-engine/src/score/triage.ts       threat 順位との照合と triage bonus 判定
```

## Implementation requirements

1. GAME §9.1 の式をそのまま実装（`Triage` 項を追加）
2. **禁止: `score += pattern.severity`。**
   GAME §9.1 が「UX severity が高いほどプレイヤー報酬が高い」構造を明示的に禁止している。
3. **`onClear` は難易度3軸から導出する（旧 `scoreEffect` は廃止）**:
   `onClear = BASE × mean(interactionComplexity, uncertainty, timePressure)`。
   severity からは導出しない（禁止は維持）。`BASE` は `EngineTuning` に置く
4. **triage bonus（DECISIONS_v0.2.md §5.3）**: 広告を処理した瞬間、TASK-009 で計算済みの
   `threat` を比較し、その時点で最も threat の高い広告を処理していれば bonus を加算する。
   連続で正しければ既存の `combo.chain`（TASK-011）に乗せる
5. Clean Play Bonus（GAME §9.2）: 誤クリック0 / 不要操作0 / patience 無損失 / 高速完了
6. 内訳を必ず保持する（結果画面で「なぜこの点数か」を出す。triage bonus も内訳に含める）
7. 誤クリック（`mistake`）のカウントを正確に。偽×を押した、CTA を押した、
   関係ない場所を連打した、をそれぞれ別種別で記録
8. **ランダム連打が最適戦略にならないこと**を数値で保証する（GAME §24 Skill）

## Acceptance criteria

- [ ] スコア内訳が全項目分解されて取得できる（triage bonus 込み）
- [ ] `severity` を変更してもプレイヤーのスコアが変わらない（テストで保証）
- [ ] `onClear` が3軸の平均から一意に導出され、パターン個別の手打ち値を持たない
- [ ] 最も threat の高い広告を先に処理すると、そうでない場合よりスコアが高くなる
- [ ] Clean Play でボーナスが付く
- [ ] 連打戦略のスコアが、正しく対処した場合のスコアを下回る（シミュレーションテスト）
- [ ] 同一 seed / 同一入力で同一スコアになる

## Test requirements

- `severity` 非依存テスト（**必須**。カタログの severity を書き換えて同スコアを確認）
- `onClear` 導出式のテスト（3軸を変えると値が追従する）
- triage bonus テスト: 「近い順」戦略 vs 「threat 順」戦略でスコアが `threat順 > 近い順` になる
- 戦略比較テスト: random-spam / naive / optimal の3戦略でスコア順が `optimal > naive > spam`
- 内訳の合計が総得点と一致する

## Definition of Done

- acceptance criteria を全て満たす
- `docs/design/GAME_ENGINE_DESIGN.md §9.1` の禁止事項がコードコメントとして該当箇所に書かれている
