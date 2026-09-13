# TASK-008 — ステージ生成器（エンカウンターテンプレート + 合成妥当性ルール）

- Milestone: M1 / Phase 1
- Depends on: 007
- Size: 1 session

> **v0.2 改訂**: 本タスクは `DECISIONS_v0.2.md` §3 全体（エンカウンターテンプレート、
> 合成妥当性ルール R1〜R8、rendezvous hashing）を実装する（ADR-011）。
> v0.1 の「候補から k 個ランダム抽選」は撤回する。

## Objective

`EncounterTemplate` + `StageDefinition` + seed からスケジュール済みの広告出現列を生成する。
「seed が違えば地獄が違う」（GAME §8.1）に加え、「テンプレートにより起承転結は保たれる」（C1 対応）
「組み合わせが理不尽にならない」（C2 対応）を実現する。

## Context

`GAME_ENGINE_DESIGN.md §8`。難易度の公平性（GAME §15）もここで担保する。

## Files to create

```text
packages/game-engine/src/stage/types.ts        StageDefinition, EncounterTemplate, RoleSlot, ScheduledSpawn
packages/game-engine/src/stage/generate.ts     生成アルゴリズム（GAME_ENGINE_DESIGN §8.2 の11ステップ）
packages/game-engine/src/stage/rules.ts        R1〜R8 の検証ロジック
packages/game-engine/src/stage/rendezvous.ts   rendezvous (HRW) hashing による候補選択
packages/game-engine/src/stage/difficulty.ts   難易度計算と検証（R7）
packages/game-engine/src/stage/data/templates/ テンプレート定義（中身は TASK-026）
packages/game-engine/src/stage/data/stages/    stage-1.json .. stage-5.json のスキーマ（中身はTASK-026）
```

## Implementation requirements

1. `GAME_ENGINE_DESIGN.md §8.2` の11ステップをそのまま実装する
2. **登録済み Shell を持つパターンしか選ばない**（AD-2）。
   これにより「カタログに定義はあるが実装がない」パターンが勝手に出てこない
3. R1〜R8（`GAME_ENGINE_DESIGN.md §8.2`）を全て実装する:
   - R1 スロット排他（型で保証）、R2 シェル互換、R3 ペア非互換（`incompatibleWith`、対称）
   - **R4 摩擦上限**（`Σ behavior.friction ≤ FRICTION_CAP`）、**R5 認知負荷予算**
     （`Σ load ≤ LOAD_BUDGET[device]`）
   - R6 SAFE-01、R7 難易度帯（棄却して再抽選）、R8 frame 要件
   - `FRICTION_CAP` / `LOAD_BUDGET` は **Q1（`DECISIONS_v0.2.md` §9）につき初期値を `EngineTuning` に
     仮置きする**。面白さゲート（GAME §7 / TASK-024B）で調整する前提を README に明記する
4. 候補選択は配列インデックス抽選ではなく **rendezvous (HRW) hashing** で行う
   （`w = hash(seed, stream, patternId)` の上位 k）。カタログにパターンを追加しても既存 seed の
   大半が保存されることをテストで示す
5. `Range` は生成時に `rng('timing')` で確定値へ焼き込む。**実行中に再抽選しない**
6. 同時出現数の上限を適用（mobile / desktop で別値。`EngineTuning`）
7. 生成後の検証（R6, R7）が収まらなければ棄却して再抽選（最大 N 回。N 回失敗したら緩和して確定し、警告を残す）
8. `EncounterTemplate` / `RoleSlot` は `GAME_ENGINE_DESIGN.md §8.1` の型通り。物語ステージは
   テンプレートを固く（役割・カテゴリを絞る）、Endless は緩くする
9. `StageDefinition` の内容:
   ```ts
   { id, name, templates: EncounterTemplate[], targetDifficulty, durationMs, contentLength,
     categoryWeights, allowedPatterns?, forcedPatterns?, maxConcurrent,
     escalation: { startIntensity, endIntensity } }
   ```
10. `RoleSlot.forced` / `forcedPatterns` はチュートリアルとステージ導入用（GAME §12: 各ステージで新パターンを紹介する）
11. seed URL に `catalogVersion` を含め、不一致時は「旧バージョンの地獄です」と明示する仕組みを用意する

## Acceptance criteria

