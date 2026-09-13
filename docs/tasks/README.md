# Task Index

## 0. 読み方

- **1タスク = 1セッションで完結する単位**（GAME_REQUIREMENTS §28）
- 各タスクは単独で理解できるように書かれている。着手前に読むのは
  そのタスクファイル + `docs/design/ARCHITECTURE.md` + 関連する設計文書のみでよい
- `Depends on` が満たされていないタスクには着手しない
- タスク内で「設計を変えたほうがいい」と判断した場合は、実装を進めずに
  `docs/design/` を直す提案を出す（DESIGN.md §23 と同じ原則）

## 1. Milestones

> v0.2 (`docs/design/DECISIONS_v0.2.md`) 反映により、タスク数が 51 → 59 に増えている
> （013A/013B/013C/013D/014A/024A/024B/046A を追加）。

| M | 名前 | タスク | Phase | 完了条件 |
|---|---|---|---|---|
| M0 | Foundation | 001-004 | 1 | パターンカタログが型付きデータとして読み込める |
| M1 | Game Core (headless) | 005-012 | 1 | ブラウザなしでゲームが1本通る。seed 再現可能 |
| M2 | UI & Host | 013, 013A, 013B, 013D, 014, 014A, 015, 016 | 1 | 画面上でゲームが動く。BrowserFrame・汎用シェル・Creative データが揃う |
| M3 | Behaviors（旧 Simulators） | 013C, 017-022 | 1 | MVP 15 パターンが遊べる |
| M4 | Game Loop | 023-028, 024A, 024B | 1 | 開始→失敗/クリア→結果→再挑戦が成立する **かつ 面白さゲート（TASK-024B）を通過する** |
| M5 | Safety & Quality | 029-032 | 1 | 安全性（SAFE-01..13）・a11y・性能が CI で保証される |
| M6 | Landing Page | 033-036 | 1.5 | LP 自体が広告地獄として成立する |
| M7 | Evaluation Engine | 037-044 | 2 | フィクスチャに対する検出精度が測れる |
| M8 | Public Audit | 045-048, 046A | 3 | URL を入れるとレポートが出る。自己診断バッジが公開されている |
| M9 | Ranking & Trust | 049-051 | 4 | 公開ランキングと異議申立てが成立する |
| M10 | Owner Product | (未分解) | 5 | Phase 4 完了後に分解する |

**M4 の完了条件は v0.2 (D7) により「面白さゲート」に置き換わった。** TASK-024B が不通過の場合、
M5/M6 に進まない（`docs/design/DECISIONS_v0.2.md §7`）。

## 2. クリティカルパス

```text
001 → 002 ─┐
001 → 003 → 004 ─┬→ 005 → 006 → 007 → 008 → 009 → 010 → 011 → 012
            │                  ↓
            │      013D ───────┤
002 ────────┴→ 013 ─┬→ 013A ─┬→ 014 → 014A → 015 → 016 → 013C → 017..022 → 023..028(+024A,024B) → 029..032
                     └→ 013B ─┘                                                    ↓
                                                                               033 → 034 → 035 → 036
                                                                                    ↓
                          037 → 038 → 039 → 040..042 → 043 → 044 → 045..048(+046A) → 049..051
```

**M1 は M2 と並行できる**（エンジンが DOM を持たないため / ADR-002）。
これが monorepo とヘッドレス設計の実利。**013A/013B/013D も互いに並行できる**
（いずれも 013 の parts にのみ依存し、シェル同士は独立モジュールのため / ADR-009）。

## 3. Task List

### M0 — Foundation
| ID | Title | Depends on |
|---|---|---|
| [001](TASK-001-monorepo-foundation.md) | monorepo 基盤とツールチェーン | — |
| [002](TASK-002-design-tokens.md) | デザイントークンと DESIGN.md 強制 lint | 001 |
| [003](TASK-003-pattern-schema.md) | パターンスキーマとバリデータ | 001 |
| [004](TASK-004-catalog-data.md) | カタログ Markdown → JSON 変換（全パターン） | 003 |

