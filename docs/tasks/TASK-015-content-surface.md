# TASK-015 — 偽記事コンテンツ面と読了・設問メカニクス

- Milestone: M2 / Phase 1
- Depends on: 014
- Size: 1 session

## Objective

プレイヤーが「読みたいコンテンツ」を実装する。
広告に邪魔される対象がなければゲームが成立しない。

## Context

GAME §3「読みたいコンテンツを最後まで読み切る」。
GAME §30 Q3 の推奨は D（ハイブリッド）。**ARCHITECTURE OD-5 で確定した方針に従う**:
「記事を最後まで読む」＋「記事内の設問に1つ答える」。

設問があることで Deception 系パターン（偽の「次へ」など）が機能する。
読むだけだと「待つゲーム」になってしまう。

## Files to create

```text
apps/web/src/game/content/ArticleSurface.tsx
apps/web/src/game/content/ReadingProgress.ts
apps/web/src/game/content/QuestionPrompt.tsx
packages/game-engine/src/content/article.ts      記事メタデータの型（本文はUI側）
apps/web/src/game/content/articles/*.ts          架空の記事データ
```

## Implementation requirements

1. 記事は**架空**。実在メディアを模倣しない。
   トーンは `DESIGN.md §13` に準拠しつつ、記事自体は普通に読める内容にする
   （読みたいと思えないと、邪魔される悔しさが生まれない）
2. 読了判定:
   - 現在 viewport に本文が見えていて、かつ覆われていない → `{ t: 'read' }` intent を送る
   - 覆われ判定はエンジン側の `blockProgress` で持つ（UI が判定しない）
3. 設問:
   - 記事の途中と末尾に1つずつ。**本文を実際に読んでいないと答えられない**内容
   - 選択式。誤答は progress を戻さないが、patience を削る
   - 設問の選択肢の近くに偽 CTA を配置できる構造にする（`DEC-04 Fake Next` の舞台）
4. 記事の長さはステージ定義から決まる（`contentLength`）
5. 記事は複数用意し、seed で選ばれる（`rng('creative')`）。リプレイ性のため
6. 本文のタイポグラフィは `DESIGN.md §5` の `body` トークン。読みやすさを犠牲にしない
   （広告が邪魔でも、本文自体は品質が高いこと。そのコントラストが体験の核）

## Acceptance criteria

- [ ] 広告に覆われている間、読了が進まないことが体感できる
- [ ] 設問に答えないとクリアできない
- [ ] 記事が seed で変わる
- [ ] 記事本文が実在メディアの模倣でない
- [ ] スクリーンリーダーで本文が読める（広告が前面にあっても本文にアクセスできる）
- [ ] 本文の可読性が `DESIGN.md §5` に準拠している

## Test requirements

- 覆われ判定と progress の連動テスト
- 設問の正誤判定テスト
- e2e: 記事を読み切って設問に答えるとクリアする

## Definition of Done

- acceptance criteria を全て満たす
- 記事が最低3本ある

---

## 進捗記録

- 状態: 完了（2026-09-14）

### 決定ログ

#### 2026-09-13 行数換算は 16 文字 / 行（読了 ≈ 20 秒）
- 決定: `CHARS_PER_LINE = 16`。3 本の記事が 30〜120 行に収まり、READ_LINES_PER_SECOND=2 で 20 秒前後
- 却下案: 40 文字 / 行 → 10 秒で読み終わり、広告に邪魔される前に終わる
- 出典: session decision

#### 2026-09-13 記事選択のハッシュは engine の xmur3 と同式をローカルに持つ
- 決定: e2e からも import するため、articles/index.ts は game-engine に依存しない
- 出典: Playwright の ESM ローダーが engine の JSON import を扱えなかった実測

### 証拠

```text
$ pnpm --filter @ad-jigoku/web test → articles.test.ts 4 tests（3 本、設問は途中と末尾、実在メディア名なし、seed で決定論）
$ e2e「記事を読み切り設問に答えるとクリアし、もう一回できる」→ mobile / desktop pass（設問未回答ではクリアしない = tasksTotal）
$ e2e「CTA を押しても外部遷移しない」→ pass
```
