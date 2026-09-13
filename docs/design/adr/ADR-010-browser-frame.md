# ADR-010: BrowserFrame（偽ブラウザ枠）でハイジャック系パターンを安全に作用させる

- Status: Accepted
- Date: 2026-09-12
- Drivers: D3（`DECISIONS_v0.2.md` §2）

## Context

v0.1 では `INT-06 Back-Intercept`、`ACC-06 Scroll Hijack`、`CLS-14 Close State Reset`、
`PER-04 Cross-page`、`INT-04 Click-Triggered Interstitial` は SAFE-03（スクロールを恒久ロックしない）
/ SAFE-06（ブラウザ Back を妨害しない）に抵触するため実装不可能だった。これらは合計で
90パターンの相当数を占め、「90パターンの組み合わせを受け入れる」（D1）を成立させる上で
最大の障害になっていた。

## Decision

ゲーム領域を**偽のブラウザ UI（タブ／URL バー／戻る・進む／独自スクロールコンテナ）**である
`BrowserFrame` で包む。広告は「偽ブラウザの中のページ」に出る。

- `FrameCapability = 'back' | 'url' | 'tabs' | 'scrollContainer' | 'textInput' | 'linkNav'` を
  端末プロファイルごとに宣言し、パターンは `frame` で必要 capability を宣言する
- 偽ページ遷移は「同じ記事の別セクションへ遷移したフリ」。実 URL は変えない
  （`history.replaceState` すら使わない）
- **新規 SAFE-12**: `BrowserFrame` は実ブラウザ UI を模倣しない。Safari/Chrome の外観をコピーせず、
  偽 URL バーに実在ドメインを表示しない（Browser-in-the-Browser フィッシング手法との類似を避ける）

## Consequences

### 良い

- 実ブラウザの `history` / `window.scroll` に一切触れずに、ハイジャック系パターンを安全に体験させられる
- 「安全性は気をつけることではなく構造で保証される」という ADR-007 の方針をさらに一段強化する
- D1（90組み合わせ）が実際に成立する最大の enabler になる

### 悪い

- 追加の UI レイヤーを実装・維持するコストが発生する
- BrowserFrame 自体が「本物っぽすぎる」と SAFE-12 に抵触するリスクがあり、デザイン QA の負荷が増える

### 緩和

- SAFE-12 を自動テストで強制する（`ARCHITECTURE.md §11`）
- モバイルでは枠を最小化（上部の細いバーのみ）し、縦の実面積を食わない
