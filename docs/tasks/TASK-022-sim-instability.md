# TASK-022 — instability behavior（LAY-01 Layout Shift、transform 方式）

- Milestone: M3 / Phase 1
- Depends on: 017, 013A（対応する Shell が存在すること。特定シェル専用ではなく既存シェルに `instability` を差す）
- Size: 1 session
- **DECISIONS_v0.2.md §1 により改訂**: 「simulator」を「behavior」に読み替える。本タスクは `instability`
  スロットの behavior を扱う

## Objective

レイアウト変動系のパターンを、`instability` スロットの behavior として**実際の reflow を起こさずに**実装する。

## Context

**ADR-006。** 本物の reflow は実 CLS を悪化させ、スクリーンリーダーのフォーカスを
実際に破壊する。見た目だけ再現し、実害をゼロにする。

## Files to create

```text
packages/game-engine/src/behaviors/instability-transform-shift.ts
packages/game-engine/src/behaviors/instability-transform-shift.test.ts
apps/web/src/game/views/ShiftContainer.tsx
```

## Implementation requirements

1. `transform: translateY()` で本文が押し下げられたように見せる。
   **document flow は変えない**
2. 押し下げ量・タイミングは `rng('jitter')` で決定論的に
3. `reducedMotion` 時:
   - transform を 0 にする
   - 代わりに一瞬のフェードで「何かが挿入された」ことだけ伝える
   - ゲームメカニクス（クリック対象がずれる）は**維持する**。
     ずれ量を 0 にすると難易度が変わってしまうので、代わりに
     「ターゲットが一瞬無効になる」等の等価な摩擦に置き換える
4. transform 中のクリック判定が視覚位置と一致すること
   （`ACC-07 Misaligned Click Target` は**別の意図的なパターン**なので、
   ここでバグとして混入させない）
5. 実 CLS が 0 のままであることを計測で確認する

## Acceptance criteria

- [ ] 見た目上はレイアウトがずれる
- [ ] 実 CLS が 0.05 以下（Performance API で計測）
- [ ] スクロール位置が実際には飛ばない
- [ ] スクリーンリーダーのフォーカスが失われない
- [ ] `reducedMotion` で動きが消えるが、難易度が維持される
- [ ] transform 中のクリック判定が視覚位置と一致する

## Test requirements

- 実 CLS の計測テスト（**このタスクの主目的**）
- クリック判定と視覚位置の一致テスト
- reducedMotion での難易度維持テスト
- フォーカス保持テスト

## Definition of Done

- acceptance criteria を全て満たす
- **M3 完了**: MVP 15 パターンが遊べる
- ADR-006 の判断がコードコメントに反映されている
