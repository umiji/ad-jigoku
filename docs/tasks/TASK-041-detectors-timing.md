# TASK-041 — 検出器 2: タイミング・閉じる摩擦・再発

- Milestone: M7 / Phase 2
- Depends on: 039
- Size: 1 session

> Phase 2 のタスクは概要レベル。

## Objective

時系列ベースの決定論的検出器を実装する。

## Scope

- `popup-timing` — INT-01, INT-02, INT-03
- `close-delay` — CLS-03, TIME-01
- `fake-close` — CLS-11, CLS-12（**遷移発生を証拠とする**）
- `recurrence` — PER-01, PER-04

## Key requirements

- `fake-close` は `interactions.navigationsTriggered` を根拠にする。
  「閉じるに見える要素を押したら遷移した」という**行動の証跡**が証拠
- `close-delay` は実測秒を `measured` に入れる（レポートで「閉じるまで 4.2秒」と出る）
- 時系列の解釈が evidence のタイムスタンプのみに依存すること

## Acceptance criteria

- [ ] 4検出器が実装され、フィクスチャで検出される
- [ ] `fake-close` が実際の遷移を根拠に検出する
- [ ] 実測値がレポートに出せる形で `measured` に入る
- [ ] ネガティブケースで誤検出しない

## Definition of Done

- 上記を満たし、精度数値が記録されている
