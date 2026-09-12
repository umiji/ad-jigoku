# TASK-013A — Shell: popup / interstitial / stickyBanner / inlineRect

- Milestone: M2 / Phase 1
- Depends on: 013
- Size: 1 session
- **DECISIONS_v0.2.md §1.3 により新設**: TASK-013 から分離した汎用シェル4種

## Objective

MVP で使う汎用シェル4種（`popup` / `interstitial` / `stickyBanner` / `inlineRect`）を実装する。
各シェルは独立モジュールであり、共通化しない。

## Context

`ARCHITECTURE.md §7.3`、`GAME_ENGINE_DESIGN.md §7.1`。TASK-013 の parts（AdMeta / AdHeadline / AdCTA /
CloseButton / FakeCloseButton / AdCreative 等）を組み合わせて Shell を構成する。

## Files to create

```text
packages/ui/shells/popup/index.tsx
packages/ui/shells/popup/popup.module.css
packages/ui/shells/interstitial/index.tsx
packages/ui/shells/interstitial/interstitial.module.css
packages/ui/shells/stickyBanner/index.tsx
packages/ui/shells/stickyBanner/stickyBanner.module.css
packages/ui/shells/inlineRect/index.tsx
packages/ui/shells/inlineRect/inlineRect.module.css
```

## Implementation requirements

1. 各シェルは `Shell` インターフェース（`GAME_ENGINE_DESIGN.md §7`）を満たす:
   `id` / `parts`（描画する AdPart） / `supports`（受け付ける Slot）
2. `supports` の宣言例:
   - `popup`: `close`, `attention`, `deception`, `hitbox`
   - `interstitial`: `surface`, `close`
   - `stickyBanner`: `surface`, `attention`, `persist`
   - `inlineRect`: `attention`, `instability`
   （生成器の R2 検証がこの宣言を使う。過大/過小に宣言しない）
3. TASK-013 の parts のみを組み合わせる。**シェル固有の新しい part を作らない**
   （必要なら TASK-013 に部品を追加提案する）
4. 形状・色は `DESIGN.md` のトークンのみ。生の16進カラー・任意値を使わない
5. `ViewState.shellId` を見て自身を選択する仕組みは TASK-014 のホスト側で行う。ここでは
   シェル単体が `ViewState` の該当フィールドを正しく描画できることを保証する

## Acceptance criteria

- [ ] 4シェル全てが `Shell` インターフェースを満たす
- [ ] 各シェルの `supports` が実際に描画・処理できるスロットと一致する（過大宣言なし）
- [ ] `/dev/components` （または `/dev/shells`）で4シェル全ての見た目を確認できる
- [ ] `DESIGN.md §23` のコンプライアンスチェックを実施し、結果を PR に記載
- [ ] 視覚回帰テストが4シェル分ある

## Test requirements

- 各シェルの視覚回帰スナップショット（mobile / desktop）
- `supports` 宣言と実装の整合テスト

## Definition of Done

- acceptance criteria を全て満たす
- TASK-017/018/020/021/022 がこれらのシェルを前提に着手できる状態
