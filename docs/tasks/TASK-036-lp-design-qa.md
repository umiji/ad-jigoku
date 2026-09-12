# TASK-036 — DESIGN.md 準拠 QA と視覚回帰

- Milestone: M6 / Phase 1.5
- Depends on: 035, 029
- Size: 1 session

## Objective

`DESIGN.md §23` のコンプライアンスパスと `§24` の Final Test を、
LP とゲームの全画面に対して実施し、**以降自動で回る状態**にする。

## Context

`DESIGN.md §23`:
> If a rule conflicts with the current implementation, fix the implementation
> rather than silently redefining the design system.

M6 の締め。Phase 1 全体の品質ゲート。

## Files to create

```text
tests/visual/                             視覚回帰スナップショット
scripts/design-audit.ts                   DESIGN.md 準拠の自動検査
docs/design/DESIGN_QA_REPORT.md           実施結果
```

## Implementation requirements

1. `design-audit.ts` の自動検査:
   - 使われている色がトークン由来のみか（実行時の computed style を走査）
   - z-index がトークン由来のみか
   - フォントファミリが3以下か
   - `border-radius` が `shape` トークン由来か
   - 禁止コンポーネント名の不在
2. 視覚回帰: LP 全段階 × ゲーム主要画面 × (mobile / desktop) のスナップショット
3. `DESIGN.md §23` のチェックリスト11項目を手動で実施し、結果を記録
4. `DESIGN.md §24` の Final Test を**他人に実施してもらう**:
   - 5秒: 「普通のLPではない」と分かるか
   - 30秒: 「広告を閉じながら説明を読むサイト」だと分かるか
   - 1分: 「広告UXをネタにしている」と分かるか
   - 離脱後: 一番覚えているのが「暗いおしゃれなサイト」ではなく
     「広告を閉じまくった体験」になっているか
5. `DESIGN_REQ §22` の Design Acceptance Criteria を全項目評価
6. 違反が見つかったら**実装を直す**。DESIGN.md を勝手に緩めない

## Acceptance criteria

- [ ] `design-audit` が CI で走る
- [ ] 視覚回帰スナップショットが全画面分ある
- [ ] `DESIGN.md §23` の11項目すべてに ✓ が付いている
- [ ] `DESIGN.md §24` の Final Test を3人以上に実施し、結果を記録
- [ ] `DESIGN_REQ §22` の全チェックボックスが埋まっている
- [ ] 発見された違反が全て修正されている（または DESIGN.md 側の変更提案として起票されている）

## Test requirements

- design-audit の自己テスト（違反を検出できること）
- 視覚回帰の安定性（flaky でないこと）

## Definition of Done

- acceptance criteria を全て満たす
- **M6 完了 = Phase 1.5 完成**
- `DESIGN_QA_REPORT.md` に Final Test の生の反応が記録されている
  （「で、これ何のサイト？」と言われたら失敗。記録すること）