### M1 — Game Core (headless)
| ID | Title | Depends on |
|---|---|---|
| [005](TASK-005-deterministic-primitives.md) | 決定論プリミティブ（RNG / 固定ステップ / state hash） | 001 |
| [006](TASK-006-game-state-reducer.md) | GameState と step() reducer 骨格 | 004, 005 |
| [007](TASK-007-simulator-registry.md) | BehaviorRegistry + ShellRegistry と ViewState 契約 | 006 |
| [008](TASK-008-stage-generator.md) | ステージ生成器（エンカウンターテンプレート + R1-R8） | 007 |
| [009](TASK-009-progress-patience.md) | Progress / Patience / 勝敗判定 / threat 計算 | 006 |
| [010](TASK-010-score-system.md) | スコアシステム（onClear 導出 + triage bonus） | 009 |
| [011](TASK-011-combo-rage.md) | コンボと RAGE | 010 |
| [012](TASK-012-replay-determinism.md) | リプレイ記録・再生と決定論回帰テスト | 008, 011 |

### M2 — UI & Host
| ID | Title | Depends on |
|---|---|---|
| [013](TASK-013-ad-components.md) | canonical 広告コンポーネント基盤（parts） | 002 |
| [013A](TASK-013A-shell-generic.md) | Shell: popup / interstitial / stickyBanner / inlineRect | 013 |
| [013B](TASK-013B-shell-media.md) | Shell: videoPlayer / densityStack | 013 |
| [013D](TASK-013D-creative-data.md) | Creative データ基盤（数百件 + 実在ブランド NG 検査） | 004 |
| [014](TASK-014-game-host.md) | ゲームホスト（rAF / ViewState→DOM / 入力→Intent） | 007, 013 |
| [014A](TASK-014A-browser-frame.md) | BrowserFrame（偽ブラウザ枠） | 014 |
| [015](TASK-015-content-surface.md) | 偽記事コンテンツ面と読了・設問メカニクス | 014 |
| [016](TASK-016-hud.md) | HUD（patience / progress / time / combo） | 014 |

### M3 — Behaviors（旧 Simulators）
| ID | Title | Depends on |
|---|---|---|
| [013C](TASK-013C-shell-deceptive.md) | Shell: fakeDownload / fakePlay（専用デザイン） | 013 |
| [017](TASK-017-sim-overlay.md) | spawn / surface behavior（INT-01, OBS-01） | 014, 013A |
| [018](TASK-018-sim-close-friction.md) | close slot behavior（CLS-01/03/05） | 017, 013A |
| [019](TASK-019-sim-deception.md) | deception / hitbox slot behavior（CLS-11, DEC-02, DEC-03） | 017, 013A, 013C |
| [020](TASK-020-sim-sticky-attention.md) | persist / attention slot behavior（OBS-03, OBS-06, ATT-01, ATT-02） | 017, 013B |
| [021](TASK-021-sim-persistence.md) | persist slot behavior: respawn / multi-layer（PER-01, PER-02） | 017, 013B |
| [022](TASK-022-sim-instability.md) | instability slot behavior（LAY-01、transform 方式） | 017, 013B |

### M4 — Game Loop
| ID | Title | Depends on |
|---|---|---|
| [023](TASK-023-smash-catharsis.md) | SMASH とカタルシス演出 | 017-022 |
| [024](TASK-024-results-screen.md) | 結果画面と教育表示（+ EscapeCard） | 012, 023 |
| [024A](TASK-024A-escape-library.md) | escape 技法ライブラリ + `/patterns/[id]` 図鑑ページ | 004, 024 |
| [024B](TASK-024B-fun-gate.md) | **面白さゲート**（プレイテスト実施・判定） | 024, 024A |
| [025](TASK-025-tutorial.md) | プレイアブルチュートリアル | 024 |
| [026](TASK-026-stage-progression.md) | Stage 1-5 のデータとプログレッション | 008, 024 |
| [027](TASK-027-endless-mode.md) | Endless モード | 026 |
| [028](TASK-028-share-summary.md) | 共有サマリ（seed URL / テキスト / OG画像） | 024 |

