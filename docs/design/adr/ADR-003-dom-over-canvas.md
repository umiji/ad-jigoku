# ADR-003: ゲーム描画は DOM。Canvas / WebGL を使わない

- Status: Proposed
- Date: 2026-09-12
- Drivers: AD-7, AD-8, AD-9

## Context

「ブラウザゲーム」と聞くと Canvas / Phaser / PixiJS が候補に上がる。
しかしこのゲームの敵は **Webページそのもの** である。

## Decision

ゲーム画面は通常の DOM + CSS で構築する。Canvas は破壊演出のパーティクルにのみ許可し、
ゲームロジックを持たせない。WebGL は使わない。

## Rationale

1. **パロディの忠実性**: `position: fixed` の追従、z-index の積み重なり、実際のタップ領域の狭さ、
   本文が押し下げられる感覚 — これらは DOM でしか再現できない。Canvas で描いた「広告の絵」は
   広告UXのパロディにならない。
2. **アクセシビリティ**: DESIGN.md §20 はキーボード操作・フォーカス可視化・スクリーンリーダー用
   close ラベルを MUST としている。Canvas でこれを満たすのは非現実的。
3. **44×44 タップ領域** (DESIGN §19): DOM なら Playwright で実測して自動検証できる。
4. **性能要件の性質**: DESIGN §20 の要求は「重くしないこと」であって、大量スプライトの
   60fps 描画ではない。DOM で十分。
5. **AMIX への態度**: AMIX_DESIGN_REFERENCE §4 は「おしゃれだからという理由だけの3D」を
   明確に却下している。

## Consequences

### 良い
- a11y / safety invariant テストがそのまま使える
- LP とゲームでコンポーネント (`packages/ui`) を共有できる
- 実装が Web 標準の範囲に収まり、デバッグが容易

### 悪い
- 数百要素の同時アニメーションは苦手（Ad Density Hell の上限に影響）
- 派手な破壊演出の自由度は Canvas に劣る

### 緩和
- 同時表示数に上限を設ける（そもそも DESIGN §19 が要求している）
- 演出のみ Canvas オーバーレイを重ねる
