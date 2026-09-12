# TASK-032 — 性能予算の CI 強制

- Milestone: M5 / Phase 1
- Depends on: 029
- Size: 1 session

## Objective

`ARCHITECTURE.md §15` の性能予算を CI で強制する。

## Context

DESIGN.md §20「premium without becoming heavy」。
モバイルファースト（AD-7）なので、実機相当の条件で測る。

## Files to create

```text
.github/workflows/perf.yml
scripts/bundle-budget.ts
lighthouserc.json
```

## Implementation requirements

1. バンドルサイズ予算（gzip）:
   - LP 初期 JS: 120 KB
   - Game 初期 JS: 250 KB
   - 超過で CI 失敗
2. Lighthouse CI（モバイルプロファイル、4G スロットリング）:
   - LCP ≤ 2.5s
   - **実 CLS ≤ 0.05**（ADR-006 の検証を兼ねる）
   - TBT ≤ 300ms
3. ランタイム性能:
   - `step()` の処理時間 ≤ 2ms（ベンチマーク）
   - 60fps の維持（演出ピーク時）
4. LP とゲームのチャンク分離を確認（LP を見るだけの人にゲームの JS を配らない）
5. フォント: 可変フォント1つ、サブセット、`font-display: swap`。
   フォントファイルサイズも予算に含める
6. 予算を超えたときのエラーが**何がどれだけ増えたか**を示す

## Acceptance criteria

- [ ] 予算がすべて CI で検証される
- [ ] 大きなライブラリを足すと CI が落ちる
- [ ] LP とゲームのチャンクが分離されている
- [ ] 実 CLS が 0.05 以下
- [ ] `step()` ベンチマークがある
- [ ] 予算超過時のメッセージが具体的

## Test requirements

- バンドル予算のテスト
- `step()` のマイクロベンチマーク

## Definition of Done

- acceptance criteria を全て満たす
- **M5 完了 = Phase 1 (Game MVP) 完成。ただし「完成」は TASK-024B 面白さゲート通過が前提条件**
  （DECISIONS_v0.2.md §7）。ゲート不通過のまま M6 以降に進まない
- GAME §24 の MVP Acceptance Criteria を実際に評価し、結果を記録する
  （特に **Second-run rate** をプレイテストで確認する。面白さゲートの判定基準と同一指標）
