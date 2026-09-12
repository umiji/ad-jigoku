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
