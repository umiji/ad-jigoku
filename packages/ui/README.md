# @ad-jigoku/ui

`DESIGN.md` の**唯一の実体**（`ARCHITECTURE.md §10.1`）。
デザイントークンと canonical component（`DESIGN.md §21`）を持つ。

`game-engine` には依存しない（`ARCHITECTURE.md §5.1`）。

---

## このプロダクトは常にダーク

**ライト / ダークの切り替えは存在しない。**

`DESIGN.md §3 MUST 2` が "Dark visual foundation" を要求しており、
明るいテーマは設計上のオプションではない。

- `styles/base.css` は `color-scheme: dark` を固定で宣言する
- テーマトグル、`prefers-color-scheme` による分岐、`.dark` クラスのたぐいを作らない
- 明るい面が必要なときは、テーマではなくトークン（`surface.popup`）で表現する
  （偽広告のポップアップは明るい紙色。これは「ライトテーマ」ではなく広告の見た目）

---

## 構成

```text
tokens/
  colors.ts      DESIGN.md §4
  type.ts        DESIGN.md §5
  spacing.ts     DESIGN.md §6
  motion.ts      DESIGN.md §14
  zIndex.ts      DESIGN.md §15
  shape.ts       DESIGN.md §16
  contrast.ts    WCAG コントラスト比の計算（テスト用の純粋関数）
  css-vars.ts    tokens → CSS 文字列（純粋関数）
  build-css.ts   CSS の書き出し / 検査（CLI）
styles/
  tokens.css          ← 生成物。手で編集しない
  tailwind-theme.css  ← 生成物。手で編集しない
  reset.css           最小限のリセット
  base.css            ダーク基盤（グレイン / ヴィネット / reduced-motion）
```

生成物は 2 つとも同じ `tokens/*.ts` から作られる。値の二重定義はない。

- `styles/tokens.css` … 素の CSS カスタムプロパティ。CSS Modules や生の CSS 用
- `styles/tailwind-theme.css` … Tailwind v4 の `@theme`。ユーティリティ生成用（OD-1）

```bash
pnpm --filter @ad-jigoku/ui tokens:build   # 生成
pnpm --filter @ad-jigoku/ui tokens:check   # 生成物が最新かを検査（CI で実行）
```

---

## 新しい色（やサイズ、モーション）が必要になったときの手順

**先に `DESIGN.md` を直す。** コードから始めない。

1. `docs/requirements/DESIGN.md` に追記する提案を出す
   - `DESIGN.md §4` は "Do not introduce another accent color without a design-system change." と書いてある
   - 「近い値がもう一つ欲しい」は却下される（`DESIGN.md §3 MUST 9`）。まずレイアウトを疑う
2. 合意できたら `DESIGN.md` を更新する
3. `packages/ui/tokens/*.ts` に、YAML の値を**そのまま**写す
4. `pnpm --filter @ad-jigoku/ui tokens:build` を実行し、生成された CSS も一緒にコミットする
5. `pnpm --filter @ad-jigoku/ui test` でコントラスト検証を通す
   （文字色 × 背景色は WCAG AA 4.5:1 以上。`DESIGN.md §20`）

`styles/tokens.css` を直接編集しても CI の `tokens:check` が差分を検出して落ちる。

---

## 逸脱を落とす lint

| ルール | 何が落ちるか | どこで |
|---|---|---|
| `color-no-hex` / `color-named` | CSS の生の16進カラー・色名（`#ff0000`, `red`） | stylelint |
| `function-disallowed-list` | CSS の `rgb()` / `hsl()` などのリテラル | stylelint |
| `declaration-property-value-disallowed-list` | `z-index: 9999`（0 と `auto` 以外の数値） | stylelint |
| 禁止コンポーネント名 | `CoolCard` / `ModernCard` / `PremiumCard` / `GlassCard` / `FeatureCard` | eslint |
| Tailwind 任意値記法 | `className="w-[123px]"` / `bg-[#ff0000]` | eslint |
| z-index のクラス直書き | `className="z-500"` | eslint |
| Tailwind 既定パレット | `bg-red-500` / `text-sm` / `p-7`（そもそも生成されない） | `@theme` の `--*-*: initial` |

```bash
pnpm lint:css                              # stylelint
pnpm -w exec eslint packages/ui apps/web   # eslint
```

生成物（`styles/tokens.css`, `styles/tailwind-theme.css`）だけが stylelint の対象外。

---

## トークン一覧を見る

```bash
pnpm dev
# http://localhost:3000/dev/tokens
```

## parts — シェル横断で再利用する部位（TASK-013）

`src/parts/`。DESIGN.md §8 の anatomy を構成する presentational component。**挙動を持たない**（閉じるタイミング・移動・再出現は
Behavior / LpFlow が決める）。各シェル（`src/shells/`）はこれらを組み合わせて作る。

| part | 役割 | `data-target` |
|---|---|---|
| `AdMeta` | PR / Sponsored ラベル（§13 の語彙は `copy.ts`） | label |
| `AdHeadline` / `AdBody` / `AdLegal` | 見出し（800）/ 短文 / 極小の注意書き | body / legal |
| `AdCTA` | 広告風 CTA。`<button>`。外部遷移しない（SAFE-05） | cta |
| `AdCountdown` | 「あと 2.7 秒」。必ず見せる（GAME §15.4） | — |
| `CloseButton` | 本物の ×。`visualScale` で見た目を縮めても**当たり判定は 44×44 以上**（DESIGN §19 / DESIGN_REQ §5.3 C） | close |
| `FakeCloseButton` | 偽の ×。見た目は紛らわしくてよいが `aria-label` は「広告のボタンです（閉じるボタンではありません）」と正直に書く | fake-close / decoy |
| `AdCreative` | 架空 Creative（013D の `Creative` 型）を描く抽象ビジュアル。実在ブランドを模倣しない | media |

`types.ts` の `AdPartState` / `MotionCue` は `packages/game-engine/src/sim/view.ts` の写し（ui は game-engine に依存できないため）。
**視覚的な騙しはゲーム、支援技術への嘘はダークパターン** — 偽 UI は見た目だけ偽装し、aria / role は常に本当の動作を説明する。
確認ページ: `/dev/components`。実測テスト: `apps/web/e2e/parts.spec.ts`（44px / axe / キーボード / 視覚回帰）。
