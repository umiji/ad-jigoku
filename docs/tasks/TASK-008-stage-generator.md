# TASK-008 — ステージ生成器（エンカウンターテンプレート）

- Milestone: M1 / Phase 1
- Depends on: 007
- Size: 1 session
- **DECISIONS_v0.2.md §3 により改訂**: 「候補からk個ランダム抽選」ではなく、エンカウンターテンプレート +
  合成妥当性ルール（R1〜R8）+ rendezvous hashing による seed 安定化に変更する

## Objective

`EncounterTemplate` 列 + seed からスケジュール済みの広告出現列を生成する。
「seed が違えば地獄が違う」（GAME §8.1）と同時に「どの seed でも面白い」を両立させる（v0.2 §3.1）。

## Context

`GAME_ENGINE_DESIGN.md §8`。難易度の公平性（GAME §15）もここで担保する。

## Files to create

```text
packages/game-engine/src/stage/types.ts        StageDefinition, EncounterTemplate, RoleSlot, ScheduledSpawn
packages/game-engine/src/stage/generate.ts     生成アルゴリズム（テンプレート駆動）
packages/game-engine/src/stage/rendezvous.ts   rendezvous (HRW) hashing による候補選択
packages/game-engine/src/stage/rules.ts        R1〜R8 の合成妥当性チェック
packages/game-engine/src/stage/difficulty.ts   難易度計算と検証（R7）
packages/game-engine/src/stage/tuning.ts       EngineTuning: FRICTION_CAP / LOAD_BUDGET の仮置き値（Q1）
data/templates/                                エンカウンターテンプレート定義（*.json）
packages/game-engine/src/stage/data/           stage-1.json .. stage-5.json のスキーマ（中身はTASK-026）
```

## Implementation requirements

1. `EncounterTemplate` / `RoleSlot` は `GAME_ENGINE_DESIGN.md §8.2` の型のとおり実装する
2. 役割スロット1つあたり `GAME_ENGINE_DESIGN.md §8.2` のアルゴリズム（候補を絞る → 合成妥当性チェック →
   rendezvous hashing で1件選ぶ → Range を焼き込む）を実装する
3. **登録済み shell / behavior を持つパターンしか選ばない**（AD-2）。
   これにより「カタログに定義はあるが実装がない」パターンが勝手に出てこない
4. `GAME_ENGINE_DESIGN.md §8.3` の R1〜R8 を全て実装する:
   - R1（スロット排他）は型で保証されるため、実行時チェックは不要（テストで確認するのみ）
   - R2（シェル互換）・R3（ペア非互換）・R6（SAFE-01）・R8（frame 要件）は候補から除外
   - R4（摩擦上限）・R5（認知負荷予算）は `EngineTuning` の `FRICTION_CAP` / `LOAD_BUDGET[device]` と比較
   - R7（難易度帯）は生成後に検証し、外れたら棄却して再抽選（最大 N 回。N 回失敗したら緩和して確定し警告を残す）
5. **rendezvous (HRW) hashing** で候補を選ぶ: `w = hash(seed, stream, patternId)` を計算し上位 k を採る。
   配列インデックスでの抽選は使わない（カタログ更新で既存 seed が壊れるため。v0.2 §3.4）
6. `Range` は生成時に `rng('timing')` で確定値へ焼き込む。**実行中に再抽選しない**
7. seed URL には `catalogVersion` を含める。生成時に現在のカタログと不一致なら「旧バージョンの地獄です」と
   分かるフラグを結果に含める（黙って違う結果を返さない）
8. `StageDefinition` の内容:
   ```ts
   { id, name, templates: EncounterTemplateRef[], targetDifficulty, durationMs, contentLength,
     maxConcurrent, escalation: { startIntensity, endIntensity } }
   ```
9. `RoleSlot.forced` はチュートリアルとステージ導入用（GAME §12: 各ステージで新パターンを紹介する）
10. `FRICTION_CAP` / `LOAD_BUDGET` の初期値は**仮置き**でよい（Q1、DECISIONS_v0.2.md §9）。
    `EngineTuning` 経由で外部から差し替え可能にし、面白さゲート（TASK-024B）後の調整に備える

## Acceptance criteria

- [ ] 同じ seed で同じ `ScheduledSpawn[]` が生成される
- [ ] 違う seed で明確に違う組み合わせが出る（100 seed で重複率 < 5%）
- [ ] カタログにパターンを1件追加しても、追加前の seed の大半（目安: 9割以上）で結果が変わらない
      （rendezvous hashing の効果を回帰テストで確認）
- [ ] 非互換パターンの組み合わせ（R3）が生成されない
- [ ] `Σ behavior.friction` が `FRICTION_CAP` を超える組み合わせ（R4）が生成されない
- [ ] 同時アクティブ広告の `Σ load` が `LOAD_BUDGET[device]` を超えない（R5）
- [ ] 全生成結果が SAFE-01（R6）を満たす
- [ ] `pattern.frame` を満たさないプロファイルでは候補から除外される（R8）
- [ ] 1000 seed で生成した難易度の分布が目標帯に収まる（外れ値の割合が閾値以下、R7）
- [ ] `RoleSlot.forced` が必ず出現する

## Test requirements

- 決定性テスト（seed → 同一結果）
- rendezvous hashing の安定性テスト（パターン追加前後で既存 seed の大半が保存される）
- property test: 1000 seed × 全ステージで R1〜R8 と SAFE-01 が成立
- 難易度分布のテスト
- 「登録済み shell/behavior のないパターンが選ばれない」テスト

## Definition of Done

- acceptance criteria を全て満たす
- `pnpm game:preview-stage --seed=X --stage=1` で生成結果をテキスト表示できるデバッグ CLI がある
