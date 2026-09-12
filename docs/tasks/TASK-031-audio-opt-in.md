# TASK-031 — オプトイン音声と効果音

- Milestone: M5 / Phase 1
- Depends on: 023
- Size: 1 session

## Objective

音声を実装する。**既定は OFF。自動再生は絶対にしない。**

## Context

DESIGN_REQ §12:
> 「広告地獄を批判するサイト自身が、勝手に音を鳴らす」という矛盾を避ける。

MVP では任意機能だが、カタルシス（GAME §18）への寄与が大きいので実装する。

## Files to create

```text
apps/web/src/game/audio/AudioEngine.ts
apps/web/src/game/audio/sounds.ts
public/audio/*                             軽量な効果音
apps/web/src/game/audio/AudioToggle.tsx
```

## Implementation requirements

1. **既定 OFF。** ユーザーが明示的にONにしたときだけ `AudioContext` を作る
2. AudioContext の生成・resume は必ずユーザージェスチャー内で行う（SAFE-04）
3. 音の種類:
   - popup 出現 / close / smash / mistake / countdown tick / rage / clear / fail
4. ATT-02（Auto-play Sound パターン）の音は、
   **音声 ON のときのみ鳴る。OFF でもゲームは成立する**（TASK-020 と一貫）
5. 音量は控えめ。ユーザーが調整できる
6. ファイルサイズ: 全効果音の合計 100KB 以下。遅延読み込み
7. `prefers-reduced-motion` は音には適用しない（別概念）が、
   設定で音だけ切れること

## Acceptance criteria

- [ ] 初回訪問で音が鳴らない
- [ ] AudioContext がユーザー操作前に生成されない
- [ ] 音声 OFF でゲームが完全に成立する
- [ ] 音量調整ができる
- [ ] 効果音の合計が 100KB 以下
- [ ] SAFE-04 が通る

## Test requirements

- SAFE-04 の再検証
- 音声 OFF でのクリア e2e
- ファイルサイズの CI チェック

## Definition of Done

- acceptance criteria を全て満たす
