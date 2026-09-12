# TASK-013C — Shell: fakeDownload / fakePlay（専用デザイン）

- Milestone: M3 / Phase 1
- Depends on: 013
- Size: 1 session
- **DECISIONS_v0.2.md §1.3, §1.6 により新設**: 偽装系（カテゴリ E）は「1パターン1シェル」。
  MVP はこの2つに限定する（C3、DECISIONS_v0.2.md §4）

## Objective

`fakeDownload`（DEC-02）と `fakePlay`（DEC-03）を、それぞれ**専用デザイン**として実装する。
このプロダクトが「本気でふざける」を最も体現すべき領域。

## Context

`DECISIONS_v0.2.md §1.3`「カテゴリE（偽装系8パターン）は1パターン1シェル。ここは設計品質の勝負所で、
『本気でふざける』の予算を最も配分する場所」。他の6偽装パターンは post-MVP（§4 C3）。

## Files to create

```text
packages/ui/shells/fakeDownload/index.tsx
packages/ui/shells/fakeDownload/fakeDownload.module.css
packages/ui/shells/fakePlay/index.tsx
packages/ui/shells/fakePlay/fakePlay.module.css
```

## Implementation requirements

1. `supports`: 両方とも `deception`, `hitbox`
2. **共通化しない。** 他のシェル（`popup` 等）の部品を流用してよいが、見た目の作り込みはこの2つの
   ためだけに行う
3. 「ダウンロードボタンに見える広告」「再生ボタンに見える広告」として、実際のダウンロード導線・
   再生導線と紛らわしいレイアウトを作る。ただし:
   - 支援技術には嘘をつかない（`aria-label` は正直に。TASK-013 の `FakeCloseButton` と同じ原則を
     `fakeDownload`/`fakePlay` 全体にも適用する）
   - 実在ブランド・実在アプリアイコンを模倣しない（DESIGN §3 MUST NOT 9）
   - 見分けるための tell を必ず残す余地をデザインに組み込む（実際の tell 配置は TASK-019 の behavior 側）
4. `DESIGN.md §23` のコンプライアンスパスを**必ず**実施する（handoff 表で明示的に必須）

## Acceptance criteria

- [ ] 2シェルが `Shell` インターフェースを満たす
- [ ] 実在ブランド・実在アプリアイコンを一切含まない
- [ ] 支援技術（スクリーンリーダー）に対しては真の動作を伝える
- [ ] tell を差し込める余地（視覚的なバリエーションポイント）が用意されている
- [ ] `/dev/shells` で確認できる
- [ ] `DESIGN.md §23` のコンプライアンスチェックを実施し、結果を PR に記載（**必須**）

## Test requirements

- 視覚回帰スナップショット（mobile / desktop）
- axe によるコントラスト・ラベル検証
- 実在ブランド類似性の目視レビュー（自動検査が難しいため PR レビューで確認）

## Definition of Done

- acceptance criteria を全て満たす
- TASK-019（deception/hitbox behavior）がこれらのシェルを前提に着手できる状態
- 「安っぽいパロディになっていないか」を `DESIGN_REQ §22` の Visual チェックリストで自己評価し、
  結果を PR に書く
