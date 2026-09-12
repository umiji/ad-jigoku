# ADR-007: 安全性を自動テストで強制する

- Status: Proposed
- Date: 2026-09-12
- Drivers: AD-6, AD-9

## Context

DESIGN_REQUIREMENTS §14 と DESIGN.md §20 は、禁止事項を長いリストで定義している
（外部遷移しない、音を自動再生しない、back を奪わない、閉じられない UI を作らない…）。

このプロダクトは広告のダークパターンを批判する立場である。
**自分がダークパターンをやった瞬間に信用が死ぬ。** レビューの注意力に依存させてはいけない。

## Decision

`packages/safety` に共通テストキットを置き、LP・ゲーム双方に対して CI で実行する。
SAFE-01 〜 SAFE-11（ARCHITECTURE §11）を実装し、MVP 完成前（TASK-028）に稼働させる。

代表例:
- SAFE-01: 全パターン × 1000 seed の property test で「必ず閉じられる」を検証
- SAFE-05: 全 CTA を踏んで cross-origin navigation がゼロであることを検証
- SAFE-08: mobile viewport で全 close ボタンの bounding box が 44×44 以上
- SAFE-11: CSP + ネットワーク allowlist で外部スクリプト読み込みゼロ

## Consequences

### 良い
- 「気をつける」が「落ちるテスト」になる
- 新しいパターンを追加しても、安全性の検証が自動的に適用される
- 外部への説明材料になる（「安全性は CI で保証しています」）

### 悪い
- MVP 前のタスクが1本増える
- e2e テストの実行時間が伸びる

### 緩和
- safety テストは PR では変更範囲に応じて部分実行、main へのマージ時に全実行
