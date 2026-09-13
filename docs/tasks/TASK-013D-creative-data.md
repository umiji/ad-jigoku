# TASK-013D — Creative データ基盤（数百件 + 実在ブランド NG 検査）

- Milestone: M2 / Phase 1
- Depends on: 004
- Size: 1 session

> **v0.2 新規（`DECISIONS_v0.2.md` §1.4, D4）**: シェルが少なくても「同じ広告ばかりに見えない」
> ための鍵。コピー・架空ブランド名・色・画像を数百件のデータとして持つ。

## Objective

`CreativeSelector` で抽選される Creative データ（コピー・架空ブランド名・色・画像）を数百件整備し、
実在ブランドを含まないことを CI で検査する仕組みを実装する。

## Context

`DECISIONS_v0.2.md §1.4, §4 C4`。「シェルが少ないので挙動が違っても既視感が出る」という懸念
（C4）への対処。生成自体は容易だが、実在ブランド混入の検査が要る。

## Files to create

```text
packages/pattern-catalog/data/creatives/*.json     架空ブランド・コピー・配色データ
packages/pattern-catalog/src/creative/selector.ts  CreativeSelector（rng('creative') で抽選）
scripts/check-creative-brands.ts                    実在ブランド NG ワードリスト検査
data/ng-words/brands.json                           NG ワードリスト（実在ブランド名・商標）
```

## Implementation requirements

1. Creative データは最低でも Q4（`DECISIONS_v0.2.md` §9）で定めた初期件数を用意する。
   生成 AI で下書き → 人が実在ブランド検査、というワークフローを想定する
2. `CreativeSelector` は `rng('creative')`（`GAME_ENGINE_DESIGN.md §6`）でのみ抽選する。
   実行中の再抽選はしない（決定論を壊さない）
3. `scripts/check-creative-brands.ts`:
   - NG ワードリスト（実在ブランド名・商標・類似表記）と全 Creative データを突合
   - 一致したら CI を落とす
   - NG ワードリストは継続的に更新できる構造にする（新ブランドの追加が容易）
4. コピーは `DESIGN.md §13` の語彙トーンに合わせる
5. `AdCreative`（TASK-013）の props 設計と接続できることを確認する

## Acceptance criteria

- [ ] Creative データが数百件（初期目標件数は Q4 で確定。README に記録）存在する
- [ ] 実在ブランド名を意図的に混入させると CI が落ちる
- [ ] 同一 seed で同一 Creative が選ばれる（決定論）
- [ ] `AdCreative` コンポーネントが Creative データを描画できる

## Test requirements

- NG ワードリスト検査スクリプトの単体テスト（意図的な違反ケースで検出できること）
- Creative 抽選の決定論テスト

## Definition of Done

- acceptance criteria を全て満たす
- Q4（Creative データの初期件数と生成方法）の決定内容が README に記録されている

---

## 進捗記録

- 状態: 完了（2026-09-13）。実装はサブエージェント（opus）、検証・コミットはコントローラ

### 決定ログ

#### 2026-09-13 Q4: Creative の初期件数は 300（実績 312）、生成 AI 下書き + NG ワード CI + 人間レビュー（未実施）
- 決定: 12 kind × 26 件 = 312 件、架空ブランド 94 種、NG ワード 240 語。人間による全件レビューはローンチ前の残作業として README §7.1 に明記
- 却下案: 100 件 → 「同じ広告ばかりに見える」（C4）を解消できない
- 出典: DECISIONS_v0.2 §9 Q4 / packages/pattern-catalog/README.md §7

#### 2026-09-13 selectCreative は乱数を持たない純粋関数
- 決定: `pool.sort(byId)[creativeIndex % n]`。creativeIndex は生成器が rng('creative') で 1 回だけ引いた値。JSON の並び順を変えてもリプレイが壊れない
- 出典: PATTERN_SCHEMA §3.3 / GAME_ENGINE_DESIGN §6

#### 2026-09-13 NG 検査は NFKC + 小文字化 + ひらがな→カタカナ + 記号除去で正規化
- 決定: `Amazon` / `アマゾン` / `ａｍａｚｏｎ` / `あまぞん` を同一視。短い語（au / LINE 等）は誤爆するので具体形（auひかり 等）で登録
- 出典: session decision（README §7.5）

### 証拠

```text
$ pnpm turbo run typecheck lint test --filter=@ad-jigoku/pattern-catalog → 127 tests passed（creatives 24）
$ pnpm test:scripts → 34 passed（check-creative-brands 16）
$ pnpm check-creatives → OK（NG ワード 240 件、違反 0 件）
$ （cr-sale-0001.brand を "Amazon" に）→ exit 1「data/creatives/sale.json › cr-sale-0001.brand: "amazon"」→ revert
```

### 未解決の懸念

- 人間による全 312 件のレビュー未実施（特に health / finance）。一文字違いの類似（Gooogle 等）は機械検出不可
