# TASK-037 — Evidence スキーマと保存

- Milestone: M7 / Phase 2
- Depends on: 004
- Size: 1 session

> Phase 2 のタスクは概要レベル。M6 完了時に詳細化する。

## Objective

`EVALUATOR_DESIGN.md §4` の `EvidenceBundle` を zod スキーマとして実装し、
保存・読み出しを実装する。

## Context

**ADR-004 の中核。** Score が Evidence の純粋関数であるためには、
Evidence が「後から見返して判定できる」十分な情報を持つ必要がある。
ここが薄いと、後で検出器を足すたびに再クロールが必要になる。

## Scope

- `packages/evaluator-core/src/evidence/schema.ts`
- 構造化データ（`structured.json.gz`）とメディア（`media/*`）の分離
- ローカルファイルシステムと S3 互換の両方に書ける抽象（Phase 2 はローカルで十分）
- Evidence のバージョニング

## Key requirements

- `CATALOG §5 Layer 1` の全収集項目を保持できること
- 構造化データだけでスコア再計算が完結すること（メディア削除可能）
- `SignalRef`（PATTERN_SCHEMA §4）と Evidence のフィールドが1:1で対応すること
- 削除要求に応じて特定 run の evidence を消せること（PRODUCT §30 D5）

## Acceptance criteria

- [ ] `CATALOG §5 Layer 1` の全項目がスキーマに存在する
- [ ] 構造化データのみで detector が動くことを、ダミーデータで実証
- [ ] 1 run の構造化データが 1MB 以下（gzip）に収まる目安を確認
- [ ] evidence の削除 API がある

## Definition of Done

- 上記を満たし、`EVALUATOR_DESIGN.md §4` と実装が一致している
