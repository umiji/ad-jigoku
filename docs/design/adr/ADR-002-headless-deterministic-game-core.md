# ADR-002: ゲームコアをヘッドレス・決定論的にする

- Status: Proposed
- Date: 2026-09-12
- Drivers: AD-3, AD-6, AD-12

## Context

GAME_REQUIREMENTS は seed による再現 (§8.5, §25.2)、パターン単位の独立テスト (§25.4)、
全失敗の説明可能性 (§15.1) を要求している。React の state と useEffect でゲームを書くと、
どれも成立しない。

さらに ARCHITECTURE §11 の SAFE-01（全ての広告が必ず閉じられる）を
「全パターン × 1000 seed」で検証するには、ブラウザなしでロジックを回せる必要がある。

## Decision

`packages/game-engine` は以下を **import しない**:
`react`, DOM API, `Date`, `Math.random`, `setTimeout`。

- 全ての状態遷移は `step(run, intent) => { state, effects }` を通る
- 時間は `{ t: 'tick' }` intent でのみ進む（固定 16.667ms ステップ）
- 乱数は `ctx.rng(stream)` 経由。stream ごとに独立
- 副作用は `Effect[]` として返すだけ。実行は宿主の責務
- 入力は論理参照 (`TargetRef`)。ピクセル座標を記録しない

## Consequences

### 良い
- seed 共有・リプレイ・回帰テストが全部同じ仕組みで実現できる
- ゲームロジックのテストが msec オーダーで回る
- `prefers-reduced-motion` をエンジン入力にできるので「見た目と判定がずれる」事故が起きない

### 悪い
- React 側に「エンジンの状態を DOM に反映する」薄い層が必要（rAF ループ + 宣言的 ViewState）
- 「とりあえず動かす」までの距離が、直接 React で書くより長い

### 緩和
- ViewState を宣言的に持たせ、React 側はほぼ純粋な描画にする
- TASK-005〜006 で土台を先に作り、以降の simulator 実装は同じ型に沿うだけにする
