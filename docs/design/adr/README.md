# Architecture Decision Records

| ADR | 決定 | Status |
|---|---|---|
| [ADR-001](ADR-001-pattern-catalog-as-shared-kernel.md) | パターンカタログを Shared Kernel にする | Proposed |
| [ADR-002](ADR-002-headless-deterministic-game-core.md) | ゲームコアをヘッドレス・決定論的にする | Proposed |
| [ADR-003](ADR-003-dom-over-canvas.md) | ゲーム描画は DOM。Canvas/WebGL を使わない | Proposed |
| [ADR-004](ADR-004-evidence-first-evaluation.md) | 観測と判定を分離し、Score を Evidence の純粋関数にする | Proposed |
| [ADR-005](ADR-005-lp-does-not-use-game-engine.md) | LP はゲームエンジンを使わない | Proposed |
| [ADR-006](ADR-006-simulated-layout-shift.md) | Layout Shift を transform で擬似再現する | Proposed |
| [ADR-007](ADR-007-safety-invariants-as-tests.md) | 安全性を自動テストで強制する | Proposed |
| [ADR-008](ADR-008-monorepo-and-stack.md) | monorepo 構成と技術スタック | Accepted |
| [ADR-009](ADR-009-two-axis-pattern-model.md) | パターン実装単位を Shell × Behaviors の2軸+データにする | Accepted |
| [ADR-010](ADR-010-browser-frame.md) | BrowserFrame（偽ブラウザ枠）でハイジャック系パターンを安全に作用させる | Accepted |
| [ADR-011](ADR-011-encounter-templates.md) | エンカウンターテンプレートと合成妥当性ルールによるステージ生成 | Accepted |
| [ADR-012](ADR-012-real-ad-placement-policy.md) | 実広告はコンテンツページのみ、ゲーム/LPは偽物のみ | Accepted |

Status: Proposed → Accepted / Rejected / Superseded

ADR-009〜012 は `docs/design/DECISIONS_v0.2.md`（2026-09-12 オーナーレビュー済み）の反映として追加された。
