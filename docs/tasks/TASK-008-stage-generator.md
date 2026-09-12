# TASK-008 — ステージ生成器

- Milestone: M1 / Phase 1
- Depends on: 007
- Size: 1 session

## Objective

`StageDefinition` + seed からスケジュール済みの広告出現列を生成する。
「seed が違えば地獄が違う」を実現する（GAME §8.1）。

## Context

`GAME_ENGINE_DESIGN.md §8`。難易度の公平性（GAME §15）もここで担保する。

## Files to create

```text
packages/game-engine/src/stage/types.ts        StageDefinition, ScheduledSpawn
packages/game-engine/src/stage/generate.ts     生成アルゴリズム
packages/game-engine/src/stage/difficulty.ts   難易度計算と検証
packages/game-engine/src/stage/data/           stage-1.json .. stage-5.json のスキーマ（中身はTASK-026）
```

## Implementation requirements

1. `GAME_ENGINE_DESIGN.md §8` の8ステップをそのまま実装する
2. **登録済み simulator を持つパターンしか選ばない**（AD-2）。
   これにより「カタログに定義はあるが実装がない」パターンが勝手に出てこない
3. `incompatibleWith` を満たさない組み合わせを除外
4. `Range` は生成時に `rng('timing')` で確定値へ焼き込む。**実行中に再抽選しない**
5. 同時出現数の上限を適用（mobile / desktop で別値。`EngineTuning`）
6. 生成後の検証:
   - SAFE-01: 全 spawn の `closableAtStep - spawnedAtStep` が `MAX_CLOSE_DELAY_MS` 以内
   - 難易度が `StageDefinition.targetDifficulty ± tolerance` に収まる
   - 収まらなければ棄却して再抽選（最大 N 回。N 回失敗したら緩和して確定し、警告を残す）
7. `StageDefinition` の内容:
   ```ts
   { id, name, targetDifficulty, durationMs, contentLength,
     categoryWeights, allowedPatterns?, forcedPatterns?, maxConcurrent,
     escalation: { startIntensity, endIntensity } }
   ```
8. `forcedPatterns` はチュートリアルとステージ導入用（GAME §12: 各ステージで新パターンを紹介する）

## Acceptance criteria

- [ ] 同じ seed で同じ `ScheduledSpawn[]` が生成される
- [ ] 違う seed で明確に違う組み合わせが出る（100 seed で重複率 < 5%）
- [ ] 非互換パターンの組み合わせが生成されない
- [ ] 全生成結果が SAFE-01 を満たす
- [ ] 1000 seed で生成した難易度の分布が目標帯に収まる（外れ値の割合が閾値以下）
- [ ] `forcedPatterns` が必ず出現する

## Test requirements

- 決定性テスト（seed → 同一結果）
- property test: 1000 seed × 全ステージで SAFE-01 と非互換制約が成立
- 難易度分布のテスト
- 「登録済み simulator のないパターンが選ばれない」テスト

## Definition of Done

- acceptance criteria を全て満たす
- `pnpm game:preview-stage --seed=X --stage=1` で生成結果をテキスト表示できるデバッグ CLI がある
