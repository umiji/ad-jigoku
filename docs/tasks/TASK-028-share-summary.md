# TASK-028 — 共有サマリ（seed URL / テキスト / OG画像）

- Milestone: M4 / Phase 1
- Depends on: 024
- Size: 1 session

## Objective

GAME §21 の共有機能を実装する。

## Context

GAME §21。**ただし「共有をコアゲームプレイの前提にしない」**（§21 の明示的要求）。
Growth Loop（PRODUCT §17.1）の `Share` にあたる。

## Files to create

```text
apps/web/src/game/share/summary.ts            共有テキスト生成
apps/web/src/game/share/ShareSheet.tsx
apps/web/src/app/api/og/route.tsx             OG 画像生成
apps/web/src/app/c/[seed]/page.tsx            Seed Challenge の入口
```

## Implementation requirements

1. 共有テキストは GAME §21 の形式:
   ```text
   広告地獄 Lv.7 脱出成功
   00:48.21
   14パターン突破
   ノーミス
   主犯：Fake Close × Respawn
   「広告を閉じたら、広告が増えた。」
   ```
   - 最後の一行は `culprit` に応じて変わる。`DESIGN.md §13` のトーン
2. Seed URL: `/c/<seed>?st=<stage>`。開くと同じ地獄が始まる
3. OG 画像: Next.js の `ImageResponse` で動的生成。
   - スコア / ステージ / 主犯パターン / 時間
   - `DESIGN.md` のトークンに準拠（ダーク、大きいタイポグラフィ）
   - **フォントのサブセットを埋め込む**（日本語）
4. Web Share API があれば使う。なければクリップボードコピー
5. **共有しなくてもゲームは完全に遊べる**。共有を要求するダイアログを出さない
6. スクリーンショット取得は任意（MVP では OG 画像で代替）

## Acceptance criteria

- [ ] 共有テキストが生成される
- [ ] seed URL を開くと同じステージ構成になる
- [ ] OG 画像が生成され、X / Slack でプレビューされる
- [ ] 日本語が OG 画像で正しくレンダリングされる
- [ ] 共有を拒否してもゲームが続けられる
- [ ] 共有 URL に個人情報が含まれない（PRODUCT §20）

## Test requirements

- 共有テキストのスナップショットテスト
- seed URL のラウンドトリップ e2e
- OG 画像生成のスモークテスト

## Definition of Done

- acceptance criteria を全て満たす
- **M4 完了**: ゲームとして一通り成立している
