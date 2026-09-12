# TASK-013 — canonical 広告コンポーネント群

- Milestone: M2 / Phase 1
- Depends on: 002
- Size: 1 session

## Objective

`DESIGN.md §21` の canonical component のうち、広告表現の中核となるものを実装する。
**LP とゲームの両方がこれを使う**（ADR-005）。

## Context

`DESIGN.md §8` の anatomy、`§9` のパターン対応表、`§16` の形状ルール、`§19` のレスポンシブ。
ここが「本気でふざける」の実体。安っぽくなったら失敗。

## Files to create

```text
packages/ui/components/AdPopup.tsx
packages/ui/components/AdMeta.tsx            PR / Sponsored ラベル
packages/ui/components/AdHeadline.tsx
packages/ui/components/AdCTA.tsx
packages/ui/components/AdLegal.tsx           極小の注意書き
packages/ui/components/AdCountdown.tsx
packages/ui/components/CloseButton.tsx       real close
packages/ui/components/FakeCloseButton.tsx
packages/ui/components/AdCreative.tsx        抽象的なダミービジュアル
packages/ui/components/index.ts              allowlist
packages/ui/creatives/                       ダミー広告素材（架空）
```

## Implementation requirements

1. `AdPopup` は `DESIGN.md §8` の anatomy をそのまま実装:
   ラベル / 見出し / 本文 / ビジュアル / CTA / 極小注意書き / 閉じるボタン
2. **`AdPopup` は挙動を持たない。** 表示状態を props で受け取るだけの presentational component。
   閉じるタイミング・移動・再出現は呼び出し側（ゲームエンジン / LpFlow）が決める
3. 形状（DESIGN §16）: `popup_radius: 2px`、ハードエッジ、抑制された影。
   **角丸カード + でかいぼかし影にしない**
4. `CloseButton` の実タップ領域は最小 44×44（DESIGN §19）。
   見た目が小さい `TinyClose` でも**当たり判定は 44px を確保する**
   （DESIGN_REQ §5.3 Pattern C の但し書き。ゲームとして不公平にしない）
5. `FakeCloseButton`:
   - `aria-label` で「これは広告のCTAです」と正しく伝える（スクリーンリーダーを騙さない）
   - 視覚的に紛らわしくてよいが、**支援技術には嘘をつかない**
   - 押しても外部遷移しない（SAFE-05）
6. `AdCreative`: 実在ブランドを模倣しない（DESIGN §3 MUST NOT 9）。
   架空の商品名・抽象グラフィック・タイポグラフィで構成する
7. コピーは `DESIGN.md §13` の語彙から。データとして外出しする（ハードコードしない / OD-9）
8. 全コンポーネントに Storybook 相当の確認ページ（`/dev/components`）を用意する

## Acceptance criteria

- [ ] `DESIGN.md §8` の全要素が `AdPopup` に存在する
- [ ] 生の16進カラー・生の z-index がゼロ（lint が通る）
- [ ] mobile 390px 幅で popup が `calc(100vw - 32px)` 以内に収まる
- [ ] 全ての close ボタンの当たり判定が 44×44 以上（テストで実測）
- [ ] `FakeCloseButton` の `aria-label` が本当の動作を説明している
- [ ] キーボードだけで全コンポーネントを操作できる。フォーカスリングが見える
- [ ] `/dev/components` で全バリエーションを確認できる
- [ ] `DESIGN.md §23` のコンプライアンスチェックリストを実施し、結果を PR に記載

## Test requirements

- 当たり判定サイズの Playwright 実測テスト
- コントラスト比の自動検証（axe）
- 視覚回帰スナップショット（mobile / desktop）

## Definition of Done

- acceptance criteria を全て満たす
- 「安っぽいパロディになっていないか」を `DESIGN_REQ §22` の Visual チェックリストで自己評価し、
  結果を PR に書く
