# TASK-013 — canonical 広告コンポーネント基盤（parts）

- Milestone: M2 / Phase 1
- Depends on: 002
- Size: 1 session

> **v0.2 改訂（`DECISIONS_v0.2.md` §1.3, ADR-009）**: 本タスクは Shell に依存しない**部位
> （parts）レベルの共通コンポーネント**に範囲を縮小した。シェル本体（`popup` / `interstitial` /
> `stickyBanner` / `inlineRect` / `videoPlayer` / `densityStack` / `fakeDownload` / `fakePlay`）
> の実装は TASK-013A/013B/013C に分離する。

## Objective

`DESIGN.md §21` の canonical component のうち、**シェル横断で再利用される部位**を実装する。
**LP とゲームの両方がこれを使う**（ADR-005）。個々の Shell（TASK-013A/B/C）はここで作る parts を
組み合わせて構成する。

## Context

`DESIGN.md §8` の anatomy、`§9` のパターン対応表、`§16` の形状ルール、`§19` のレスポンシブ。
ここが「本気でふざける」の実体。安っぽくなったら失敗。

## Files to create

```text
packages/ui/components/AdMeta.tsx            PR / Sponsored ラベル
packages/ui/components/AdHeadline.tsx
packages/ui/components/AdCTA.tsx
packages/ui/components/AdLegal.tsx           極小の注意書き
packages/ui/components/AdCountdown.tsx
packages/ui/components/CloseButton.tsx       real close
packages/ui/components/FakeCloseButton.tsx
packages/ui/components/AdCreative.tsx        抽象的なダミービジュアル
packages/ui/components/index.ts              allowlist
packages/ui/creatives/                       ダミー広告素材（架空）
```

`DESIGN.md §8` の anatomy（ラベル / 見出し / 本文 / ビジュアル / CTA / 極小注意書き / 閉じるボタン）
を構成する parts をここで作る。**`popup` シェル自体の組み立ては TASK-013A で行う。**

## Implementation requirements

1. 全 part は**挙動を持たない**。表示状態を props で受け取るだけの presentational component。
   閉じるタイミング・移動・再出現は呼び出し側（Behavior / LpFlow）が決める
2. 形状（DESIGN §16）: `popup_radius: 2px`、ハードエッジ、抑制された影。
   **角丸カード + でかいぼかし影にしない**
3. `CloseButton` の実タップ領域は最小 44×44（DESIGN §19）。
   見た目が小さい `TinyClose` でも**当たり判定は 44px を確保する**
   （DESIGN_REQ §5.3 Pattern C の但し書き。ゲームとして不公平にしない）
4. `FakeCloseButton`:
   - `aria-label` で「これは広告のCTAです」と正しく伝える（スクリーンリーダーを騙さない）
   - 視覚的に紛らわしくてよいが、**支援技術には嘘をつかない**
   - 押しても外部遷移しない（SAFE-05）
5. `AdCreative`: 実在ブランドを模倣しない（DESIGN §3 MUST NOT 9）。
   架空の商品名・抽象グラフィック・タイポグラフィで構成する。**TASK-013D の Creative データ基盤と
   接続できる形にする**（`CreativeSelector` を受け取れる props 設計）
6. コピーは `DESIGN.md §13` の語彙から。データとして外出しする（ハードコードしない / OD-9）
7. 全コンポーネントに Storybook 相当の確認ページ（`/dev/components`）を用意する

## Acceptance criteria

- [ ] `DESIGN.md §8` の全 part が個別コンポーネントとして揃っている
- [ ] 生の16進カラー・生の z-index がゼロ（lint が通る）
- [ ] 全ての close ボタンの当たり判定が 44×44 以上（テストで実測）
- [ ] `FakeCloseButton` の `aria-label` が本当の動作を説明している
- [ ] キーボードだけで全コンポーネントを操作できる。フォーカスリングが見える
- [ ] `/dev/components` で全バリエーションを確認できる
- [ ] `DESIGN.md §23` のコンプライアンスチェックリストを実施し、結果を PR に記載

## Test requirements

- 当たり判定サイズの Playwright 実測テスト
- コントラスト比の自動検証（axe）
- 視覚回帰スナップショット（mobile / desktop）

## Definition of Done

- acceptance criteria を全て満たす
- 「安っぽいパロディになっていないか」を `DESIGN_REQ §22` の Visual チェックリストで自己評価し、
  結果を PR に書く

---

## 進捗記録

- 状態: 完了（2026-09-14）。実装はサブエージェント（opus。セッション切替で報告書は未出力）、検証・README・コミットはコントローラ

### 決定ログ

#### 2026-09-13 DESIGN.md に easing / shadow / font family を「追記提案」として追加してから実装
- 決定: DESIGN.md §14.1 Easing（standard / abrupt / exit）、§16.1 Shadow（popup / sticky）、§5.1 Font family（M PLUS 2 Variable）を追記提案としてマークし、`tokens/motion.ts` / `tokens/shadow.ts` に反映。オーナーが差し戻せば tokens も戻す
- 却下案: コンポーネント内に生の値を書く → DESIGN §4/§16 と CLAUDE.md §2.3 に反する
- 出典: DESIGN_REQ §18（shadow / easing はトークン必須）/ CLAUDE.md §2.3

#### 2026-09-13 parts は packages/ui/src/parts/ に置く
- 決定: タスク文書の `packages/ui/components/` ではなく `src/parts/`（パッケージの配布ルートが src のため）。`data-target` 属性で宿主が Intent に変換する契約
- 出典: TASK-014 の intentFromEvent との契約

#### 2026-09-14 Playwright e2e は apps/web に集約、視覚回帰は CI では skip
- 決定: `apps/web/playwright.config.ts`（mobile 390×844 / desktop 1440×900、webServer 3100）。視覚スナップショットは Windows ローカル基準で `test.skip(!!process.env.CI)`。CI には `e2e` ジョブを追加
- 却下案: Linux ベースラインをコミット → 生成環境がない
- 出典: session decision

### 証拠

```text
$ pnpm turbo run typecheck lint test --filter=@ad-jigoku/ui --filter=@ad-jigoku/web → 8 successful（ui 84 tests / web 29 tests）
$ pnpm lint:css → 0 / $ pnpm --filter @ad-jigoku/ui tokens:check → OK
$ pnpm --filter @ad-jigoku/web build → ✓ Exporting、/dev/components 生成
$ npx playwright test（apps/web）→ parts.spec 14 passed（mobile + desktop）: 44×44 実測（visualScale 0.5 でも）/ axe serious・critical 0 /
  Tab 到達 + フォーカスリング / Enter・Space 発火 / 偽 × の aria-label が「広告のボタン」/ 視覚回帰
```
