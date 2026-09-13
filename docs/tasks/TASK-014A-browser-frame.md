# TASK-014A — BrowserFrame（偽ブラウザ枠）

- Milestone: M2 / Phase 1
- Depends on: 014
- Size: 1 session

> **v0.2 新規（`DECISIONS_v0.2.md` §2 全体、ADR-010）**: ゲーム領域を包む偽ブラウザ UI。
> ハイジャック系パターン（偽の戻る操作・偽スクロール等）を安全に作用させるための構造。
> **SAFE-12 の直接の実装対象。**

## Objective

`BrowserFrame`（タブ／URL バー／戻る・進む／独自スクロールコンテナを持つ偽ブラウザ UI）を実装する。

## Context

`ARCHITECTURE.md §5, §8.2, §11`、`DECISIONS_v0.2.md §2`。
v0.1 では `INT-06 Back-Intercept`、`ACC-06 Scroll Hijack`、`CLS-14 Close State Reset`、
`PER-04 Cross-page`、`INT-04 Click-Triggered Interstitial` が SAFE-03/06 抵触で実装不可能だった。
BrowserFrame がこれらを「偽の戻るボタン・偽のスクロール・偽のページ遷移」に対して安全に作用させる。

## Files to create

```text
apps/web/src/game/frame/BrowserFrame.tsx
apps/web/src/game/frame/FakeUrlBar.tsx
apps/web/src/game/frame/FakeBackButton.tsx
apps/web/src/game/frame/FakeScrollContainer.tsx
apps/web/src/game/frame/frameCapabilities.ts    端末プロファイル別の capability 定義
```

## Implementation requirements

1. `FrameCapability = 'back' | 'url' | 'tabs' | 'scrollContainer' | 'textInput' | 'linkNav'` を実装する
2. 端末プロファイルごとの capability:
   - mobile: `['back', 'url', 'scrollContainer', 'linkNav']`
   - desktop: `['back', 'url', 'tabs', 'scrollContainer', 'linkNav', 'textInput']`
3. パターンは `game.frame` で必要 capability を宣言し、生成器は現プロファイルで満たせない
   パターンを候補から外す（R8。`GAME_ENGINE_DESIGN.md §8.2`）
4. 偽ページ遷移は「同じ記事の別セクションへ遷移したフリ」。**実 URL は変えない**
   （`history.replaceState` すら使わない）
5. モバイルでは枠を最小化（上部の細いバーのみ）。縦の実面積を食わない
6. **SAFE-12 を満たす設計**:
   - Safari / Chrome の外観をコピーしない。`DESIGN.md` のダーク様式で、明らかに
     「ゲーム内 UI」と分かる見た目にする
   - 偽 URL バーに実在ドメインを表示しない（架空ドメインのみ）
   - 初回のみ「これはゲーム内の偽ブラウザです」相当のラベルを強調表示する
7. 実ブラウザの `history` / `window.scroll` には一切触れない

## Acceptance criteria

- [ ] `BrowserFrame` がゲーム画面を包んで表示される
- [ ] 偽の戻るボタンを操作しても実ブラウザの history が変化しない
- [ ] 偽スクロールコンテナの操作が実ページのスクロールに影響しない
- [ ] 偽 URL バーに実在ドメインが一度も表示されない（テストで検証）
- [ ] 既知ブラウザ（Safari/Chrome）の外観と視覚的に区別できる
- [ ] モバイルで枠が最小化され、縦の実面積を圧迫しない
- [ ] `DESIGN.md §23` のコンプライアンスパス実施済み

## Test requirements

- SAFE-12 の e2e（実在ドメイン非表示、実ブラウザ機能への非干渉）
- capability 宣言と生成器 R8 ルールの統合テスト
- 視覚回帰（mobile / desktop、既知ブラウザとの差分確認）

## Definition of Done

- acceptance criteria を全て満たす
- TASK-029 の SAFE-12 テストがこの実装に対して実際に通る
