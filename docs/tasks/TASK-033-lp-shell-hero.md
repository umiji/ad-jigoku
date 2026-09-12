# TASK-033 — LP シェルと Hero、LpFlow ステートマシン

- Milestone: M6 / Phase 1.5
- Depends on: 013
- Size: 1 session

## Objective

LP の骨格と Hero、そして「広告を閉じると進む」ナビゲーションの中核を実装する。

## Context

**ADR-005: LP はゲームエンジンを使わない。**
共有するのは `packages/ui` のコンポーネントのみ。
`DESIGN.md §7` の Hero、`§10` の進行、`ARCHITECTURE.md §8.2` の LpFlow。

## Files to create

```text
apps/web/src/lp/LpFlow.ts                 進行の reducer（100行程度）
apps/web/src/lp/stages.ts                 ステージ定義データ
apps/web/src/lp/LpShell.tsx
apps/web/src/lp/HellHero.tsx
apps/web/src/lp/HellSection.tsx
apps/web/src/lp/AdNavigator.tsx           広告を出す/閉じる/次へ進む
apps/web/src/app/page.tsx
```

## Implementation requirements

1. **Hero は静かに**（DESIGN §7）:
   - 「ようこそ、広告地獄へ。」（display サイズ）
   - 「このサイトでは、広告を閉じないと先に進めません。」（小さく）
   - CTA「地獄へ入る」
   - **ユーザーが押すまで広告を出さない**。静けさと最初の広告のコントラストが設計意図
   - noise / grain / vignette（DESIGN_REQ §3.1）。ただし広告UIより目立たない
2. `LpFlow`:
   ```ts
   type LpState = { stage: number; openAds: string[]; closedAds: string[] }
   // advance条件: そのステージの ad が全て close された
   ```
   - **XState を入れない。** 100 行程度の reducer で足りる
3. `stages.ts` は `DESIGN.md §10` の 01-09 をデータで表現
4. **各ステージに必ず終了条件がある**（DESIGN_REQ §7）。
   型で「終端のない ad 設定」を作れないようにする
5. スクロールを奪わない（DESIGN §11）。広告の出現は IntersectionObserver の閾値で発火
6. ブラウザの Back / スクロール位置を壊さない
7. モバイルファースト。desktop は TASK-035

## Acceptance criteria

- [ ] Hero が `DESIGN.md §7` の要求を満たす
- [ ] 「地獄へ入る」を押すまで広告が出ない
- [ ] 広告を閉じると次の情報が現れる
- [ ] スクロールが奪われない
- [ ] Back が正常に動く（SAFE-06）
- [ ] `LpFlow.ts` が 150 行以内
- [ ] game-engine を import していない（`check-deps` で検証）
- [ ] **5秒以内に「普通のLPではない」と分かる**（DESIGN §24）

## Test requirements

- LpFlow の reducer 単体テスト
- 進行の e2e
- SAFE-02/03/05/06 の適用

## Definition of Done

- acceptance criteria を全て満たす
- `DESIGN.md §23` コンプライアンスパス実施済み
