# TASK-046A — AdSlot + 自己診断バッジ

- Milestone: M8 / Phase 3
- Depends on: 046
- Size: 1 session
- **DECISIONS_v0.2.md §8.1 により新設**（ADR-012）

## Objective

`AdSlot` コンポーネントを実装し、ルート種別に応じて実広告を許可/禁止する。あわせて自サイトの
自己診断スコアを公開する「自己診断バッジ」を実装する。

## Context

`DECISIONS_v0.2.md §8.1`、ADR-012、`PRODUCT_REQUIREMENTS.md §18.5`。

```text
ゲーム / LP ルート                    : 実広告ネットワーク禁止（偽クリエイティブのみ）← SAFE-13
記事 / ランキング / 図鑑 / レポート   : 実広告可。お行儀のよい配置のみ
```

## Files to create

```text
packages/ui/components/AdSlot.tsx
packages/ui/components/SelfAuditBadge.tsx
apps/web/src/lib/route-ad-policy.ts     ルート種別 → 許可 provider のマッピング
```

## Implementation requirements

1. `AdSlot` に `provider: 'simulated' | 'network'` を持たせる
2. ゲーム / LP ルートでは型・lint・実行時アサーションの三重で `provider: 'network'` を拒否する
   （SAFE-13 の実装本体。TASK-029 のテストがこれを検証する）
3. ネットワーク広告（AdSense 等）より**アフィリエイト（自前クリエイティブ）を優先**する導線にする
   （誤クリックによる BAN の仕組みがないため）
4. `SelfAuditBadge`: 自サイトを自分の診断（TASK-045〜046 のパイプライン）にかけた結果
   （例:「広告を掲載していて Score 12/100」）を記事ページ等に表示する
5. バッジの値は手動更新ではなく、自サイトに対する定期診断結果から取得する
   （診断対象 URL リストに自サイトを含める運用でよい。自動化の完全性は本タスクの必須要件ではない）

## Acceptance criteria

- [ ] ゲーム / LP ルートで `AdSlot provider="network"` を使おうとすると型エラーになる
- [ ] ゲーム / LP ルートで実行時に `provider: 'network'` が渡っても描画されない（フェイルセーフ）
- [ ] 記事 / ランキング / 図鑑 / レポートルートでは `network` の AdSlot が描画できる
- [ ] `SelfAuditBadge` が自サイトの診断結果を表示する
- [ ] `DESIGN.md §23` のコンプライアンスチェックを実施し、結果を PR に記載

## Test requirements

- 型テスト（ゲーム/LP ルートでの `network` 使用がコンパイルエラーになること）
- 実行時フェイルセーフのテスト
- SAFE-13 の静的検査テスト（TASK-029 と連携）

## Definition of Done

- acceptance criteria を全て満たす
- SAFE-13 のテストが `packages/safety` に登録され、TASK-029 から参照される
