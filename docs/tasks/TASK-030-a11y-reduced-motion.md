# TASK-030 — アクセシビリティと reduced-motion 対応

- Milestone: M5 / Phase 1
- Depends on: 029
- Size: 1 session

## Objective

`DESIGN.md §20` の MUST を全て満たし、
**アクセシビリティ設定を使うプレイヤーが不利にならない**ことを保証する。

## Context

DESIGN.md §20 / DESIGN_REQ §19。
「パロディだが実際のユーザビリティは高く保つ」が要件。
特に **reduced-motion でスコアが下がらない**ことが重要（a11y が不利になるゲームは失格）。

## Files to create / change

```text
apps/web/src/game/a11y/                     追加のラベル・アナウンス
packages/ui/components/*                    aria 属性の補強
apps/web/src/app/settings/                  アクセシビリティ設定 UI
docs/design/ACCESSIBILITY.md                方針の記録
```

## Implementation requirements

1. キーボード操作:
   - 全ての広告の close に Tab で到達できる
   - 出現した広告にフォーカスを移すが、**トラップしない**（Esc で本文に戻れる）
   - ActionBar のショートカット
2. スクリーンリーダー:
   - 広告の出現を `aria-live="polite"` でアナウンス（「広告が表示されました」）
   - close ボタンに意味のあるラベル
   - **偽UIは視覚的には騙すが、支援技術には正直に**（TASK-019 と一貫）
3. `prefers-reduced-motion`:
   - 大きな transform / shake / パーティクルを止める
   - **インタラクションロジックは維持**（DESIGN §20）
   - 各 simulator の reducedMotion 時の等価な摩擦が実装済みであることを確認
4. 追加の設定（`/settings`）:
   - `extendedTimeouts`: 反応時間に配慮したモード。**スコアに penalty を付けない**
   - `audioEnabled`
   - `highContrast`（任意）
5. コントラスト: 全テキストが WCAG AA。広告UIも例外なし
6. `extendedTimeouts` / `reducedMotion` でのクリア可能性とスコア分布を検証する

## Acceptance criteria

- [ ] axe-core の violation がゼロ
- [ ] キーボードだけで Stage 1 をクリアできる
- [ ] スクリーンリーダーで広告の出現が分かる
- [ ] フォーカストラップがない（SAFE-02）
- [ ] `reducedMotion` でスコアの期待値が変わらない（1000 seed の自動プレイで比較）
- [ ] `extendedTimeouts` にスコアペナルティがない
- [ ] 全テキストが WCAG AA

## Test requirements

- axe-core の自動テスト（全画面）
- キーボードのみでのクリア e2e
- **reducedMotion / 通常モードのスコア分布比較テスト**（このタスクの主目的）

## Definition of Done

- acceptance criteria を全て満たす
- `docs/design/ACCESSIBILITY.md` に「パロディと実ユーザビリティの境界」の判断基準が記録されている
