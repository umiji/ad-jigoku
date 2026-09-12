# ADR-009: パターンの実装を「見た目 × 挙動 × 中身」の2軸+データにする

- Status: Accepted
- Date: 2026-09-12
- Drivers: DECISIONS_v0.2.md §1（D1, D2）

## Context

v0.1 は `GameFacet.simulatorId` 1つでパターンの実装単位を指していた。これは挙動しか表現しておらず、
見た目そのものが本質であるカテゴリ E（偽装系、DEC-*）を表現できない。また「90パターンを組み合わせて
無数のバリエーションを生成する」（D1）という方針を成立させるには、見た目と挙動を独立に組み合わせられる
構造が要る。

## Decision

広告インスタンスを次の3要素の合成として定義する。

```text
広告インスタンス = Shell（見た目） × Behaviors（挙動。スロット毎に最大1） × Creative（中身）
```

- **Shell**: 独立モジュール。`packages/ui/shells/<id>/` に HTML/CSS/JS を持ち、共通化しない
- **Behavior**: 8種のスロット（spawn/surface/close/persist/attention/instability/deception/hitbox）に
  差す部品。1スロット1挙動（衝突解決を不要にするため）
- **Creative**: コピー・架空ブランド名・色を数百件のデータとして持ち、`rng('creative')` で抽選

旧 `PatternSimulator` / `SimulatorRegistry` は撤回し、`ShellRegistry` + `BehaviorRegistry` に置き換える
（`ARCHITECTURE.md` §7.3、`GAME_ENGINE_DESIGN.md` §7）。

## Consequences

### 良い
- 新パターン追加の典型がコードゼロになる（既存シェル + 既存挙動を JSON に書くだけ）
- カテゴリ E（偽装系）を「1パターン1シェル」として正しく表現できる
- Creative を増やすだけで「同じ広告ばかり」に見える問題を緩和できる

### 悪い
- シェル × 挙動の組み合わせ数が増えるほど、合成の妥当性チェック（ADR-011 R1〜R8）が要る
- 偽装系8パターンは共通化できないため、1つずつ専用デザイン工数がかかる（MVP は2つに限定）

### 却下した案
- v0.1 のまま simulatorId を増やし続ける: 見た目と挙動が密結合し、偽装系を表現できないまま
- Shell を共通コンポーネント化する: 「本気でふざける」品質の偽装系を作れなくなる
