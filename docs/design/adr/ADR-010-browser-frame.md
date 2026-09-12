# ADR-010: ゲーム領域を偽ブラウザ枠（BrowserFrame）で包む

- Status: Accepted
- Date: 2026-09-12
- Drivers: DECISIONS_v0.2.md §2（D3）

## Context

v0.1 では INT-06 Back-Intercept、ACC-06 Scroll Hijack、CLS-14 Close State Reset、PER-04 Cross-page、
INT-04 Click-Triggered Interstitial は SAFE-03（スクロールロック禁止）/ SAFE-06（Back 妨害禁止）に
抵触するため実装不可能だった。これらは「実ブラウザの機能を模倣するが実際には奪わない」構造がないと
安全に再現できない。

## Decision

ゲーム領域を、偽のブラウザ UI（タブ／URLバー／戻る・進む／独自スクロールコンテナ）で包む
`BrowserFrame` を導入する。広告は「偽ブラウザの中のページ」に出る。実ブラウザの `history` と
`window.scroll` には一切触れない。

```ts
type FrameCapability = 'back' | 'url' | 'tabs' | 'scrollContainer' | 'textInput' | 'linkNav'

mobile:  ['back', 'url', 'scrollContainer', 'linkNav']
desktop: ['back', 'url', 'tabs', 'scrollContainer', 'linkNav', 'textInput']
```

パターンは `frame` で必要 capability を宣言し、生成器は現プロファイルで満たせないパターンを候補から外す
（`GAME_ENGINE_DESIGN.md` §8.3 R8）。偽ページ遷移は同じ記事の別セクションへの「遷移したフリ」で、
`history.replaceState` すら使わない。モバイルでは枠を最小化する（上部の細いバーのみ）。

**新規安全制約 SAFE-12:** `BrowserFrame` は実ブラウザの UI（Safari/Chrome の外観）を模倣してはならず、
偽 URL バーに実在ドメインを表示してはならない。Browser-in-the-Browser はフィッシング手法であり、
ユーザーに偽の URL バーを信用させる訓練をしてはいけない（`ARCHITECTURE.md` §11）。

## Consequences

### 良い
- v0.1 で実装不可能だった5パターンが安全に実装できるようになる。D1（90パターンの組み合わせ）を
  成立させる最大の enabler
- 安全性が「気をつける」ではなく構造で保証される

### 悪い
- フィッシング手法との見た目の類似性というリスクを新たに抱える（SAFE-12 で緩和するが、最終判断は
  デザイン QA に依存する）
- BrowserFrame 自体の実装・デザイン工数が新たに発生する（TASK-014A）

### 却下した案
- 実ブラウザの `history` / `scroll` を実際に操作する: SAFE-03 / SAFE-06 に違反するため不可
- 該当5パターンを「実装不可能」としてゲーム化を諦める: D1 の前提と矛盾する
