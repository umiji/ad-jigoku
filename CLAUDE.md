# CLAUDE.md

このリポジトリで作業するときの指針。

> `docs/design/DECISIONS_v0.2.md`（Status: Absorbed）の内容は各設計文書・タスク文書に反映済み。
> 反映履歴は `docs/design/ARCHITECTURE.md` §22、`docs/design/adr/README.md`（ADR-008改訂, ADR-009〜012）を参照。

## 1. まず読む

- 実装タスクに着手する前: `docs/tasks/TASK-XXX-*.md` + `docs/design/ARCHITECTURE.md`
- **UI を触る前: `docs/requirements/DESIGN.md`**（これは設計契約であって参考資料ではない）
- パターン定義を触る前: `docs/design/PATTERN_SCHEMA.md`

## 2. 絶対に守ること

### 2.1 依存方向（`ARCHITECTURE.md §5.1`）

```text
pattern-catalog   → 何にも依存しない
game-engine       → pattern-catalog のみ（React / DOM / Date / Math.random / setTimeout 禁止）
evaluator-core    → pattern-catalog のみ（Playwright 禁止）
ui                → pattern-catalog の型のみ
packages/*        → apps/* への依存は禁止
```

これは lint と `pnpm check-deps` で強制されている。**回避しない。**

### 2.2 安全性（`ARCHITECTURE.md §11` / ADR-007）

このプロダクトは広告のダークパターンを批判する立場である。
自分がダークパターンをやった瞬間に信用が死ぬ。

SAFE-01..13 のテストを落としてまで通す実装は存在しない。
落ちたら**実装を直す**。テストを緩めない。

### 2.3 デザイン契約（`DESIGN.md`）

- 定義されていない色・フォント・コンポーネント・モーションを**発明しない**
- 新しい色が必要になったら、まず `DESIGN.md` への追記を提案する
- UI 実装のたびに `DESIGN.md §23` のコンプライアンスパスを実施する
- `CoolCard` / `GlassCard` 等を作らない

### 2.4 パターンカタログ（ADR-001）

- パターンIDは `AD_UX_PATTERN_CATALOG.md` にあるものだけ
- Markdown と JSON が食い違ったら **Markdown が正**
- カタログに定義のないパターンを実装しない

## 3. 設計と実装が矛盾したとき

**黙って設計を無視しない。**

1. 実装を設計に合わせられるなら、そうする
2. 設計のほうが間違っているなら、`docs/design/` を直す提案を出してから実装する

`DESIGN.md §23`:
> If a rule conflicts with the current implementation, fix the implementation
> rather than silently redefining the design system.

## 4. やらないこと

- パターンを MVP の 15 個より増やす（GAME §23 の明示的な非目標）
- Phase 1 にバックエンド・DB・アカウントを入れる（AD-12）
- 「おしゃれだから」という理由で 3D / WebGL を入れる（AMIX_REF §4）
- 実在企業の広告・ロゴ・コピーを模倣する（DESIGN §3）
- ゲームの得点を UX severity に比例させる（GAME §9.1 の明示的な禁止）
- ゲーム / LP ルートに実広告を入れる（DECISIONS_v0.2.md §8.1。記事/ランキング/図鑑/レポートは可）
- サードパーティ広告ブロッカーを推奨する（DECISIONS_v0.2.md §6.4。案内するのはブラウザ標準機能のみ）

## 5. タスクの進め方

1. `docs/tasks/README.md` で依存関係を確認
2. `Depends on` が満たされていないタスクには着手しない
3. `Definition of Done` を全部満たすまで閉じない
4. ブランチを切ってから作業する

## 6. 語彙

| 用語 | 意味 |
|---|---|
| Pattern | 広告UXの悪いパターン。カタログの定義単位 |
| Simulator | （v0.1 用語。撤回済み → Shell / Behavior 参照。DECISIONS_v0.2.md §1） |
| Detector | 実サイトでパターンを検出する実装 |
| Evidence | 実サイトの観測データ。不変・永続 |
| Finding | 検出結果。evidence への参照を必ず持つ |
| Facet | 1つのパターンの `game` / `detect` / `improve` / `fixture` / `escape` 側面 |
| SAFE-XX | 安全性の不変条件。自動テストで強制 |
| Shell | 広告の見た目。独立した HTML/CSS/JS モジュール |
| Behavior | 広告の挙動。スロットに差す部品 |
| Slot | 挙動の差し込み口。1 スロット 1 挙動 |
| Creative | 広告の中身データ（コピー・架空ブランド・色） |
| BrowserFrame | ゲーム領域を包む偽ブラウザ UI。ハイジャック系パターンの安全な作用先 |
| Encounter Template | ステージを構成する役割スロットの列。生成器が埋める |
| threat | 各広告の放置コスト。Prioritization の基礎 |
| escape | パターン定義のユーザー向け脱出ノウハウ facet |
