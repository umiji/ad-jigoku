# ようこそ、広告地獄へ。（仮）

> **広告地獄をゲームで笑い飛ばし、現実のWebサイトの広告UXを測って、改善までつなげるサービス。**

広告そのものを悪とするのではなく、**ユーザー体験を壊す広告UXを可視化し、改善を促す**。

```text
Experience → Awareness → Evaluation → Improvement → Better UX
```

## 現在の状態

**実装フェーズ（Phase 1 / M0〜）。** 進捗は `docs/tasks/0-task-list-ad-jigoku.csv` を参照。

- 要件: 確定（`docs/requirements/`）
- アーキテクチャ: **v0.2 反映済み**（`docs/design/DECISIONS_v0.2.md`。Shell×Behaviors の2軸モデル、
  BrowserFrame、エンカウンターテンプレート、Prioritization、escape facet、Cloudflare Pages/Actions 移行）
- タスク分解: 完了（`docs/tasks/` に 59 タスク。v0.2 で 013A/013B/013C/013D/014A/024A/024B/046A を追加）
- 実装: 進行中（`docs/tasks/0-task-list-ad-jigoku.csv` が単一の進捗台帳）

## ドキュメント

### まず読むもの

| 読みたいこと | ファイル |
|---|---|
| システム全体の設計 | [`docs/design/ARCHITECTURE.md`](docs/design/ARCHITECTURE.md) |
| **最新の決定事項（v0.2）** | [`docs/design/DECISIONS_v0.2.md`](docs/design/DECISIONS_v0.2.md) |
| 何を作るか（タスク一覧） | [`docs/tasks/README.md`](docs/tasks/README.md) |

### 要件（source of truth）

| ファイル | 役割 |
|---|---|
| [`AD_UX_PATTERN_CATALOG.md`](docs/requirements/AD_UX_PATTERN_CATALOG.md) | **広告UXパターンの定義。** Game / Audit / Improvement の共通基盤 |
| [`GAME_REQUIREMENTS.md`](docs/requirements/GAME_REQUIREMENTS.md) | パターンをどうゲーム化するか |
| [`PRODUCT_REQUIREMENTS.md`](docs/requirements/PRODUCT_REQUIREMENTS.md) | サービスとして何を提供するか |
| [`DESIGN.md`](docs/requirements/DESIGN.md) | **UI 実装の設計契約。** 勝手に色やコンポーネントを発明しない |
| [`DESIGN_REQUIREMENTS.md`](docs/requirements/DESIGN_REQUIREMENTS.md) | LP の要件 |
| [`AMIX_DESIGN_REFERENCE.md`](docs/requirements/AMIX_DESIGN_REFERENCE.md) | デザインベンチマークの分析 |

### 設計

| ファイル | 役割 |
|---|---|
| [`ARCHITECTURE.md`](docs/design/ARCHITECTURE.md) | システム全体 |
| [`PATTERN_SCHEMA.md`](docs/design/PATTERN_SCHEMA.md) | Shared Kernel のスキーマ |
| [`GAME_ENGINE_DESIGN.md`](docs/design/GAME_ENGINE_DESIGN.md) | ヘッドレス決定論エンジン |
| [`EVALUATOR_DESIGN.md`](docs/design/EVALUATOR_DESIGN.md) | 実サイト評価パイプライン |
| [`adr/`](docs/design/adr/) | 設計判断の記録（12件） |

## アーキテクチャの要点（3行）

1. **パターンカタログが Shared Kernel。** ゲームも評価も改善も、同じ1つの定義から派生する
2. **ゲームコアはヘッドレスで決定論的。** DOM も乱数も時計も持たないので、seed 再現と網羅テストができる
3. **評価は観測と判定を分離。** Score は保存済み Evidence の純粋関数なので、再クロールなしで再計算できる

## 原則

> **annoying by design, safe by implementation.**

広告UXのダークパターンをパロディにするが、このサイト自身がダークパターンになってはいけない。
安全性は「気をつける」ではなく**自動テスト（SAFE-01..13）で強制する**。

> **Ads = Bad ではなく、User-hostile Ad UX = Bad.**

## 開発

```bash
pnpm install                 # Node 22 / pnpm 10（packageManager で固定）
pnpm dev                     # apps/web を http://localhost:3000 で起動
pnpm ci                      # typecheck → lint → test → check-deps（CI と同じ）
```

依存方向（`ARCHITECTURE.md §5.1`）は `pnpm check-deps` と ESLint で機械的に強制される。
