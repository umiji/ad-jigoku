# ADR-006: Layout Shift を transform で擬似再現する

- Status: Proposed
- Date: 2026-09-12
- Drivers: AD-6

## Context

`LAY-01 Layout Shift` / `LAY-02 Scroll Jump` / `LAY-03 Content Pushdown` を
ゲームと LP で再現したい。最も素直な実装は、実際に要素を挿入して reflow させることである。

しかし:
- 本物の CLS が悪化する。「広告UXを測るサービス」自身の CLS が悪いのは自己矛盾
- スクリーンリーダーのフォーカス位置が実際に飛ぶ。これは演出ではなく実害（DESIGN §20 違反）
- `prefers-reduced-motion` で止めるのが難しい

## Decision

レイアウト変動は `transform: translateY()` による見た目の移動で再現する。
実際の document flow は変えない。

- 視覚的な結果は同一
- 実 CLS は 0 のまま（ARCHITECTURE §15 の予算を守れる）
- reduced-motion では transform を 0 にし、代わりに「一瞬のフェード」で状態変化だけ伝える
- フォーカス・スクロール位置・支援技術への影響はゼロ

## Consequences

### 良い
- `annoying by design, safe by implementation` (DESIGN_REQ §14) の具体的な実現
- 自分のサイトの Core Web Vitals を犠牲にしない

### 悪い
- 「本物のレイアウトシフトの不快さ」を 100% は再現できない
  （本物はテキストの折り返しまで変わる）

### 注記
これは**ゲーム/LP 側の話**である。`packages/evaluator-core` が実サイトの CLS を
測るときは当然 Performance API の実測値を使う。混同しないこと。
