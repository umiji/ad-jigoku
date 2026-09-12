# TASK-010 — スコアシステム

- Milestone: M1 / Phase 1
- Depends on: 009
- Size: 1 session

## Objective

GAME §9 のスコアモデルを実装する。

`Score = Completion + Speed + Accuracy + Combo + Survival - Damage - Time`

## Context

`GAME_ENGINE_DESIGN.md §9`。**重要な禁止事項が1つある**（下記）。

## Files to create

```text
packages/game-engine/src/score/score.ts
packages/game-engine/src/score/breakdown.ts    結果画面用の内訳
```

## Implementation requirements

1. GAME §9.1 の式をそのまま実装
2. **禁止: `score += pattern.severity`。**
   GAME §9.1 が「UX severity が高いほどプレイヤー報酬が高い」構造を明示的に禁止している。
   得点は `GameFacet.scoreEffect.onClear`（パターン個別に定義された値）から取る。
   severity からの自動導出をしない
3. Clean Play Bonus（GAME §9.2）: 誤クリック0 / 不要操作0 / patience 無損失 / 高速完了
4. 内訳を必ず保持する（結果画面で「なぜこの点数か」を出す）
5. 誤クリック（`mistake`）のカウントを正確に。偽×を押した、CTA を押した、
   関係ない場所を連打した、をそれぞれ別種別で記録
6. **ランダム連打が最適戦略にならないこと**を数値で保証する（GAME §24 Skill）

## Acceptance criteria

- [ ] スコア内訳が全項目分解されて取得できる
- [ ] `severity` を変更してもプレイヤーのスコアが変わらない（テストで保証）
- [ ] Clean Play でボーナスが付く
- [ ] 連打戦略のスコアが、正しく対処した場合のスコアを下回る（シミュレーションテスト）
- [ ] 同一 seed / 同一入力で同一スコアになる

## Test requirements

- `severity` 非依存テスト（**必須**。カタログの severity を書き換えて同スコアを確認）
- 戦略比較テスト: random-spam / naive / optimal の3戦略でスコア順が `optimal > naive > spam`
- 内訳の合計が総得点と一致する

## Definition of Done

- acceptance criteria を全て満たす
- `docs/design/GAME_ENGINE_DESIGN.md §9.1` の禁止事項がコードコメントとして該当箇所に書かれている
