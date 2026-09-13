# TASK-014 — ゲームホスト（rAF / ViewState→DOM / 入力→Intent）

- Milestone: M2 / Phase 1
- Depends on: 007, 013
- Size: 1 session

## Objective

`game-engine` と React を接続する薄い層を実装する。
**ゲームロジックをこの層に書かない。**

## Context

ADR-002。エンジンは純粋、宿主が時間・入力・描画・副作用を担当する。
`GAME_ENGINE_DESIGN.md §5, §10`。

## Files to create

```text
apps/web/src/game/GameHost.tsx          rAF ループと state 保持
apps/web/src/game/AdLayer.tsx           ViewState[] → AdPopup[] の描画
apps/web/src/game/useEngine.ts
apps/web/src/game/intentFromEvent.ts    DOM イベント → Intent
apps/web/src/game/effects.ts            Effect の実行（音・振動・演出）
apps/web/src/game/a11yProfile.ts        matchMedia から AccessibilityProfile を作る
```

## Implementation requirements

1. rAF ループ + アキュムレータ（`GAME_ENGINE_DESIGN.md §5`）。
   `dtMs` は 200ms クランプ
2. `document.hidden` のとき tick を止める（バックグラウンドで patience が減り続けない）
3. DOM イベント → `Intent` の変換:
   - クリック対象の `data-target` 属性から `TargetRef` を作る。**座標を使わない**
   - スクロールは論理量（行数）に正規化
4. `AccessibilityProfile` の構築:
   - `prefers-reduced-motion` → `reducedMotion`
   - `pointer: coarse` → `pointerPrecision`
   - 音声は**既定 OFF**。ユーザーが明示的に ON にしたときだけ `audioEnabled: true`
   - メディアクエリの変化を監視し、`{ t: 'a11y' }` intent で反映
5. `ViewState` → DOM のマッピング:
   - `surface` → レイアウト方式
   - `stackIndex` → `zIndex` トークン（`popup` / `popup_stack` / `critical`）
   - `motion` → CSS クラス。`reducedMotion` 時は動きのあるものを落とす
   - **DOM 側で独自の挙動判断をしない。** 全部 ViewState の反映
6. `Effect` の実行:
   - `sound` は `audioEnabled` が false なら握り潰す（SAFE-04）
   - `shake` / `rage` は reducedMotion で減衰
7. React の再レンダを抑える: `ViewState` の差分だけ更新。60fps を保つ

## Acceptance criteria

- [ ] 画面上でゲームが動く（noop simulator でも可）
- [ ] タブを離して戻っても patience が飛ばない
- [ ] `prefers-reduced-motion` を ON にすると動きが減り、**ゲームは同じように遊べる**
- [ ] 音声は既定で鳴らない
- [ ] `AdLayer` に条件分岐によるゲームロジックが存在しない（レビュー観点）
- [ ] Chrome DevTools の Performance で step 処理が 2ms 以内

## Test requirements

- `intentFromEvent` の単体テスト
- `a11yProfile` のメディアクエリ反映テスト
- Playwright: reduced-motion 環境でクリアできることの e2e

## Definition of Done

- acceptance criteria を全て満たす
- `GameHost.tsx` が 200 行以内（ロジックが漏れ出していない証拠）

---

## 進捗記録

- 状態: 完了（2026-09-14）

### 決定ログ

#### 2026-09-13 宿主ループは React から独立した純粋な駆動器（loop.ts）+ 薄い hook（useEngine）
- 決定: `advanceFrame(loop, dt, hidden, reading)` が固定ステップ分割・intent 適用・phase 停止を担い、`useEngine` は rAF と setState だけ。再レンダは state 参照が変わったフレームのみ
- 却下案: useEffect + setInterval → フレーム同期せず、hidden 制御と決定論的な intent 順序が崩れる
- 出典: GAME_ENGINE_DESIGN §5

#### 2026-09-13 未登録 shellId は GenericShell にフォールバック
- 決定: AdLayer は `shells[shellId] ?? GenericShell`。TASK-013A/B の本実装が入るまでも「画面上でゲームが動く」を保証し、見えたら未実装の印
- 出典: TASK-014 acceptance「noop simulator でも可」

#### 2026-09-14 /game は mounted 後にのみ描画（hydration mismatch 回避）
- 決定: seed を URL から読むため SSR と CSR の出力がずれる。`GameEntry` は mount 後に `GameEntryClient` を描く
- 出典: e2e（desktop）で検出した hydration エラー

### 証拠

```text
$ pnpm --filter @ad-jigoku/web test → 29 tests（intentFromEvent / a11yProfile / effects / loop / frame / hud）
$ npx playwright test e2e/game.spec.ts → 10 passed（mobile + desktop）: 出現→閉じる→HUD 追従、SAFE-03/05/06/12、読了→設問→クリア→再挑戦、reduced-motion
$ step() 実測（headless, stage-1 3600 tick）: avg 0.004ms / p95 0.006ms / max 0.88ms（要件 2ms 以内）
GameHost.tsx: 111 行（200 行以内）。AdLayer に条件分岐によるゲームロジックなし（shellId → コンポーネント選択のみ）
```
