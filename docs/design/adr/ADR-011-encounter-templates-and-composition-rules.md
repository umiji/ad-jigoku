# ADR-011: エンカウンターテンプレートと合成妥当性ルール

- Status: Accepted
- Date: 2026-09-12
- Drivers: DECISIONS_v0.2.md §3（D4）

## Context

「候補から k 個ランダムに抽選」する v0.1 の生成器は、無数のバリエーションを作れるが面白さを保証しない。
純粋ランダムの組み合わせは手作り15ステージより体験が劣る（ローグライクの既知の教訓）。加えて、
個々のパターンが公平でも組み合わせると理不尽になり得る（例: moving + tiny + delayed の同時発生）、
また配列インデックス抽選ではカタログ更新のたびに過去の共有 Seed Challenge の結果が変わってしまう問題があった。

## Decision

**エンカウンターテンプレート**でステージを構造化する。ステージ = テンプレートの列、テンプレート =
役割スロット（`interrupt` / `trap` / `pressure` / `wildcard` / `finale`）の列。生成器が役割ごとに
カタログから埋める。物語ステージはテンプレートを固く（役割・カテゴリを絞る）することで
「同じ起承転結で中身だけ変わる」を実現し、Endless はテンプレートを緩くする。

生成時に以下の合成妥当性ルールを全チェックする（`GAME_ENGINE_DESIGN.md` §8.3）。

| ルール | 内容 |
|---|---|
| R1 スロット排他 | 1広告内で同一スロットに2挙動は不可（型で保証） |
| R2 シェル互換 | `shell.supports ⊇ 使用スロット` |
| R3 ペア非互換 | カタログの `incompatibleWith`（対称） |
| R4 摩擦上限 | 1広告内の `Σ behavior.friction ≤ FRICTION_CAP` |
| R5 認知負荷予算 | 同時アクティブ広告の `Σ load ≤ LOAD_BUDGET[device]` |
| R6 SAFE-01 | 全広告が `MAX_CLOSE_DELAY_MS` 以内に閉じられる |
| R7 難易度帯 | 生成結果の難易度が目標帯 ± tolerance（外れたら棄却して再抽選） |
| R8 frame 要件 | `pattern.frame ⊆ profile capabilities` |

seed の安定性には **rendezvous (HRW) hashing** を使う。候補ごとに `w = hash(seed, stream, patternId)`
を計算し上位 k を採ることで、カタログへのパターン追加は「新パターンの w が上位に入った場合」だけ
既存 seed の結果を変える。seed URL には `catalogVersion` を含め、不一致時は明示する。

## Consequences

### 良い
- テンプレートにより「無数に作れる」と「どれを引いても面白い」を両立させやすくなる
- R4/R5 により、個別に公平でも合成で理不尽になる問題を構造的に防げる
- rendezvous hashing により、カタログ更新後も既存 Seed Challenge の大半が保存される

### 悪い
- 全組み合わせのテストは不可能。挙動単体・シェル単体・カタログ90通り・property test（seed×1000）で
  代替し、個別の組み合わせの「理不尽さ」はプレイテストで発見して `incompatibleWith` / `friction` に
  還元する運用にする（残余リスク）
- `FRICTION_CAP` / `LOAD_BUDGET` の初期値は勘であり、実プレイでの調整が要る（Q1、面白さゲートで検証）

### 却下した案
- 全組み合わせを網羅テストする: 組み合わせ爆発で不可能
- 配列インデックスでの抽選を維持する: カタログ更新のたびに既存 seed が全滅する
