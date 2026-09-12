# ADR-004: 観測と判定を分離し、Score を Evidence の純粋関数にする

- Status: Proposed
- Date: 2026-09-12
- Drivers: AD-4, AD-5

## Context

Playwright でページを開いた勢いでその場でスコアを計算するのが最短実装である。
しかし PRODUCT_REQUIREMENTS は次を要求している。

- §8 Evidence-First（なぜこの点数かを必ず説明できる）
- §21 Evaluation Versioning（過去との比較の意味を保つ）
- §14 異議申立てと再評価
- §11 Before/After 比較
- CATALOG §10 実データによる Severity の Calibration

その場採点だと、この5つが全部できない。特に Calibration は致命的で、
severity を1つ変えるたびに全サイトを再クロールすることになる。

## Decision

```text
Probe(Playwright) → EvidenceBundle(不変・永続) → Detectors(純粋) → Scorer(純粋) → Report
```

- `packages/evaluator-core` は Playwright を import しない
- Score は `(EvidenceBundle, detectorVersion, scoringVersion)` の関数
- EvidenceBundle は構造化データ（再スコアに必要）とメディア（削除可）を分離して保存
- 同一 run に複数 scoringVersion のスコアが並存できる

## Consequences

### 良い
- severity 変更 → 再クロールなしで全履歴を再計算できる
- 異議申立てに対して同一 evidence での再判定を提示できる
- 検出器を差し替えても過去の evidence が無駄にならない
- Probe の実装（自前 Playwright / マネージド Chromium）を後から差し替えられる

### 悪い
- Evidence スキーマの設計に前倒しのコストがかかる
- ストレージコストが増える

### 緩和
- 構造化データのみ長期保存、メディアはライフサイクル削除
- Evidence スキーマは detector の `signals` 宣言から必要項目を導出する（PATTERN_SCHEMA §4.1）
