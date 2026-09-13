# TASK-013C — Shell: fakeDownload / fakePlay（専用デザイン）

- Milestone: M3 / Phase 1
- Depends on: 013
- Size: 1 session

> **v0.2 新規（`DECISIONS_v0.2.md` §1.3, §1.6, ADR-009）**: カテゴリ E（偽装系）は
> **1パターン1シェル**。ここが設計品質の勝負所であり、「本気でふざける」の予算を最も配分する場所
> （`DECISIONS_v0.2.md` §4 C3）。汎用シェルの使い回しでは成立しない。

## Objective

`DEC-02 Fake Download` / `DEC-03 Fake Play` 専用のシェルを、それぞれ独立したデザインで実装する。

## Context

`DECISIONS_v0.2.md §1.3`。「偽装系はシェル横断で共通化しない」という原則を最も強く適用する場所。
`GAME §15.3`「Deception must be learnable」との両立が必要（tell を必ず持つ）。

## Files to create

```text
packages/ui/shells/fakeDownload/FakeDownload.tsx
packages/ui/shells/fakeDownload/fakeDownload.css
packages/ui/shells/fakePlay/FakePlay.tsx
packages/ui/shells/fakePlay/fakePlay.css
```

## Implementation requirements

1. `fakeDownload`:
   - `supports: ['spawn', 'deception']`
   - ダウンロードボタンに見えるが、押しても実際のダウンロードは発生しない（SAFE-09）
   - **tell を必ず持つ**（TASK-019 の deception behavior と連携。例: ファイルサイズ表記が
     不自然、拡張子アイコンが実際のファイル形式と矛盾する等）
2. `fakePlay`:
   - `supports: ['spawn', 'deception']`
   - 再生ボタンに見えるが、押しても外部遷移しない（SAFE-05）
   - tell を必ず持つ（例: 再生アイコンの三角がわずかに歪んでいる、プログレスバーが動かない）
3. **`aria-label` は正直に。** スクリーンリーダー利用者には実際の動作（「これは広告のリンクです」）
   を伝える。視覚的な騙しはゲーム、支援技術への嘘はダークパターン（`TASK-019` と同じ線引き）
4. TASK-013 の parts を土台にしつつ、この2シェルは**独自のビジュアル言語を持ってよい**
   （実在ブランドは模倣しない。`DESIGN.md §3` MUST NOT 9）
5. `DESIGN.md §23` のコンプライアンスパスを**特に厳密に**実施する

## Acceptance criteria

- [ ] `fakeDownload` を押しても download イベントが発生しない（Playwright で検証）
- [ ] `fakePlay` を押しても外部遷移しない（cross-origin navigation ゼロ）
- [ ] 両シェルに tell が存在し、全難易度でゼロにならない
- [ ] `aria-label` が実際の動作を説明している
- [ ] 「安っぽいパロディになっていないか」を `DESIGN_REQ §22` の Visual チェックリストで自己評価
- [ ] `DESIGN.md §23` のコンプライアンスパス実施済み

## Test requirements

- SAFE-05 / SAFE-09 の e2e
- tell の存在検証（axe + 視覚回帰）
- aria-label の検証（axe + 手動確認）

## Definition of Done

- acceptance criteria を全て満たす
- 「視覚的な騙し」と「支援技術への嘘」の境界が README に明記されている
