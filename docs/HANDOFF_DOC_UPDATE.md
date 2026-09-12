# HANDOFF — 設計 v0.2 の文書反映作業

対象: 文書更新を担当するエージェント（軽量モデル可）
入力: `docs/design/DECISIONS_v0.2.md`（**唯一の正**。ここに書いてないことを発明しない）
出力: 以下の変更をすべて適用し、1 コミットにまとめて `main` に push

## ルール

1. **DECISIONS_v0.2.md に根拠のない変更をしない。** 迷ったら変更せず、末尾の「未反映メモ」に書く
2. v0.1 の文章を消すときは、v0.2 の該当 § を参照する 1 行に置き換える（履歴を残す）
3. 数値（閾値・件数）は v0.2 にあるものだけ使う。ないものは `TBD (Q1)` のように未決 ID で書く
4. 日本語・英語混在の既存スタイルに合わせる
5. 完了後、`docs/HANDOFF_DOC_UPDATE.md` を削除し、`DECISIONS_v0.2.md` の Status を `Absorbed` に変える

## A. 要件文書（最小限の修正のみ）

| ファイル | 変更 |
|---|---|
| `requirements/GAME_REQUIREMENTS.md` §2.3, §17 | 「実広告ネットワーク禁止」→「**ゲーム内では**禁止。コンテンツページの実広告は PRODUCT §18.5 参照」 |
| `requirements/PRODUCT_REQUIREMENTS.md` | §10 の直後に **§10.5 User-side Remedy（escape）** を新設: v0.2 §6.1 の 3 行要約。§18 に **§18.5 Ad Placement Policy**: v0.2 §8.1 |
| `requirements/DESIGN.md` §21 Component Vocabulary | `BrowserFrame`, `AdSlot`, `EscapeCard` を追加 |

## B. 設計文書

| ファイル | 変更 |
|---|---|
| `design/ARCHITECTURE.md` | §5 に `packages/ui/shells/` と `apps/web/src/game/frame/` を追加。§7.3 を v0.2 §1 の 2 軸モデルに差し替え。§8.2 に BrowserFrame の言及。§11 に SAFE-12/13 を追加。§15 の LP 予算はそのまま。§16 を v0.2 §8 の表に差し替え。§20 の OD-1〜OD-12 に決着を記入（OD-7/8 は「Phase 2 で決定」のまま）。末尾に「v0.2 変更履歴」節 |
| `design/PATTERN_SCHEMA.md` | §3 GameFacet を v0.2 §1.2 の型に差し替え。§5 の後に **§5.5 EscapeFacet**（v0.2 §6.2）。§8 に V-13「shell.supports ⊇ behaviors スロット」、V-14「escape.techniques の参照先が存在」 |
| `design/GAME_ENGINE_DESIGN.md` | §7 Simulator Registry を **BehaviorRegistry + ShellRegistry**（v0.2 §1.3, §1.5）に差し替え。§7.1 の表を「シェル × 挙動」で書き直す。§8 Stage Generator を v0.2 §3.2〜§3.4 で書き直す（テンプレート・R1〜R8・rendezvous hashing）。§9 に **§9.4 Prioritization / threat**（v0.2 §5）。§13 に Q1 を追記 |
| `design/EVALUATOR_DESIGN.md` | §9 Job Pipeline を GitHub Actions `workflow_dispatch` + R2 に差し替え。§6 に「Vision detector は有料診断のみ実行」を明記 |
| `design/adr/README.md` + 新規 ADR | ADR-008 を v0.2 §8 で改訂。新規: **ADR-009** 2 軸パターンモデル（v0.2 §1）/ **ADR-010** BrowserFrame（§2）/ **ADR-011** エンカウンターテンプレートと合成ルール（§3）/ **ADR-012** 実広告配置ポリシー（§8.1）。各 ADR は既存フォーマット（Context / Decision / Consequences）で 40 行以内 |

## C. タスク文書

### 変更

| タスク | 変更 |
|---|---|
| 001 | Cloudflare Pages、`output: 'export'`。CD は Pages の GitHub 連携 |
| 007 | 「SimulatorRegistry」→「BehaviorRegistry + ShellRegistry」。ViewState に `shellId` を追加 |
| 008 | v0.2 §3 全体（テンプレート・R1〜R8・rendezvous hashing）。Q1 の閾値は `EngineTuning` に仮置き |
| 009 | §5.2 threat 計算を追加 |
| 010 | `scoreEffect` 廃止・難易度 3 軸からの導出。triage bonus（§5.3） |
| 013 | タイトルを「canonical 広告コンポーネント基盤（parts）」に。シェル本体は 013A/B/C へ分離 |
| 017〜022 | 「simulator」を「behavior（スロット単位）」に読み替え。017=spawn+surface、018=close、019=deception+hitbox、020=attention、021=persist、022=instability。各タスクに「対応する Shell が存在すること」を前提条件に追加 |
| 024 | escape 表示（§6.3-1）を要件に追加。DoD に「面白さゲートの入口」 |
| 029 | SAFE-12 / SAFE-13 を追加 |
| 032 | DoD の「Phase 1 完成」を「面白さゲート通過済みであること」に依存させる |
| 038, 045 | Actions ワーカー・R2。pg-boss / Fly.io の記述を削除 |
| 046 | 「AI 判定は有料診断のみ」 |
| README.md | 下記の新規タスクを索引・依存グラフ・M4 の完了条件（= 面白さゲート）に反映 |

### 新規（既存フォーマットで作成。番号は挿入位置を保つためサフィックス）

| ID | タイトル | M | Depends | 要点 |
|---|---|---|---|---|
| 013A | Shell: popup / interstitial / stickyBanner / inlineRect | M2 | 013 | 汎用シェル 4 種。各 `supports` 宣言 |
| 013B | Shell: videoPlayer / densityStack | M2 | 013 | メディア系 2 種 |
| 013C | Shell: fakeDownload / fakePlay（専用デザイン） | M3 | 013 | 偽装系。1 シェル 1 デザイン。DESIGN.md §23 パス必須 |
| 013D | Creative データ基盤（数百件 + 実在ブランド NG 検査） | M2 | 004 | v0.2 §1.4 |
| 014A | BrowserFrame | M2 | 014 | v0.2 §2 全体。SAFE-12 |
| 024A | escape 技法ライブラリ + `/patterns/[id]` 図鑑ページ | M4 | 004, 024 | v0.2 §6。技法約 15 種。静的生成 |
| 024B | 面白さゲート（プレイテスト実施・判定） | M4 | 024, 024A | v0.2 §7。コードなし。通過しなければ M5 に進まない |
| 046A | AdSlot + 自己診断バッジ | M8 | 046 | v0.2 §8.1 |

## D. CLAUDE.md / README.md

- `CLAUDE.md` §6 に v0.2 §10 の用語を追加。§4 に「ゲーム/LP ルートに実広告を入れない」「サードパーティ広告ブロッカーを推奨しない」を追加
- `README.md` の「現在の状態」を更新（設計 v0.2 反映済み・実装未着手・TASK-001 から）

## E. 検証

- 全 `.md` の相対リンクが解決すること（前回のリンク検査スクリプトと同じ手順）
- `docs/tasks/README.md` の索引とファイル数が一致すること
- `DECISIONS_v0.2.md` の D1〜D10 それぞれについて、反映先ファイルを 1 つ以上挙げられること（コミットメッセージに列挙）
