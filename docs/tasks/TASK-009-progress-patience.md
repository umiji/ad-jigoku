# TASK-009 — Progress / Patience / 勝敗判定

- Milestone: M1 / Phase 1
- Depends on: 006
- Size: 1 session

## Objective

GAME §5.1 の3リソース（Progress / Time / Patience）と、
クリア・失敗の判定を実装する。

## Context

`GAME_ENGINE_DESIGN.md §9.2`。GAME §30 Q4 の推奨案（patience を主、time を従）を採用。
**「急いで処理するか、安全に処理するか」のトレードオフ**（GAME §5.1）が成立することがゴール。

## Files to create

```text
packages/game-engine/src/resource/progress.ts
packages/game-engine/src/resource/patience.ts
packages/game-engine/src/resource/outcome.ts     クリア/失敗の判定
packages/game-engine/src/resource/threat.ts      DECISIONS_v0.2.md §5.2 の threat 計算
```

## Implementation requirements

1. **Progress**: `{ read: number; tasksDone: number; total: number }`
   - `{ t: 'read' }` intent が来ているステップだけ `read` が進む
   - 広告が本文を覆っている間は読めない（`blockProgress`）
   - 読む速度は一定（反射神経ゲームにしないため）
2. **Patience**: 0-100
   - 減少: `patienceEffect.onSpawn` / `onMistake` / `perSecondAlive`
   - **回復**: ミスなしで広告を処理すると微量回復（`PATIENCE_RECOVERY_PER_CLEAN_CLEAR`）
     - これがないと単調減少ゲームになり、上手くなる意味が薄れる
   - 上限は 100 を超えない
3. **Outcome**:
   - `cleared`: progress が total に到達
   - `failed`: patience が 0（主） / 制限時間超過（従、ステージ定義で任意）
   - 判定は毎 tick の最後に1回だけ
4. 失敗時に「何にやられたか」を確定する:
   - 直近 N 秒の `log` から、patience を最も削ったパターンを特定して `culprit` に記録
   - GAME §15.1「全ての失敗は説明可能」/ §20「今回の主犯」の根拠
5. クリア/失敗後は intent を受け付けない（`phase` で制御）
6. **threat 計算（DECISIONS_v0.2.md §5.2 により新設）**: 各アクティブ広告に毎 tick
   `threat(ad) = drain(ad) + block(ad) - trapRisk(ad)` を計算する。
   - `drain` = `patienceEffect.perSecondAlive`
   - `block` = 本文を覆って progress を止めているか（0 or 定数）
   - `trapRisk` = `onMistake` が大きいほど高い（焦って触ると大ダメージ＝後回しが正解）
   - `GameState` に `ads[].threat: number` として持たせ、毎 tick 再計算する
   - この値は TASK-010 の triage bonus 判定の入力になる（`GAME_ENGINE_DESIGN.md §9.4`）

## Acceptance criteria

- [ ] 広告に覆われている間は progress が進まない
- [ ] ミスなしプレイで patience が回復する
- [ ] patience 0 で即座に `failed` になる
- [ ] 失敗時に `culprit` が必ず1つ以上特定される
- [ ] 「速く処理する」と「安全に処理する」で結果が変わる（テストで両方の戦略を模擬して差が出る）
- [ ] `cleared` / `failed` 後に intent を送っても状態が変わらない
- [ ] 自動音声（drain 高）が全画面オーバーレイ（block 高）より threat が高いなど、
      §5.2 の表（DECISIONS_v0.2.md）と整合する threat 順位になる

## Test requirements

- 各リソースの単体テスト
- 戦略シミュレーション: 「即座に全部閉じる」vs「待って安全に閉じる」で異なる結果になること
- 失敗時の culprit 特定テスト（複数パターンが絡む状況で妥当な犯人が選ばれる）

## Definition of Done

- acceptance criteria を全て満たす
- 調整値はすべて `EngineTuning` にあり、コードにマジックナンバーがない
