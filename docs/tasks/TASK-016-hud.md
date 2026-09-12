# TASK-016 — HUD（patience / progress / time / combo）

- Milestone: M2 / Phase 1
- Depends on: 014
- Size: 1 session

## Objective

ゲームの状態を伝える HUD と、対抗アクションのアクションバーを実装する。

## Context

GAME §5.1 の3リソースを可視化する。
`ARCHITECTURE OD-6` の入力モデル（ポインタ直接操作 + 固定アクションバー）に従う。
モバイル片手操作（DESIGN_REQ §13）と両立させる必要がある。

## Files to create

```text
apps/web/src/game/hud/Hud.tsx
apps/web/src/game/hud/PatienceMeter.tsx
apps/web/src/game/hud/ProgressBar.tsx
apps/web/src/game/hud/ComboIndicator.tsx
apps/web/src/game/hud/ActionBar.tsx        SMASH / DODGE / FOCUS / REPORT / ESCAPE
```

## Implementation requirements

1. **HUD 自体が邪魔になってはいけない。** これはゲームUIであって広告ではない。
   `DESIGN.md §12` の CTA 階層に従い、抑制された表現にする
2. Patience メーター:
   - 減少がアニメーションで分かる。**急減時は明確に警告**（`accent.danger`）
   - 数値ではなくバー。ただし残量が直感的に分かること
3. ActionBar:
   - 画面下部の thumb-zone に固定（モバイル）
   - **ただし `sticky ad` と視覚的に混同されてはいけない。** 明確に別のレイヤーとして見せる
     （ゲームUIと広告UIの区別がつかないと理不尽になる / GAME §15）
   - デスクトップではキーボードショートカットも用意（数字キー）
   - 使えないアクションはグレーアウト（GAME §6「全てのアクションが全てのパターンに効くわけではない」
     を学習できるように）
4. Combo 表示: 敵側コンボ名が出たときは「やられている」表現、
   プレイヤー側 chain は「決まっている」表現。混同しない
5. `safe-area-inset` 対応（DESIGN_REQ §13）
6. z-index は `zIndex.sticky`。広告（`popup`）より下。
   **HUD が広告を覆うと「広告を閉じる」操作が成立しなくなる**

## Acceptance criteria

- [ ] 3リソースが常に把握できる
- [ ] ActionBar と sticky 広告が視覚的に明確に区別できる
- [ ] 片手（親指）で全アクションに届く（390px 幅）
- [ ] キーボードで全アクションが実行できる
- [ ] `safe-area-inset` が効いている（iOS Safari 実機 or エミュレーション）
- [ ] HUD が広告を覆わない
- [ ] 横向き（landscape）で破綻しない（DESIGN_REQ §13）

## Test requirements

- タップ領域の実測テスト
- z 順の e2e テスト（広告が HUD より前面にあること）
- landscape / safe-area のスクリーンショットテスト

## Definition of Done

- acceptance criteria を全て満たす
- `DESIGN.md §23` のコンプライアンスパス実施済み
