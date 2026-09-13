# TASK-013A — Shell: popup / interstitial / stickyBanner / inlineRect

- Milestone: M2 / Phase 1
- Depends on: 013
- Size: 1 session

> **v0.2 新規（`DECISIONS_v0.2.md` §1.3, ADR-009）**: TASK-013 から分離した、汎用シェル4種の
> 実装タスク。TASK-013 で作った parts（AdMeta / AdHeadline / AdCTA / AdLegal / AdCountdown /
> CloseButton / FakeCloseButton / AdCreative）を組み合わせて構成する。

## Objective

`Shell` インターフェース（`GAME_ENGINE_DESIGN.md §7`）を満たす、汎用シェル4種を実装する。

## Context

`DECISIONS_v0.2.md §1.3`。**「シェルは独立モジュール。各シェルが自分の HTML/CSS/JS を持つ。
共通化しない」**という原則を最初に確立するタスク。以降の 013B/013C もこの書き方を踏襲する。

## Files to create

```text
packages/ui/shells/popup/Popup.tsx
packages/ui/shells/popup/popup.css
packages/ui/shells/interstitial/Interstitial.tsx
packages/ui/shells/interstitial/interstitial.css
packages/ui/shells/stickyBanner/StickyBanner.tsx
packages/ui/shells/stickyBanner/stickyBanner.css
packages/ui/shells/inlineRect/InlineRect.tsx
packages/ui/shells/inlineRect/inlineRect.css
packages/ui/shells/registry.ts                 ShellRegistry への登録
```

## Implementation requirements

1. 各シェルは `Shell` インターフェースを実装する:
   ```ts
   interface Shell {
     readonly id: ShellId
     readonly parts: AdPart[]
     readonly supports: Slot[]
     readonly frame?: FrameCapability[]
   }
   ```
2. **`supports` を正しく宣言する**（これが生成器の R2 シェル互換検証の入力になる。
   `GAME_ENGINE_DESIGN.md §8.2`）:
   - `popup`: `supports: ['spawn', 'close', 'deception', 'hitbox']`
   - `interstitial`: `supports: ['spawn', 'surface']`
   - `stickyBanner`: `supports: ['spawn', 'persist']`
   - `inlineRect`: `supports: ['spawn', 'instability']`
3. TASK-013 の parts を組み合わせるだけで、シェル固有の挙動ロジックを持たない
   （挙動は Behavior 側。TASK-017 以降）
4. `DESIGN.md §8` の anatomy と `§16` の形状ルールに準拠する
5. `ShellRegistry` への登録は起動時に1回。重複 ID はエラー

## Acceptance criteria

- [ ] 4シェルがそれぞれ `/dev/components` で確認できる
- [ ] 各シェルの `supports` が実際に対応する Behavior スロットと一致する
- [ ] シェルが挙動ロジックを持たない（レビュー観点。Behavior 未接続でも静的に表示できる）
- [ ] `DESIGN.md §23` のコンプライアンスパス実施済み

## Test requirements

- 各シェルの視覚回帰スナップショット（mobile / desktop）
- `supports` 宣言と Behavior スロットの整合テスト

## Definition of Done

- acceptance criteria を全て満たす
- TASK-013B / TASK-013C がこのファイルをテンプレートにして書ける状態

---

## 進捗記録

- 状態: 完了（2026-09-14）。実装はサブエージェント（opus）、検証・コミットはコントローラ

### 決定ログ

#### 2026-09-14 シェルは独立モジュール。共有は parts のみ、BaseShell は作らない
- 決定: `packages/ui/src/shells/<id>/` に `<Name>.tsx` + `module.css` + `descriptor.ts` + テスト。`descriptor` の parts / supports はエンジンの `MVP_SHELLS` と文字列単位で一致（apps/web/src/game/shells.test.ts が検査）
- 出典: DECISIONS_v0.2 §1.3 / TASK-013A 要件 1-2

#### 2026-09-14 interstitial は常にダーク面（popup → popupDark、warning → danger）
- 決定: 全画面が #080808 → #F4F1EA に反転するのは演出ではなく実害（DESIGN §20 の精神）。新しい色は足さず既存テーマの選び直しのみ
- 出典: session decision（テストで固定）

#### 2026-09-14 inlineRect / videoPlayer の見出しは media 面に焼き込む
- 決定: 両シェルは `body` 部位を宣言しないため `AdHeadline`（data-target=body）を置くと未宣言部位の intent が出る。実際のバナーも文字は画像内。全シェルのテストで「描画した data-target ⊆ descriptor.parts」を不変条件にした
- 出典: session decision

#### 2026-09-14 ShellProps は apps/web/src/game/shellProps.ts の構造的な写し（ui は game-engine に依存できない）
- 決定: `packages/ui/src/shells/types.ts`。型が合わなくなると `apps/web/src/game/shells.ts` の代入がコンパイルエラーになる。`parts` / `motion` は readonly 配列にしない（ComponentType の相互代入が通らないため）
- 出典: ARCHITECTURE §5.1

### 証拠

```text
$ pnpm verify → 18 tasks successful（ui 141 / web 39 / engine 151 / catalog 127 tests）、lint:css 0、check-deps OK、parity OK、creatives OK
$ npx playwright test（apps/web）→ 42 passed（game 12 + parts 14 + shells 16）。全 29 個の × が 44.0×44.0、axe serious/critical 0、a[href]/download/audio/autoplay 0
$ /game（seed e2e-trial-1）: popup と stickyBanner が本実装で描画、[data-generic-shell] 0 件、× で閉じられる
```
