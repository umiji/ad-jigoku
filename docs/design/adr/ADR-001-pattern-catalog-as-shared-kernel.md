# ADR-001: パターンカタログを Shared Kernel にする

- Status: Proposed
- Date: 2026-09-12
- Drivers: AD-1, AD-2

## Context

`AD_UX_PATTERN_CATALOG.md` は Game / Audit / Improvement の3用途で共有すると明記されている
(CATALOG §Purpose, GAME §26)。素直に実装すると、各用途がそれぞれパターン定義のコピーを持ち、
すぐに乖離する。「ゲームでは Fake Close の severity 18、評価では 16」のような状態は、
このプロダクトの信頼性を直撃する。

## Decision

`packages/pattern-catalog` を **他のどのパッケージにも依存しない Shared Kernel** として置く。

- Markdown = 人間の source of truth（公開仕様）
- JSON = 機械の source of truth
- 両者の整合を CI で強制（parity test）
- 1つのパターン定義に `game` / `detect` / `improve` / `fixture` の facet がぶら下がる
- Simulator / Detector は必ず既存パターンIDに紐づく。孤児実装は CI で落とす

## Consequences

### 良い
- severity を1箇所変えるだけでゲームも評価も追従する
- 「実装されていないパターン」がカバレッジレポートで可視化される
- 公開する仕様と実際の挙動が一致していることを CI が保証する（PRODUCT §23）

### 悪い
- パターン追加時に Markdown と JSON の両方を触る必要がある
- スキーマ変更のコストが高い（4つの consumer に波及する）

### 緩和
- Markdown→JSON の変換補助スクリプトを用意する（TASK-004）
- スキーマは Phase 1 で固める。Phase 2 以降は facet の追加のみで拡張する
