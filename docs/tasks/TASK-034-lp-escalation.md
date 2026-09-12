# TASK-034 — エスカレーション段階 01-07

- Milestone: M6 / Phase 1.5
- Depends on: 033
- Size: 1 session

## Objective

`DESIGN.md §10` の 01 WELCOME → 07 AD HELL のエスカレーションを実装する。
**説明の内容そのものを広告として表示する。**

## Context

`DESIGN_REQ §1` の design thesis:
> **「説明を広告にする。」**

`DESIGN_REQ §6` の Stage 0-6、`§7` のエスカレーション表、`§8` の Product Explanation UI。
**このタスクがプロダクトのコンセプトそのもの。**

## Files to create

```text
apps/web/src/lp/stages.ts                 内容を完成させる
apps/web/src/lp/copy/                     コピーをデータとして
apps/web/src/lp/patterns/                 各段階の広告挙動
```

## Implementation requirements

1. `DESIGN.md §10` の段階をそのまま:
   ```text
   01 WELCOME       静か
   02 INTERRUPTION  popup 1つ
   03 ANNOYANCE     delayed close
   04 PERSISTENCE   sticky
   05 DECEPTION     fake close
   06 CHAOS         layered popups
   07 AD HELL       複数同時
   ```
2. 各段階の広告の中身が**プロダクトの説明そのもの**であること（DESIGN_REQ §8）:
   - 02: 「Webサイトを見ていたら広告に邪魔されたこと、ありませんか？」
   - 03: 「その『イラッ』をゲームにしました。」（3秒後に閉じる）
   - 04-05: 広告UX評価の説明
   - 06-07: なぜこのサイトを作ったか
   - **通常のカード/セクションで説明しない**
3. 使うのは `packages/ui` のコンポーネントと `pattern-catalog` のパターン語彙。
   LP 専用の広告コンポーネントを新設しない
4. **各段階に終了条件がある**。永久に閉じ続ける構造にしない（DESIGN_REQ §7）
5. 閉じる操作の摩擦は段階的に強くなるが、**LP では最大でも3秒**（ゲームより緩く）
   - LP は「体験させる」場であって「遊ばせる」場ではない。
     長い待機は離脱を生む
6. 05 DECEPTION の fake close も外部遷移しない（SAFE-05）
7. **30秒以内に「広告を閉じながら説明を読む」構造が理解できる**（DESIGN §24）

## Acceptance criteria

- [ ] 7段階が実装されている
- [ ] 全ての説明が広告の形で表示されている（通常のカードがゼロ）
- [ ] エスカレーションが体感できる
- [ ] 各段階に終了条件がある
- [ ] 閉じる待機が最大3秒
- [ ] 30秒以内にコンセプトが理解できる（他人にテスト）
- [ ] Safety Invariants が全て通る
- [ ] **実在企業の広告・ロゴ・コピーを模倣していない**（DESIGN_REQ §5.2）

## Test requirements

- 全段階の通し e2e
- 各段階の終了条件のテスト
- SAFE 全項目

## Definition of Done

- acceptance criteria を全て満たす
- 他人に触ってもらい、`DESIGN_REQ §22` の Concept チェックリストで評価した結果を記録
