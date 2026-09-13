# TASK-019 — deception / hitbox slot behavior（CLS-11 / DEC-02 / DEC-03）

- Milestone: M3 / Phase 1
- Depends on: 017, 013A, 013C
- Size: 1 session

> **v0.2 改訂**: 「simulator」を「behavior（`deception` / `hitbox` スロット）」に読み替える。
> **前提条件: 対応する Shell（`popup`、および `fakeDownload` / `fakePlay`）が実装済みであること**
> （TASK-013A, TASK-013C）。

## Objective

騙し系パターンを実装する。**このゲームで最も繊細な領域。**

## Context

GAME §15.3「Deception must be learnable」。
DESIGN.md §20「支援技術を騙してはいけない」。
`CLS-11 Fake Close` は Severity 18 の最重要パターンで、ゲームの看板でもある。

## Files to create

```text
packages/game-engine/src/behaviors/deception.ts
packages/game-engine/src/behaviors/hitbox.ts
packages/game-engine/src/behaviors/*.test.ts
```

## Implementation requirements

1. **CLS-11 Fake Close**:
   - 本物の × と偽の × が同時に存在する
   - どちらが本物かは `rng('deception')` で決まる（決定論的）
   - 偽 × を押す → `{ kind: 'mistake', reason: 'fake-close' }` + 大きな patience 減少
   - **外部遷移は絶対にしない**（SAFE-05）。「広告が開いた」という**演出**のみ
   - **見分けるための tell が必ず存在する**（GAME §15.3）:
     - 例: 偽 × はわずかに位置がずれている / ラベルが微妙に違う / 枠の外側にある
     - tell は難易度によって分かりやすさが変わるが、**ゼロにはしない**
   - `aria-label` は正直に。スクリーンリーダー利用者には「これは広告のリンクです」と伝える
     - **視覚的な騙しはゲーム。支援技術への嘘はダークパターン。** 線を引く
2. **DEC-02 Fake Download / DEC-03 Fake Play**:
   - ダウンロードボタン/再生ボタンに見える広告
   - **正解は「押さないこと」** (`correctInaction: true`)
   - ただし「押さない」を能動的な選択として評価するため、`REPORT` アクションで
     「これは偽物だ」と宣言できる（`GAME_ENGINE_DESIGN.md §13 Q3`）
   - 押した場合: 実際のダウンロードは発生しない（SAFE-09）。演出のみ
3. 失敗後に**必ず何が起きたか説明する**（GAME §15.1）。
   `EncounterEvent` に tell の内容を記録し、結果画面で「偽×はここが違った」と出せるようにする

## Acceptance criteria

- [ ] 偽×を押しても外部遷移しない（Playwright で cross-origin navigation ゼロを検証）
- [ ] 実際のダウンロードが発生しない
- [ ] `aria-label` が偽UIの真の動作を説明している
- [ ] 全ての偽UIに tell が存在する（テストで各パターンの tell を検証）
- [ ] 失敗時に tell の内容が結果画面用データとして記録される
- [ ] 同じ seed で本物/偽物の配置が再現される
- [ ] `REPORT` で見抜いたことが評価される

## Test requirements

- 単体テスト（本物/偽物の判定）
- tell の存在検証テスト（全難易度で）
- SAFE-05 / SAFE-09 の e2e
- スクリーンリーダー向けラベルの検証（axe + 手動確認）

## Definition of Done

- acceptance criteria を全て満たす
- 「視覚的な騙し」と「支援技術への嘘」の境界が README に明記されている