- [ ] 同じ seed で同じ `ScheduledSpawn[]` が生成される
- [ ] 違う seed で明確に違う組み合わせが出る（100 seed で重複率 < 5%）
- [ ] R1〜R8 が全て検証され、違反した組み合わせが生成されない
- [ ] カタログにパターンを1件追加しても、既存 seed の大半（目安 > 80%）の結果が変わらない（rendezvous hashing の効果測定）
- [ ] 全生成結果が SAFE-01 を満たす
- [ ] 1000 seed で生成した難易度の分布が目標帯に収まる（外れ値の割合が閾値以下）
- [ ] `forcedPatterns` が必ず出現する
- [ ] 物語ステージのテンプレートが固定され、同じ「起承転結」で中身だけ変わることをテストで確認

## Test requirements

- 決定性テスト（seed → 同一結果）
- property test: 1000 seed × 全ステージで R1〜R8 と SAFE-01 が成立
- rendezvous hashing の安定性テスト（パターン追加前後で既存 seed の結果保存率を計測）
- 難易度分布のテスト
- 「登録済み Shell のないパターンが選ばれない」テスト

## Definition of Done

- acceptance criteria を全て満たす
- `pnpm game:preview-stage --seed=X --stage=1` で生成結果をテキスト表示できるデバッグ CLI がある
- `FRICTION_CAP` / `LOAD_BUDGET` の初期値と、それが仮置きであることが `EngineTuning` のコメントに明記されている

---

## 進捗記録

- 状態: 完了（2026-09-13）

### 決定ログ

#### 2026-09-13 FRICTION_CAP=5 / LOAD_BUDGET mobile 5, desktop 8（仮置き、Q1）
- 決定: `EngineTuning` に仮置き。behavior の friction/load 値（TASK-017〜022）と面白さゲート（TASK-024B）で調整する
- 却下案: なし（設計文書が「実装時に仮置き」を指示）
- 出典: DECISIONS_v0.2 §9 Q1

#### 2026-09-13 「同時」の定義は出現後 LOAD_WINDOW_MS=6000ms
- 決定: 生成時点では閉じられるタイミングが分からないので、出現から 6 秒間はその広告が存在するとみなして R5 と同時出現上限を判定する。判定は step 単位（浮動小数誤差を避ける）
- 却下案: ±W の対称窓 → 2W 幅の過剰な制約になり、密集テンプレートで出現が不必要に遅れる
- 出典: session decision

#### 2026-09-13 パラメータ焼き込みはスロット固有 RNG
- 決定: `makeRng(seed#salt:key:ci)` で Range を確定する。あるスロットのパターンが変わっても他スロットの確定値が動かない（HRW の安定性を timing 列にも波及させない）
- 却下案: 共有 timing ストリーム → 1 スロットの変化で以降の全パラメータがずれる
- 出典: GAME_ENGINE_DESIGN §8.4 の意図

#### 2026-09-13 HRW 安定性の検証は per-slot
- 決定: 「カタログ追加で既存 seed の > 80% が保存」はカタログが大きいときの目安。テストは「変わってよいのは新パターンが勝ったスロット（と同エンカウンター内の繰り上がり）だけ」という per-slot 不変性 + 保存率 > 75%（ミニカタログ、候補 4 件）で固定
- 出典: 実測（候補 4 件では 1 スロット 20% が変わりうる）

#### 2026-09-13 preview CLI は既定で「実装済みとみなす」スタブレジストリ
- 決定: `--real` を付けない限り、カタログが参照する shell/behavior を全てスタブ登録して生成する（behavior 実装前にテンプレートを調整するため）
- 出典: session decision

### 作業ログ

- 2026-09-13: stage/{types,rendezvous,rules,difficulty,generate,seed-url}.ts、data/templates/story.json + stages/stage-1.json、bin/preview-stage.ts、テスト 17 件。

### 証拠

```text
$ pnpm --filter @ad-jigoku/game-engine test → generate.test.ts 17 tests passed（同 seed 一致 / 100 seed 重複 < 5% / 未実装・不公平・SAFE-01 違反・game facet なしを選ばない / R3 / R5 / R7 1000 seed 外れ < 3% / SAFE-01 1000 seed / forced / allowed / COM 展開 / 起承転結固定 / HRW per-slot）
$ pnpm game:preview-stage --seed=demo --stage=stage-1
  templates: opener → pressure-pair → opener / difficulty: 2.25 (target 1-2.5)
    800  interrupt INT-01 popup spawn:immediate close:instant
   8617  interrupt INT-01 …  11667 pressure OBS-09 densityStack persist:multi-layer{layers:4,…}
```
