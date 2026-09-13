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
packages/game-engine/src/resource/threat.ts      ★ v0.2 追加。Prioritization の脅威モデル
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
6. **v0.2 追加: threat 計算（`GAME_ENGINE_DESIGN.md §9.4`, `DECISIONS_v0.2.md` §5.2）**。
   毎 tick、各アクティブ広告について
   `threat(ad) = drain(ad) + block(ad) - trapRisk(ad)` を計算する:
   - `drain(ad)` = `patienceEffect.perSecondAlive`
   - `block(ad)` = 本文の progress を止めているなら定数、そうでなければ 0
   - `trapRisk(ad)` = `patienceEffect.onMistake` から導出（大きいほど「慌てず後回し」が正解）
   - 結果は `ActiveAd` に付随させ、TASK-010 の triage bonus 判定で使えるようにする

## Acceptance criteria

- [ ] 広告に覆われている間は progress が進まない
- [ ] ミスなしプレイで patience が回復する
- [ ] patience 0 で即座に `failed` になる
- [ ] 失敗時に `culprit` が必ず1つ以上特定される
- [ ] 「速く処理する」と「安全に処理する」で結果が変わる（テストで両方の戦略を模擬して差が出る）
- [ ] `cleared` / `failed` 後に intent を送っても状態が変わらない
- [ ] 各アクティブ広告に毎 tick `threat` が計算され、`GAME_ENGINE_DESIGN.md §9.4` の設計表（自動音声>全画面>バナー>偽×ポップアップ>偽ダウンロード）と順序が一致する

## Test requirements

- 各リソースの単体テスト
- 戦略シミュレーション: 「即座に全部閉じる」vs「待って安全に閉じる」で異なる結果になること
- 失敗時の culprit 特定テスト（複数パターンが絡む状況で妥当な犯人が選ばれる）

## Definition of Done

- acceptance criteria を全て満たす
- 調整値はすべて `EngineTuning` にあり、コードにマジックナンバーがない

---

## 進捗記録

- 状態: 完了（2026-09-13）

### 決定ログ

#### 2026-09-13 threat の定数: THREAT_BLOCK_CONSTANT=1 / TRAP_RISK_FACTOR=0.1
- 決定: `threat = perSecondAlive + (blocksProgress ? 1 : 0) - onMistake × 0.1`。設計表の順序（自動音声 > 全画面 > バナー > 偽× > 偽DL）をテストで固定
- 却下案: block 定数 2 → 全画面（1.5+2）が自動音声（3）を上回り設計表と逆転
- 出典: GAME_ENGINE_DESIGN §9.4 の設計表

#### 2026-09-13 設問はエンジンの RunConfig.questions で持つ
- 決定: `{ id, correctChoice }[]` を RunConfig に渡し、`tasksTotal = questions.length`。正答で tasksDone++、誤答は patience 減（progress は戻さない）。設問なしなら読了のみでクリア
- 却下案: 設問判定を UI 側で行う → リプレイ・決定論から外れる
- 出典: OD-5 / TASK-015 要件 3

#### 2026-09-13 主犯特定は直近 10 秒の log + 生存中広告の drain（カタログから算出）
- 決定: perSecondAlive の drain は毎 tick なので log に出さず、失敗時に生存中の広告についてカタログ値 × 生存秒で加算する。直近窓に該当なし → 全期間 → 最後に出た広告 の順でフォールバック
- 却下案: drain を毎 tick log に積む → log が 60 件/秒で肥大
- 出典: session decision

### 作業ログ

- 2026-09-13: resource/{progress,patience,threat,outcome}.ts、run.ts で read/answer/scroll と tick 末尾の threat 計算・勝敗判定を接続。ActiveAd.mistakeCount と RunConfig.questions / timeLimitMs を追加。テスト 12 件。

### 証拠

```text
$ pnpm --filter @ad-jigoku/game-engine typecheck lint test → 9 files, 88 tests passed
  - 覆われている間 progress 不変 / read intent でのみ一定速度で進む / total 到達でクリア
  - ミスなし処理で +3 回復、上限 100 / ミスありは回復なし
  - patience 0 → 次 tick で failed、culprit = CLS-11（-25 を与えたパターン）
  - drain のみの失敗で culprit = ATT-02（フォールバック）
  - threat 順序: ATT-02 > OBS-01(block) > OBS-03 > CLS-11 > DEC-02
  - 戦略比較: 「即連打」は too-early が発生し「待って閉じる」より patience が低い
```