### M5 — Safety & Quality
| ID | Title | Depends on |
|---|---|---|
| [029](TASK-029-safety-invariants.md) | Safety Invariants テストスイート（SAFE-01..13） | 022, 016, 014A |
| [030](TASK-030-a11y-reduced-motion.md) | アクセシビリティと reduced-motion 対応 | 029 |
| [031](TASK-031-audio-opt-in.md) | オプトイン音声と効果音 | 023 |
| [032](TASK-032-performance-budget.md) | 性能予算の CI 強制（Phase 1 完成 = 024B 通過が前提） | 029 |

### M6 — Landing Page
| ID | Title | Depends on |
|---|---|---|
| [033](TASK-033-lp-shell-hero.md) | LP シェルと Hero、LpFlow ステートマシン | 013 |
| [034](TASK-034-lp-escalation.md) | エスカレーション段階 01-07 | 033 |
| [035](TASK-035-lp-escape-cta.md) | Escape / Game・Audit 導線 / デスクトップ構成 | 034 |
| [036](TASK-036-lp-design-qa.md) | DESIGN.md 準拠 QA と視覚回帰 | 035, 029 |

### M7-M9 — Phase 2 以降
| ID | Title | Depends on |
|---|---|---|
| [037](TASK-037-evidence-schema.md) | Evidence スキーマと保存（Cloudflare R2） | 004 |
| [038](TASK-038-probe-runner.md) | Probe runner（Playwright / シナリオ実行、GitHub Actions ワーカー） | 037 |
| [039](TASK-039-hell-generator.md) | Hell Generator（フィクスチャ + 期待値） | 004, 038 |
| [040](TASK-040-detectors-geometry.md) | 検出器 1: 幾何・占有・密度 | 039 |
| [041](TASK-041-detectors-timing.md) | 検出器 2: タイミング・閉じる摩擦・再発 | 039 |
| [042](TASK-042-detectors-media-compound.md) | 検出器 3: メディア・レイアウト・複合 | 039 |
| [043](TASK-043-scorer.md) | スコアラーとバージョニング | 040-042 |
| [044](TASK-044-accuracy-harness.md) | 検出精度ハーネス（precision/recall CI） | 043 |
| [045](TASK-045-audit-pipeline.md) | 監査ジョブパイプラインと API（GitHub Actions workflow_dispatch） | 043, 038 |
| [046](TASK-046-audit-ui.md) | 監査 UI（URL入力→進捗→レポート。AI判定は有料診断のみ） | 045 |
| [046A](TASK-046A-adslot-self-audit.md) | AdSlot + 自己診断バッジ | 046 |
| [047](TASK-047-detailed-report.md) | 詳細レポートと改善提案 | 046 |
| [048](TASK-048-reaudit-before-after.md) | 再評価と Before/After | 047 |
| [049](TASK-049-ranking.md) | ランキングのデータモデルと公開ページ | 048 |
| [050](TASK-050-appeals.md) | 異議申立て・訂正フロー | 049 |
| [051](TASK-051-trust-pages.md) | 評価基準公開・方法論・ポリシー | 049 |

## 4. 意図的に「まだ書いていない」こと

- **TASK-037 以降は概要レベル**。Phase 1 のプレイテスト結果でプロダクトの重心が変わる可能性があり、
  いま詳細化しても捨てることになる。M6 完了時点で詳細化する
- **Phase 5（Owner Product）は未分解**。認証・課金・monitoring は Phase 4 の反応を見てから
- **パターンを 15 個より増やすタスクは意図的に存在しない**。GAME §23 が明示的に非目標としている

## 5. 進行ルール

1. タスク着手時にブランチを切る
2. `Definition of Done` を全部満たすまでタスクを閉じない
3. UI を触ったタスクは必ず `DESIGN.md §23` のコンプライアンスパスを実施する
4. 設計と実装が矛盾したら**実装ではなく設計を直す**判断も選択肢に入れる（黙って設計を無視しない）
