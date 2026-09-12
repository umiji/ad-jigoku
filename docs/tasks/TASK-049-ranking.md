# TASK-049 — ランキングのデータモデルと公開ページ

- Milestone: M9 / Phase 4
- Depends on: 048
- Size: 1 session

> Phase 4 のタスクは概要レベル。**着手前に法務・ポリシーの確定が必要。**

## Objective

PRODUCT §13 のランキングを実装する。

## Scope

- ランキングのデータモデル
- Negative ranking（広告地獄ランキング）
- Positive ranking（Most Improved / Best Ad UX / Certified）
- 公開範囲の制御

## Key requirements

- **掲載対象は Curated + User-submitted**（PRODUCT §30 D2）。自動クロールしない
- 掲載には必須情報がある（PRODUCT §13.1）:
  評価日時 / 対象URL / 測定条件 / 検出パターン / スコア根拠 / 再評価申請
- **同一 scoringVersion 内でのみ比較**（ARCHITECTURE §13）
- 表現は「広告UXスコア 87/100」。**「クソサイト」のような人格攻撃をしない**（PRODUCT §23）
- Positive ranking を Negative ranking と同等以上に目立たせる（PRODUCT §13.3）

## Preconditions（**実装前に必須**）

- [ ] PRODUCT §23 の Legal/Trust 要件が確定している
- [ ] PRODUCT §30 D5（スクリーンショットの保存・著作権・takedown）が確定している
- [ ] 利用規約・プライバシーポリシーが存在する

## Acceptance criteria

- [ ] ランキングが表示される
- [ ] 掲載必須情報が全て揃っている
- [ ] バージョンをまたいだ比較ができない
- [ ] Positive ranking が同等以上に目立つ

## Definition of Done

- 上記を満たし、preconditions が全て満たされている
