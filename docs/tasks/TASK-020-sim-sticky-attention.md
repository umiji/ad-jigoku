# TASK-020 — sticky / attention（OBS-03 / OBS-06 / ATT-01 / ATT-02）

- Milestone: M3 / Phase 1
- Depends on: 017
- Size: 1 session

## Objective

追従系と注意奪取系のパターンを実装する。
**ATT-02 Auto-play Sound の扱いが設計上の要注意点。**

## Context

`GAME_ENGINE_DESIGN.md §7.2`。DESIGN_REQ §12 / DESIGN §20 で自動再生は禁止されている。

## Files to create

```text
packages/game-engine/src/simulators/sticky.ts
packages/game-engine/src/simulators/attention.ts
packages/game-engine/src/simulators/*.test.ts
apps/web/src/game/views/StickyView.tsx
```

## Implementation requirements

1. **OBS-03 Sticky Bottom / OBS-06 Floating Video**:
   - スクロールしても追従する
   - viewport 占有率を持つ（`blockProgress` の判定に使う）
   - モバイルでは占有率の上限を設ける（実際に遊べなくなるのを防ぐ）
   - **ActionBar と重ならないこと**（TASK-016 との調整）
2. **ATT-01 Auto-play Video**:
   - 実際に動画を再生してよい（音なし、軽量、ループ、`playsinline`）
   - `reducedMotion` 時は静止画に置き換える
3. **ATT-02 Auto-play Sound — 実際に音を鳴らさない**:
   - 「🔊 音声が再生されています」という**偽の表示**を出す
   - 実音は `accessibility.audioEnabled === true`（ユーザーが明示的にONにした）ときのみ
   - ゲームメカニクス（音源を止める操作を要求する）は音の有無に関わらず成立する
   - **理由: 「音を鳴らす広告を批判するサイトが勝手に音を鳴らす」矛盾を避ける**
     （DESIGN_REQ §12 の明示的な要求）
4. sticky は `zIndex.sticky` を使う。popup より下

## Acceptance criteria

- [ ] sticky 広告がスクロールに追従する
- [ ] sticky 広告がモバイル viewport の上限占有率を超えない
- [ ] sticky 広告と ActionBar が重ならない
- [ ] **音声 OFF（既定）の状態で ATT-02 が完全に遊べる**
- [ ] `AudioContext.resume()` がユーザー操作なしに呼ばれない（SAFE-04）
- [ ] `reducedMotion` で動画が静止画になる
- [ ] 動画がメインスレッドをブロックしない

## Test requirements

- 追従の e2e テスト
- 占有率の実測テスト
- SAFE-04 テスト（AudioContext のモックで検証）
- reducedMotion での静止画置換テスト

## Definition of Done

- acceptance criteria を全て満たす
- ATT-02 の「音を鳴らさずに音のパターンを体験させる」設計判断が README に記録されている
