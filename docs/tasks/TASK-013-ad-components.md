# TASK-013 — canonical 広告コンポーネント基盤（parts）

- Milestone: M2 / Phase 1
- Depends on: 002
- Size: 1 session
- **DECISIONS_v0.2.md §1.3 により改訂**: シェル本体（`popup` 等の完成した見た目コンポーネント）は
  TASK-013A / 013B / 013C に分離する。本タスクは**シェルが共通して組み立てに使う部品（parts）**の
  基盤に範囲を絞る

## Objective

`DESIGN.md §21` の canonical component のうち、広告表現の**部品（parts）**となるものを実装する。
**LP とゲームの両方がこれを使う**（ADR-005）。完成した見た目（Shell）は本タスクの成果物を
組み合わせて TASK-013A/B/C が作る。

## Context

`DESIGN.md §8` の anatomy、`§9` のパターン対応表、`§16` の形状ルール、`§19` のレスポンシブ。
ここが「本気でふざける」の実体。安っぽくなったら失敗。

## Files to create

```text
packages/ui/components/AdMeta.tsx            PR / Sponsored ラベル
packages/ui/components/AdHeadline.tsx
packages/ui/components/AdCTA.tsx
packages/ui/components/AdLegal.tsx           極小の注意書き
packages/ui/components/AdCountdown.tsx
packages/ui/components/CloseButton.tsx       real close
packages/ui/components/FakeCloseButton.tsx
packages/ui/components/AdCreative.tsx        抽象的なダミービジュアル
packages/ui/components/index.ts              allowlist
packages/ui/shells/                          TASK-013A/B/C が使う空ディレクトリ（各 shell は独立モジュール）
```

## Implementation requirements

1. 各 part は `DESIGN.md §8` の anatomy 要素（ラベル / 見出し / 本文 / ビジュアル / CTA / 極小注意書き /
   閉じるボタン）に対応する。**parts を組み合わせて1つの Shell（例: `popup`）を作るのは TASK-013A 以降**
2. **全ての part は挙動を持たない。** 表示状態を props で受け取るだけの presentational component。
   閉じるタイミング・移動・再出現は呼び出し側（behavior / LpFlow）が決める
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
   架空の商品名・抽象グラフィック・タイポグラフィで構成する。数百件の Creative データ本体は
   TASK-013D で用意する。ここでは1つのプレースホルダ Creative を受け取って描画できれば足りる
7. コピーは `DESIGN.md §13` の語彙から。データとして外出しする（ハードコードしない / OD-9）
8. 全コンポーネントに Storybook 相当の確認ページ（`/dev/components`）を用意する

## Acceptance criteria

- [ ] `DESIGN.md §8` の全要素が part として存在し、TASK-013A の `popup` シェルから組み立てられることを
      サンプルで確認できる
- [ ] 生の16進カラー・生の z-index がゼロ（lint が通る）
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
