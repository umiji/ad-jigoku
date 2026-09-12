# TASK-014A — BrowserFrame

- Milestone: M2 / Phase 1
- Depends on: 014
- Size: 1 session
- **DECISIONS_v0.2.md §2 により新設**（ADR-010）

## Objective

ゲーム領域を包む偽ブラウザ枠 `BrowserFrame`（タブ／URLバー／戻る・進む／独自スクロールコンテナ）を実装する。
これが INT-06 Back-Intercept、ACC-06 Scroll Hijack、CLS-14 Close State Reset、PER-04 Cross-page、
INT-04 Click-Triggered Interstitial を安全に成立させる enabler になる。

## Context

`ARCHITECTURE.md §7.3`（BrowserFrame との関係）、`DECISIONS_v0.2.md §2`、ADR-010。
**新規安全制約 SAFE-12** の対象。実ブラウザの `history` / `window.scroll` には一切触れない。

## Files to create

```text
apps/web/src/game/frame/BrowserFrame.tsx
apps/web/src/game/frame/FakeUrlBar.tsx
apps/web/src/game/frame/FakeTabs.tsx
apps/web/src/game/frame/FakeBackButton.tsx
apps/web/src/game/frame/FrameScrollContainer.tsx
apps/web/src/game/frame/capabilities.ts        FrameCapability の型とプロファイル定義
```

## Implementation requirements

1. `FrameCapability` は `DECISIONS_v0.2.md §2.3` の型のとおり実装する:
   ```ts
   type FrameCapability = 'back' | 'url' | 'tabs' | 'scrollContainer' | 'textInput' | 'linkNav'
   mobile:  ['back', 'url', 'scrollContainer', 'linkNav']
   desktop: ['back', 'url', 'tabs', 'scrollContainer', 'linkNav', 'textInput']
   ```
2. **実ブラウザの `history` / `window.scroll` に一切触れない。** 戻る・スクロールは全て
   `BrowserFrame` 内部の状態として完結させる
3. 偽ページ遷移は「同じ記事の別セクションへ遷移したフリ」。`history.replaceState` すら使わない
4. モバイルでは枠を最小化する（上部の細いバーのみ。縦の実面積を食わない）
5. **SAFE-12（新規安全制約）**:
   - Safari / Chrome の外観をコピーしない。`DESIGN.md` のダーク様式で、明らかに「ゲーム内 UI」と
     分かる見た目にする
   - 偽 URL バーに実在ドメインを表示しない（架空ドメインのみ。allowlist で管理）
   - 常時「これはゲーム内の偽ブラウザです」相当のラベルを最小限に置く（初回のみ強調表示）
6. `FrameCapability[]` は `apps/web/src/game/frame/capabilities.ts` でプロファイルごとに公開し、
   TASK-008 のステージ生成器が R8（frame 要件）の判定に使う

## Acceptance criteria

- [ ] BrowserFrame がモバイル/デスクトップ双方のプロファイルで表示される
- [ ] 実ブラウザの `history.length` が BrowserFrame 内の操作で変化しない
- [ ] 実ブラウザの `window.scrollY` が BrowserFrame 内スクロールで変化しない
- [ ] 偽 URL バーに実在ドメインが一切表示されない（allowlist テスト）
- [ ] Safari/Chrome の既知 UI 要素（信号機ボタン等)と視覚的に混同されない（デザイン QA）
- [ ] 初回表示時に「ゲーム内の偽ブラウザです」の注記が出る
- [ ] `DESIGN.md §23` のコンプライアンスチェックを実施し、結果を PR に記載

## Test requirements

- 実ブラウザ history / scroll への非干渉テスト（Playwright）
- 偽 URL バーの表示文字列 allowlist テスト（SAFE-12 の一部。TASK-029 にも登録）
- 視覚回帰スナップショット（mobile / desktop）

## Definition of Done

- acceptance criteria を全て満たす
- SAFE-12 のテストが `packages/safety` に登録され、TASK-029 から参照される
