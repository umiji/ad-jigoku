# TASK-027 — Endless モード

- Milestone: M4 / Phase 1
- Depends on: 026
- Size: 1 session

## Objective

GAME §12.6 / §19 の Endless モードを実装する。

## Context

MVP のゲームモードは Story と Endless の2つ（GAME §19）。
Endless は「もう一回」を最も誘発するモードなので、Second-run rate に直結する。

## Files to create

```text
packages/game-engine/src/stage/endless.ts
packages/game-engine/src/stage/data/endless.json
apps/web/src/game/EndlessHud.tsx
```

## Implementation requirements

1. 一定間隔で難易度が上がる。上昇関数は `EngineTuning` で調整可能に
   （`GAME_ENGINE_DESIGN.md §13 Q4` 未決。線形から始めて実測で調整）
2. 波（wave）単位で生成する。波ごとに `targetDifficulty` を上げて `generateStage` を呼ぶ
3. **上限に達しても破綻しない**:
   - 同時出現数の上限は維持する（画面が使えなくなるのを防ぐ）
   - 難易度の上昇は「速度」「不確実性」「組み合わせ」で表現し、
     「同時に100個出す」では表現しない
4. SAFE-01 は endless でも維持（全広告が有限時間で閉じられる）
5. スコアは波数 + 生存時間 + 処理数。ベストスコアを localStorage に保存
6. seed 指定で同じ endless を再現できる（Seed Challenge の下地）

## Acceptance criteria

- [ ] 難易度が上がり続ける
- [ ] 同時出現数の上限が維持される
- [ ] 100 波まで自動プレイしても SAFE-01 が壊れない
- [ ] ベストスコアが保存される
- [ ] seed で再現できる
- [ ] 「理不尽に終わった」ではなく「次はもっといける」と思える終わり方になっている

## Test requirements

- 長時間シミュレーション（100 波）での SAFE-01 property test
- メモリリークテスト（長時間プレイで state が肥大化しない）
- 難易度上昇の単調性テスト

## Definition of Done

- acceptance criteria を全て満たす
- 難易度上昇関数の初期値の根拠が記録されている
