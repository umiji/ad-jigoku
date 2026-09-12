# TASK-026 — Stage 1-5 のデータとプログレッション

- Milestone: M4 / Phase 1
- Depends on: 008, 024
- Size: 1 session

## Objective

GAME §12 の Stage 1-5 をステージ定義データとして実装し、
進行（クリア→次ステージ）を成立させる。

## Context

**コードではなくデータを書くタスク。** ステージ生成器（TASK-008）は既にある。
ここで決めるのは「どの難易度でどのパターンを紹介するか」という設計。

## Files to create

```text
packages/game-engine/src/stage/data/stage-1.json   「まだ普通のサイト」
packages/game-engine/src/stage/data/stage-2.json   「ちょっと邪魔」
packages/game-engine/src/stage/data/stage-3.json   「なんかおかしくない？」
packages/game-engine/src/stage/data/stage-4.json   「広告地獄」
packages/game-engine/src/stage/data/stage-5.json   「脱出不能」
apps/web/src/game/progression/StageSelect.tsx
apps/web/src/game/progression/progress.ts          localStorage
```

## Implementation requirements

1. GAME §12 の各ステージの導入パターンを `forcedPatterns` で保証する:
   - S1: popup, sticky, basic close
   - S2: delayed close, autoplay video, layout shift, 複数広告
   - S3: fake close, fake play, fake download, moving UI
   - S4: 組み合わせ（コンボ）
   - S5: respawn, multi-layer, fullscreen takeover, タイミング圧
2. `targetDifficulty` を段階的に上げる。**急激な壁を作らない**
3. 各ステージの `durationMs` / `contentLength` を調整し、
   **1プレイ 60-120 秒**に収める（GAME §4.1 の micro loop は 10-30 秒、1ステージはその数回分）
4. 進行の保存は localStorage（アカウント不要 / PRODUCT §30 D3）
5. クリアしたステージは再挑戦可能。seed は毎回変わる
6. **難易度は UX Severity ではなく Game Difficulty で組む**（CATALOG §1.3）
7. 1000 seed の自動プレイシミュレーションで、各ステージのクリア率が
   目標帯（S1: 95%+ / S5: 30-50% 程度）に入ることを検証する

## Acceptance criteria

- [ ] 5ステージが遊べる
- [ ] 各ステージで新パターンが必ず紹介される
- [ ] 難易度が単調増加する（自動プレイのクリア率で検証）
- [ ] 1プレイが 60-120 秒
- [ ] 進行が localStorage に保存される
- [ ] コードではなくデータだけで実現されている（ステージ追加でコードを触らない）

## Test requirements

- 自動プレイシミュレーションによるクリア率測定（1000 seed × 5ステージ）
- `forcedPatterns` が必ず出ることの検証
- 難易度の単調性テスト

## Definition of Done

- acceptance criteria を全て満たす
- 各ステージの設計意図（なぜこのパターン構成か）が JSON のコメント or README に残っている
