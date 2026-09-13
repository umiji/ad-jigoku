/**
 * 各カテゴリ 1 件 + 最も複雑な 2 件（CLS-11 Fake Close / COM-12 Infinite Hell）のサンプル。
 * TASK-003 acceptance「11 カテゴリすべてを表現できる」の実証データ。TASK-004 の投入テンプレートでもある。
 * 値は AD_UX_PATTERN_CATALOG.md の表と一致させている。
 */
import type { ImproveFacet } from '../src/schema/improve'
import type { PatternDefinition } from '../src/schema/pattern'

const baseImprove: ImproveFacet = {
  whyItHurts: { ja: 'ユーザーの操作を妨げ、離脱を招く。' },
  recommendations: [{ ja: '閉じるボタンを 44px 以上にし、常に視認できるようにする。', effort: 'low', expectedSeverityReduction: 3 }],
  adFriendlyAlternative: { ja: '広告枠は維持しつつ、閉じる操作を標準的な位置・サイズに揃える。' },
}

export const SAMPLE_CLS_11: PatternDefinition = {
  id: 'CLS-11',
  category: 'CLS',
  name: { ja: '偽の閉じるボタン', en: 'Fake Close' },
  definition: { ja: '閉じるように見える要素が広告クリック等を発生させる' },
  severity: 18,
  severitySource: 'hypothesis',
  gameDifficulty: 5,
  dimensions: { deception: 3, interactionFriction: 2, cumulativeEffect: 2 },
  game: {
    shell: 'popup',
    behaviors: {
      spawn: { id: 'spawn:immediate' },
      close: { id: 'close:fake', params: { decoyCount: { min: 1, max: 2 } } },
    },
    creative: { kinds: ['sale', 'notice'] },
    playerActions: ['CLOSE', 'REPORT'],
    failureCondition: { kind: 'wrong-target' },
    warning: 'subtle',
    interactionComplexity: 3,
    uncertainty: 4,
    timePressure: 3,
    comboTags: ['popup', 'fake-close'],
    incompatibleWith: [],
    patienceEffect: { onSpawn: 5, onMistake: 25, perSecondAlive: 0 },
    education: { ja: '閉じるためのUIに見せかけて別の操作を誘導するパターン。本物の×は小さく端にある。' },
  },
  detect: {
    layer: 2,
    signals: ['interaction.clickOutcome', 'dom.boundingBoxes'],
    detectorId: 'fake-close-click-outcome',
    confidence: 'deterministic',
    scoreContributing: true,
  },
  improve: baseImprove,
  escape: { techniques: ['tap-backdrop', 'browser-back-once'], note: { ja: '×が2つ見えたら、小さいほうが本物であることが多い。' } },
  fixture: { builderId: 'fake-close-popup', expected: { detected: true }, negativeCases: ['plain-popup'] },
}

export const SAMPLE_COM_12: PatternDefinition = {
  id: 'COM-12',
  category: 'COM',
  name: { ja: '無限地獄', en: 'Infinite Hell' },
  definition: { ja: '複数広告を閉じても連続出現' },
  severity: 20,
  severitySource: 'hypothesis',
  gameDifficulty: 5,
  dimensions: { persistence: 3, interruption: 3, cumulativeEffect: 3, timeCost: 2 },
  composedOf: ['PER-01', 'PER-02', 'INT-01'],
  game: {
    // COM-* は専用 shell / behaviors を持たない。composedOf を生成器が同時起動する（GAME_ENGINE_DESIGN §7.1）
    playerActions: ['CLOSE', 'SMASH', 'ESCAPE'],
    failureCondition: { kind: 'patience-zero' },
    warning: 'none',
    interactionComplexity: 5,
    uncertainty: 4,
    timePressure: 5,
    comboTags: ['respawn', 'multi-layer', 'popup'],
    incompatibleWith: [],
    patienceEffect: { onSpawn: 4, onMistake: 10, perSecondAlive: 2 },
    education: { ja: '閉じても閉じても次が出る。1つずつ確実に処理し、慌てて偽×を押さないことが唯一の脱出路。' },
    maxCloseDelayMsOverride: 6000,
  },
  improve: baseImprove,
}

const simple = (
  id: PatternDefinition['id'],
  category: PatternDefinition['category'],
  ja: string,
  en: string,
  severity: number,
  gameDifficulty: PatternDefinition['gameDifficulty'],
): PatternDefinition => ({
  id,
  category,
  name: { ja, en },
  definition: { ja: `${ja}の定義` },
  severity,
  severitySource: 'hypothesis',
  gameDifficulty,
  dimensions: { interruption: 1 },
})

export const SAMPLE_INT_01: PatternDefinition = {
  ...simple('INT-01', 'INT', '即時ポップアップ', 'Immediate Popup', 10, 2),
  game: {
    shell: 'popup',
    behaviors: { spawn: { id: 'spawn:immediate' }, close: { id: 'close:instant' } },
    playerActions: ['CLOSE', 'SMASH'],
    failureCondition: { kind: 'patience-zero' },
    warning: 'none',
    interactionComplexity: 1,
    uncertainty: 1,
    timePressure: 2,
    comboTags: ['popup'],
    incompatibleWith: [],
    patienceEffect: { onSpawn: 5, onMistake: 5, perSecondAlive: 0.5 },
    education: { ja: 'ページを開いた瞬間に出るポップアップ。' },
  },
}

export const SAMPLE_PER_01: PatternDefinition = simple('PER-01', 'PER', '再出現広告', 'Respawning Ad', 13, 4)
export const SAMPLE_PER_02: PatternDefinition = simple('PER-02', 'PER', '多層ポップアップ', 'Multi-layer Popup', 15, 5)

export const SAMPLES_ALL_CATEGORIES: PatternDefinition[] = [
  SAMPLE_CLS_11,
  SAMPLE_INT_01,
  simple('OBS-01', 'OBS', '全画面オーバーレイ', 'Fullscreen Overlay', 12, 2),
  simple('ACC-04', 'ACC', '見えないクリック領域', 'Invisible Click Zone', 15, 4),
  simple('DEC-02', 'DEC', '偽ダウンロード', 'Fake Download', 16, 4),
  simple('ATT-02', 'ATT', '自動音声再生', 'Auto-play Sound', 13, 3),
  simple('TIME-01', 'TIME', '閉じるまでカウントダウン', 'Countdown Before Close', 9, 2),
  SAMPLE_PER_01,
  SAMPLE_PER_02,
  simple('LAY-01', 'LAY', 'レイアウトシフト', 'Layout Shift', 10, 3),
  simple('MOB-01', 'MOB', 'ビューポート占有', 'Viewport Dominance', 12, 2),
  SAMPLE_COM_12,
]
