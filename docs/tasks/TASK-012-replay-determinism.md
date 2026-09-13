# TASK-012 — リプレイ記録・再生と決定論回帰テスト

- Milestone: M1 / Phase 1
- Depends on: 008, 011
- Size: 1 session

## Objective

`ReplayRecord` の記録・再生を実装し、**エンジン変更で挙動が変わったら CI が落ちる**状態にする。

## Context

`GAME_ENGINE_DESIGN.md §11`。
これが Seed Challenge（GAME §8.5）と回帰テストの両方を同時に実現する。
M1 の締めのタスク。

## Files to create

```text
packages/game-engine/src/replay/record.ts
packages/game-engine/src/replay/play.ts
packages/game-engine/src/replay/encode.ts        URL 共有用の短い符号化
packages/game-engine/test/fixtures/replays/*.json
```

## Implementation requirements

1. `ReplayRecord` は `GAME_ENGINE_DESIGN.md §11` の構造
2. `tick` intent は記録しない（step index で位置が決まる）
3. `replay(record)` が `finalStateHash` と一致することを検証する
4. バージョン不一致時の扱い:
   - `engineVersion` / `catalogVersion` が違う場合は**再生を拒否し、理由を返す**
   - 黙って違う結果を出さない
5. URL 共有用の符号化:
   - seed + stage + mode だけで「同じ地獄」を共有できる（入力列は不要）
   - `?s=<seed>&st=<stage>` 程度。短く
   - 入力列まで含むフルリプレイは別形式（ファイル/将来のサーバ保存）
6. `test/fixtures/replays/` に**手で作った代表的なリプレイを3-5本**置き、CI で再生検証する
   - 通常クリア / patience 0 失敗 / fake close で失敗 / 高コンボ

## Acceptance criteria

- [ ] 記録 → 再生 → `finalStateHash` 一致
- [ ] エンジンのロジックを意図的に1箇所変えると、フィクスチャ再生テストが落ちる
- [ ] バージョン不一致のリプレイが明確なエラーで拒否される
- [ ] seed URL から同じステージ構成が再現される
- [ ] 60fps / 30fps どちらの記録でも同じ結果になる

## Test requirements

- ラウンドトリップテスト
- フィクスチャリプレイの回帰テスト（**CI 必須**）
- バージョン不一致の拒否テスト
- 符号化・復号のラウンドトリップ

## Definition of Done

- acceptance criteria を全て満たす
- **M1 完了**: ブラウザなしでゲームが1本通り、seed で再現できる
- `pnpm game:simulate --seed=X --strategy=optimal` でヘッドレス実行して結果を出せる CLI がある

---

## 進捗記録

- 状態: 完了（2026-09-13）— **M1 完了**: ブラウザなしでゲームが 1 本通り、seed で再現できる

### 決定ログ

#### 2026-09-13 ReplayRecord は catalog 本体を持たず version.catalog で照合する
- 決定: `config` から `catalog` を除いて記録し、再生側が同バージョンのカタログを渡す。`schedule` を明示注入した run（フィクスチャ）だけ config ごと記録する
- 却下案: カタログ全体を記録 → 1 本数百 KB になり、URL 共有・ファイル保存に向かない
- 出典: GAME_ENGINE_DESIGN §11

#### 2026-09-13 createRun は schedule 未指定なら生成器で作る
- 決定: `RunConfig.schedule` が無ければ `generateStage(getStage(stageId), …)` で埋める。seed URL（s/st/m/cv）だけで同じ地獄が再現される
- 出典: TASK-012 要件 5 / GAME §8.5

#### 2026-09-13 フィクスチャはミニカタログで記録
- 決定: `test/fixtures/replays/*.json` は `src/testing/mini-catalog.ts`（実装スタブ付き）で記録。実カタログの値変更で回帰テストが揺れない。更新は `pnpm --filter @ad-jigoku/game-engine replay:fixtures`（挙動を意図的に変えたときだけ）
- 却下案: 実カタログで記録 → severity 等の調整のたびに全フィクスチャが失効
- 出典: session decision

### 作業ログ

- 2026-09-13: replay/{record,play,encode,strategies,simulate,fixture-cases}.ts、bin/{simulate,make-replay-fixtures}.ts、フィクスチャ 4 本、テスト 14 件。ENGINE_VERSION=0.1.0。

### 証拠

```text
$ pnpm --filter @ad-jigoku/game-engine test → 11 files, 143 tests passed
  - 記録 → 再生 → finalStateHash 一致 / encode・decode ラウンドトリップ
  - フィクスチャ 4 本（clear-optimal / fail-patience-zero / fail-fake-close / high-combo）が記録 hash と一致
  - tuning を 1 箇所変えると hash 不一致（回帰検出）
  - engine / catalog バージョン不一致は reason 付きで拒否
  - seed URL → 同一 schedule・同一 hash / 60fps・30fps の宿主ループで同一 hash
$ pnpm game:simulate --seed=demo --strategy=optimal
  result: CLEARED score=2664 patience=89.1 time=24.0s ads=4 mistakes=0 bestChain=4  hash: 55b74d328f229042
$ pnpm game:simulate --seed=demo --strategy=spam
  result: FAILED score=0 patience=0 time=8.8s ads=2 mistakes=29  culprit: INT-01
```
