# ADR-009: パターン実装単位を Shell × Behaviors の2軸+データにする

- Status: Accepted
- Date: 2026-09-12
- Drivers: D1, D2（`DECISIONS_v0.2.md` §1）

## Context

v0.1 は `PatternDefinition.game.mechanic` + `simulatorId` という単一の「挙動」軸でパターンの
実装単位を表現していた。90パターンの組み合わせ生成（D1）を成立させようとした際、この単一軸では
見た目そのものが本質であるカテゴリ E（偽装系: Fake Download / Fake Play 等）を表現できないことが
判明した。「挙動は同じだが見た目が違う」パターンと「見た目は同じだが挙動が違う」パターンの両方が
カタログに存在するため、単一の `SimulatorId` では両者を区別できない。

## Decision

パターンの実装単位を **Shell（見た目）× Behaviors（挙動。スロット毎に最大1）× Creative（中身）**
の2軸+データに変更する。

- `Shell` は独立モジュール（`packages/ui/shells/<id>/`）。共通化しない
- `Behavior` はスロット（spawn/surface/close/persist/attention/instability/deception/hitbox）
  に差し込む部品。1スロット1挙動の原則を守り、衝突解決ロジックを不要にする
- 生成器は `shell.supports ⊇ behaviors のスロット集合` を検証する
- v0.1 の `SimulatorRegistry` / `PatternSimulator` は廃止し、`ShellRegistry` + `BehaviorRegistry`
  に置き換える（詳細は `GAME_ENGINE_DESIGN.md §7`）

## Consequences

### 良い

- カテゴリ E（偽装系）を「専用シェル」として正しく表現できる
- 新パターン追加の典型が「既存シェル + 既存挙動の組み合わせを JSON に書くだけ」になり、コードゼロで済む
- シェル・挙動をそれぞれ独立にテストできる（約8シェル × 約20挙動。全組み合わせテストは不要）

### 悪い

- レジストリが2つに増え、初期実装の複雑さが上がる
- 既存の `simulatorId` ベースの設計文書・タスク文書をすべて書き換える必要がある（本反映作業の対象）

### 緩和

- MVP 15 パターンは 8 シェルで足りるため、実装コストの増加は限定的
