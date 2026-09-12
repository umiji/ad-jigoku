# TASK-035 — Escape / Game・Audit 導線 / デスクトップ構成

- Milestone: M6 / Phase 1.5
- Depends on: 034
- Size: 1 session

## Objective

LP の 08 ESCAPE と 09 GAME/AUDIT を実装し、デスクトップ構成を整える。

## Context

`DESIGN.md §10` の 08-09、`DESIGN_REQ §10` の Game Transition、
`§9` の CTA、`§16` / `DESIGN §19` の Responsive。

## Files to create

```text
apps/web/src/lp/EscapePanel.tsx
apps/web/src/lp/GameEntry.tsx
apps/web/src/lp/AuditEntry.tsx
apps/web/src/lp/desktop/                  デスクトップ固有の構成
```

## Implementation requirements

1. **08 ESCAPE**（DESIGN_REQ §10）:
   - 広告が3-5枚重なった最高潮
   - 最後の広告: 「おめでとうございます。あなたは広告地獄を体験しました。」
   - **この瞬間だけ通常UIに切り替わる。** 演出上の解放
2. **09 GAME / AUDIT**:
   - CTA は広告風だが**行き先は正直に**（DESIGN §12）
   - 「広告地獄を体験する」→ ゲーム
   - 「サイトを診断する」→ Audit（Phase 3 未実装なら受け皿ページ）
   - 「地獄ランキングを見る」→ Phase 4 未実装なら非表示
   - **CTA が何をするか明確であること**（DESIGN_REQ §9）
3. デスクトップ（DESIGN §19）:
   - 非対称な配置、重なるウィンドウ、環境的タイポグラフィ、広い余白
   - **モバイルレイアウトを引き伸ばさない**
   - 同じ情報構造を維持（DESIGN_REQ §16）
4. 「これは本物の広告ではない」ことが明確であること（DESIGN_REQ §22 Trust）
5. フッターに最低限の情報: このサイトについて / プライバシー / 連絡先

## Acceptance criteria

- [ ] Escape の解放感がある
- [ ] CTA の行き先が正直
- [ ] Phase 未実装の導線が破綻していない（404 にしない）
- [ ] デスクトップがモバイルの引き伸ばしになっていない
- [ ] 同じ情報構造が両デバイスで維持されている
- [ ] 本物の広告でないことが明確
- [ ] `DESIGN_REQ §22` の Product / Trust チェックリストを満たす

## Test requirements

- mobile / desktop の視覚回帰
- 全 CTA の遷移先テスト（SAFE-05 含む）

## Definition of Done

- acceptance criteria を全て満たす
