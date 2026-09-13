# TASK-046A — AdSlot + 自己診断バッジ

- Milestone: M8 / Phase 3
- Depends on: 046
- Size: 1 session

> **v0.2 新規（`DECISIONS_v0.2.md` §8.1, D9, ADR-012）**: 実広告の配置ポリシーをコンポーネント
> として実装し、あわせて自サイトの自己診断結果を公開する。

## Objective

`AdSlot` コンポーネント（`provider: 'simulated' | 'network'`）を実装し、ルート種別ごとに
`network` を型・テストで拒否する。あわせて自サイトを自分の診断にかけた結果を公開するバッジを実装する。

## Context

`PRODUCT_REQUIREMENTS.md §18.5`、`ARCHITECTURE.md §11` SAFE-13、`DESIGN.md §21`。
PRODUCT §31「`Ads = Bad` ではなく `User-hostile Ad UX = Bad`」の具体的な実演。

## Scope

- `packages/ui/components/AdSlot.tsx`
- ルート種別（game / lp / content）ごとの許可 `provider` を型で制約する仕組み
- `apps/web/src/components/SelfAuditBadge.tsx`（自己診断スコアの表示）
- SAFE-13 の静的検査（`AdSlot.provider === 'network'` がゲーム/LP ルートに存在しないこと）

## Key requirements

- ゲーム / LP ルートでは `provider: 'network'` が**型レベルで**選択不可能にする
  （実行時チェックだけに頼らない）
- 記事 / ランキング / 図鑑 / レポートルートでは `network` を許可する
- ネットワークは AdSense よりアフィリエイト（自前クリエイティブ）を優先する
- 自己診断バッジは実際の自サイト audit run（TASK-045〜046）の結果を参照する。ハードコードしない
- `DESIGN.md` に準拠した見た目にする（広告枠だからといって世界観を崩さない）

## Acceptance criteria

- [ ] ゲーム / LP ルートで `AdSlot provider="network"` を書くと型エラーになる
- [ ] SAFE-13 の静的検査がこのコンポーネントに対して通る
- [ ] コンテンツルートで `network` の `AdSlot` が正しく表示される
- [ ] 自己診断バッジが実際の audit run の結果（スコア・測定日時）を表示する
- [ ] `DESIGN.md §23` のコンプライアンスパス実施済み

## Definition of Done

- 上記を満たす
- TASK-029 の SAFE-13 テストがこの実装に対して実際に通る
