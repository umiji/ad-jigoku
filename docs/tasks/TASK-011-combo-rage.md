# TASK-011 — コンボと RAGE

- Milestone: M1 / Phase 1
- Depends on: 010
- Size: 1 session

## Objective

GAME §10 のコンボシステムと §9.3 の RAGE MODE を実装する。

## Context

`GAME_ENGINE_DESIGN.md §9.3`。
コンボは「個別のパターンより組み合わせのほうが面白い」という要件の中核（GAME §10）。
コンボ名のユーモアがこのゲームの味になる。

## Files to create

```text
packages/game-engine/src/combo/tags.ts
packages/game-engine/src/combo/definitions.json     コンボ定義（データ）
packages/game-engine/src/combo/detect.ts
packages/game-engine/src/rage/rage.ts
```

## Implementation requirements

1. コンボ判定は **`comboTags` の集合マッチ**で行う。パターンIDの直接指定にしない
   （パターンが増えてもコンボ定義を書き換えなくて済む）
2. コンボ定義はデータ。最低限 GAME §10 の4つを実装:
   - 「閉じさせる気がない」= popup + fake-close + delayed-close
   - 「逃げても無駄」= sticky + popup + respawn
   - 「何を押してるんだ」= fake-download + fake-play + invisible-hitbox
   - 「広告地獄」= fullscreen + auto-sound + moving-close + respawn
3. 2種類のコンボを区別する:
   - **敵側コンボ**: 広告の組み合わせが同時成立した（名前が出る。プレイヤーは褒められない）
   - **プレイヤー側コンボ**: 連続で正しく処理した（chain。スコアボーナス）
4. RAGE: プレイヤー側 chain が閾値を超えると発動
   - `Effect: { kind: 'rage', level }` を返すだけ。演出は宿主（TASK-023）
   - **「視覚的に読めなくなる」ほどやらない**（GAME §9.3 の但し書き）→ level に上限
   - `accessibility.reducedMotion` 時は level を減衰させる
5. 最長 chain / 最良コンボを結果画面用に記録

## Acceptance criteria

- [ ] 4つのコンボが正しく検出される
- [ ] タグベースなので、同じタグを持つ新パターンを足してもコンボ定義を触らずに動く
- [ ] 敵側コンボとプレイヤー側コンボが混同されない
- [ ] RAGE level に上限がある
- [ ] reducedMotion で RAGE 強度が下がるが、スコア上の効果は変わらない

## Test requirements

- 各コンボの成立/不成立テスト
- タグ追加でコンボ定義を変えずに済むことのテスト
- RAGE の上限テスト
- reducedMotion でスコアが変わらないことのテスト（**a11y が不利にならない**）

## Definition of Done

- acceptance criteria を全て満たす
- コンボ名の日本語が `GAME_REQUIREMENTS.md §10` と一致している

---

## 進捗記録

- 状態: 完了（2026-09-13）

### 決定ログ

#### 2026-09-13 敵側コンボはアクティブ広告の comboTags の和集合で判定
- 決定: 毎 tick `activeComboTags` を集め、`definitions.json` の requires ⊆ tags で成立。複数成立時は要求タグ数が最大のものを代表名にする
- 却下案: 出現履歴（閉じた広告も含む）で判定 → 「同時に成立している」（GAME §10）に反する
- 出典: GAME_ENGINE_DESIGN §9.3

#### 2026-09-13 RAGE の演出強度は reducedMotion で半減、スコアは不変
- 決定: `state.rage.level` は a11y に依存せず、Effect の level のみ `presentationLevel` で減衰
- 出典: TASK-011 要件 4 / GAME §9.3

### 作業ログ

- 2026-09-13: combo/{definitions.json,tags,detect}.ts、rage/rage.ts、run.ts への組み込み。テスト 5 件。

### 証拠

```text
$ pnpm --filter @ad-jigoku/game-engine test → combo.test.ts 5 tests passed
  - 4 コンボ検出 / 新パターン CLS-99（同タグ）で定義を触らず成立 / 閉じると解除
  - chain 3 → comboBonus 25×(1+2) / CTA ミスで chain 0
  - RAGE level 上限 3 / 閾値未満で非発動 / reducedMotion で effect level 減、score・level 同一
```
