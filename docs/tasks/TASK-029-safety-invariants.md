# TASK-029 — Safety Invariants テストスイート（SAFE-01..13）

- Milestone: M5 / Phase 1
- Depends on: 022, 016, 014A
- Size: 1 session

> **v0.2 改訂（`DECISIONS_v0.2.md` §2.4, §8.2）**: SAFE-12（BrowserFrame の実ブラウザ UI 非模倣）
> と SAFE-13（ゲーム/LPルートの実広告禁止）を追加する。

## Objective

`ARCHITECTURE.md §11` の SAFE-01..13 を実装し、CI で常時実行する。

## Context

**ADR-007。このプロダクトは広告のダークパターンを批判する立場である。
自分がダークパターンをやった瞬間に信用が死ぬ。**
DESIGN_REQ §14 / DESIGN §20 の禁止事項をレビューの注意力に依存させない。

## Files to create

```text
packages/safety/src/invariants.ts            不変条件の定義
packages/safety/src/engine-invariants.ts     エンジンに対する property test
packages/safety/src/browser-invariants.ts    Playwright に対する e2e
packages/safety/playwright.config.ts
.github/workflows/safety.yml
```

## Implementation requirements

各不変条件を実装する。

| ID | 内容 | 実装 |
|---|---|---|
| SAFE-01 | 全広告が `MAX_CLOSE_DELAY_MS` 以内に閉じられる状態になる | 全パターン × 1000 seed の property test |
| SAFE-02 | フォーカストラップを作らない | Tab を 200 回押して必ずページ外に出られる |
| SAFE-03 | スクロールを恒久的にロックしない | 各ステージでスクロール可能性を assert |
| SAFE-04 | ユーザー操作なしに音を鳴らさない | AudioContext / HTMLMediaElement.play を監視 |
| SAFE-05 | 外部サイトへ遷移しない | 全 CTA / リンクを踏み、cross-origin navigation ゼロ |
| SAFE-06 | ブラウザ Back を妨害しない | history.length の増減と back 動作 |
| SAFE-07 | reduced-motion で moving が無効、ロジックは維持 | エンジン unit + e2e クリア可能性 |
| SAFE-08 | close ターゲットが 44×44 以上（mobile） | bounding box 実測 |
| SAFE-09 | ダウンロードを発生させない | Playwright の download イベント監視 |
| SAFE-10 | 偽UIで入力を収集しない | fake form に submit ハンドラがないことの静的検査 |
| SAFE-11 | 外部スクリプトを読み込まない | CSP + ネットワーク allowlist |
| SAFE-12 | `BrowserFrame` が実ブラウザ UI を模倣しない。実在ドメインを偽 URL バーに出さない | Playwright: 偽 URL バーの文字列に実在ドメインが含まれないことの検査 + 既知ブラウザ chrome との視覚差分の静的検査 |
| SAFE-13 | ゲーム / LP ルートに実広告ネットワークのスクリプトが存在しない | CSP + ルート単位の静的検査。`AdSlot.provider === 'network'` がゲーム/LP ルートで型・テストにより拒否される |

1. **SAFE-01 と SAFE-07 はエンジンの property test**（ブラウザ不要、高速）
2. 残りは Playwright。mobile / desktop 両プロファイルで実行
3. CSP ヘッダを `apps/web` に設定し、SAFE-11 / SAFE-13 を実行時にも強制する
4. SAFE-12 は `BrowserFrame`（TASK-014A）に対する検査。実装後にのみ有効化できる
5. CI 構成:
   - PR: 変更範囲に応じた部分実行
   - main へのマージ: 全実行
6. 違反時のエラーメッセージに**どの禁止事項に触れたか**（DESIGN.md の該当箇所）を含める

## Acceptance criteria

- [ ] SAFE-01..13 が全て実装され、通る
- [ ] 意図的に違反を作ると、該当するテストだけが落ちる（13件すべてで確認）
- [ ] エンジン系の property test が 60 秒以内に完了する
- [ ] CSP ヘッダが設定されている
- [ ] CI に組み込まれている
- [ ] 失敗メッセージが DESIGN.md の該当セクションを指す

## Test requirements

- 各不変条件に対する「意図的な違反」のテスト（テストのテスト）

## Definition of Done

- acceptance criteria を全て満たす
- `packages/safety/README.md` に「新しい UI を足したときに何を追加すべきか」が書かれている
