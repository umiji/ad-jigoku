# TASK-024 — 結果画面と教育表示

- Milestone: M4 / Phase 1
- Depends on: 012, 023
- Size: 1 session

## Objective

GAME §20 の結果画面を実装する。
**ここがゲームとプロダクト（広告UX評価）を繋ぐ最初の接点。**

## Context

GAME §20 / §15.1「全ての失敗が説明可能」/ §22「ゲームから実サービスへの自然な導線」。
`ARCHITECTURE.md` の Mission Loop の起点。

## Files to create

```text
apps/web/src/game/results/ResultsScreen.tsx
apps/web/src/game/results/CulpritCard.tsx        「今回の主犯」
apps/web/src/game/results/PatternList.tsx        遭遇/撃破したパターン
apps/web/src/game/results/MasteryBadge.tsx       Seen / Survived / Clean / Perfect
apps/web/src/game/results/mastery.ts             localStorage による mastery 管理
```

## Implementation requirements

1. Primary: Clear / Failed / Score / Time / 残り Patience
2. Secondary: 遭遇パターン / 撃破パターン / ミス / 最良コンボ / 自己ベスト
3. **教育要素（GAME §20 の中核）**:
   ```text
   今回の主犯
   「Fake Close」
   閉じるためのUIに見せかけて別の操作を誘導するパターン。
   ```
   - `culprit`（TASK-009 で特定済み）を使う
   - 説明文は `GameFacet.education` から。カタログが source of truth
   - **「あなたが下手だった」ではなく「このパターンが悪質だった」という語り口**にする
4. Pattern Mastery（GAME §8.3）: Seen / Survived / Clean / Perfect。localStorage
5. **実サービスへの導線**（GAME §22）:
   - 「じゃあ、実際のサイトはどうなの？」という自然な文脈で Audit CTA を出す
   - **ゲームスコア = 実サイトUXスコア ではない**ことを明示する（GAME §22 の明示的要求）
   - Phase 1 時点では Audit は未実装なので「準備中」の受け皿ページに繋ぐ
6. リスタートが速いこと（GAME §24「Restart takes almost no time」）。
   1タップで同じステージ / 新しい seed

## Acceptance criteria

- [ ] 失敗時に「何にやられたか」が必ず表示される
- [ ] 説明文がカタログから来ている（ハードコードでない）
- [ ] mastery が記録・表示される
- [ ] リスタートが1タップ、1秒以内
- [ ] Audit CTA が「ゲームスコア ≠ 実サイトスコア」を誤解させない
- [ ] 語り口が「プレイヤーを責めない」ものになっている
- [ ] `DESIGN.md §23` コンプライアンスパス実施済み

## Test requirements

- culprit 表示の e2e（意図的に fake close で失敗させる）
- mastery の永続化テスト
- リスタート速度の計測

## Definition of Done

- acceptance criteria を全て満たす
- **この時点で「1本遊んで結果を見て、もう1回やる」が成立する**
