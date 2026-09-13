import type { PatternCategoryCode, PatternDefinition, PatternId, Slot } from '@ad-jigoku/pattern-catalog'
import { createRegistries, type Registries } from '../sim/registries'
import { noChange, type Behavior, type Shell } from '../sim/types'

/**
 * 生成器テスト用のミニカタログ + レジストリ。
 * 実カタログ（TASK-004）に依存せず、R1〜R8 と rendezvous の性質だけを検証する。
 */

export function testBehavior(id: string, slot: Slot, friction = 1, load = 1): Behavior<null> {
  return { id, slot, friction, load, init: () => noChange(null), onTick: (s) => noChange(s), onIntent: (s) => noChange(s) }
}

export const SHELLS: Shell[] = [
  { id: 'popup', parts: ['label', 'body', 'cta', 'close'], supports: ['spawn', 'close', 'deception', 'hitbox'], surface: 'overlay', sizeHint: 'medium' },
  { id: 'interstitial', parts: ['label', 'body', 'cta', 'close'], supports: ['spawn', 'surface'], surface: 'fullscreen', sizeHint: 'fullscreen' },
  { id: 'stickyBanner', parts: ['label', 'body', 'cta', 'close'], supports: ['spawn', 'persist'], surface: 'sticky-bottom', sizeHint: 'small' },
  { id: 'fakeDownload', parts: ['label', 'body', 'cta'], supports: ['spawn', 'deception'], surface: 'inline', sizeHint: 'medium' },
]

export function fixtureRegistries(): Registries {
  const r = createRegistries()
  for (const s of SHELLS) r.shells.register(s)
  r.behaviors.register(testBehavior('spawn:immediate', 'spawn', 0, 1))
  r.behaviors.register(testBehavior('spawn:delayed', 'spawn', 0, 1))
  r.behaviors.register(testBehavior('close:instant', 'close', 0, 1))
  r.behaviors.register(testBehavior('close:delayed', 'close', 1, 1))
  r.behaviors.register(testBehavior('close:moving', 'close', 2, 2))
  r.behaviors.register(testBehavior('close:fake', 'close', 2, 2))
  r.behaviors.register(testBehavior('close:heavy', 'close', 9, 1)) // FRICTION_CAP 超過用
  r.behaviors.register(testBehavior('surface:fullscreen', 'surface', 0, 2))
  r.behaviors.register(testBehavior('persist:sticky', 'persist', 0, 1))
  r.behaviors.register(testBehavior('deception:fake-download', 'deception', 1, 2))
  return r
}

type Spec = {
  id: PatternId
  category: PatternCategoryCode
  difficulty: 1 | 2 | 3 | 4 | 5
  shell?: string
  behaviors?: NonNullable<PatternDefinition['game']>['behaviors']
  incompatibleWith?: PatternId[]
  comboTags?: NonNullable<PatternDefinition['game']>['comboTags']
  frame?: NonNullable<PatternDefinition['game']>['frame']
  correctInaction?: boolean
  composedOf?: PatternId[]
  noGame?: boolean
}

export function pattern(spec: Spec): PatternDefinition {
  const base: PatternDefinition = {
    id: spec.id,
    category: spec.category,
    name: { ja: spec.id, en: spec.id },
    definition: { ja: spec.id },
    severity: 10,
    severitySource: 'hypothesis',
    gameDifficulty: spec.difficulty,
    dimensions: { interruption: 1 },
    ...(spec.composedOf ? { composedOf: spec.composedOf } : {}),
  }
  if (spec.noGame) return base
  return {
    ...base,
    game: {
      ...(spec.shell ? { shell: spec.shell } : {}),
      ...(spec.behaviors ? { behaviors: spec.behaviors } : {}),
      ...(spec.frame ? { frame: spec.frame } : {}),
      ...(spec.correctInaction ? { correctInaction: true } : {}),
      playerActions: ['CLOSE'],
      failureCondition: { kind: 'patience-zero' },
      warning: 'none',
      interactionComplexity: spec.difficulty,
      uncertainty: spec.difficulty,
      timePressure: spec.difficulty,
      comboTags: spec.comboTags ?? [],
      incompatibleWith: spec.incompatibleWith ?? [],
      patienceEffect: { onSpawn: 3, onMistake: 8, perSecondAlive: 0.5 },
      education: { ja: spec.id },
    },
  }
}

export const MINI_CATALOG: PatternDefinition[] = [
  pattern({ id: 'INT-01', category: 'INT', difficulty: 2, shell: 'popup', behaviors: { spawn: { id: 'spawn:immediate' }, close: { id: 'close:instant' } }, comboTags: ['popup'] }),
  pattern({ id: 'INT-02', category: 'INT', difficulty: 2, shell: 'popup', behaviors: { spawn: { id: 'spawn:delayed', params: { afterMs: { min: 1000, max: 3000 } } }, close: { id: 'close:instant' } }, comboTags: ['popup'] }),
  pattern({ id: 'OBS-01', category: 'OBS', difficulty: 2, shell: 'interstitial', behaviors: { spawn: { id: 'spawn:immediate' }, surface: { id: 'surface:fullscreen' } }, comboTags: ['fullscreen'], incompatibleWith: ['OBS-03'] }),
  pattern({ id: 'OBS-03', category: 'OBS', difficulty: 2, shell: 'stickyBanner', behaviors: { spawn: { id: 'spawn:immediate' }, persist: { id: 'persist:sticky' } }, comboTags: ['sticky'], incompatibleWith: ['OBS-01'] }),
  pattern({ id: 'CLS-03', category: 'CLS', difficulty: 2, shell: 'popup', behaviors: { spawn: { id: 'spawn:immediate' }, close: { id: 'close:delayed', params: { delayMs: { min: 2000, max: 4000 } } } }, comboTags: ['popup', 'delayed-close'] }),
  pattern({ id: 'CLS-05', category: 'CLS', difficulty: 4, shell: 'popup', behaviors: { spawn: { id: 'spawn:immediate' }, close: { id: 'close:moving' } }, comboTags: ['popup', 'moving-close'] }),
  pattern({ id: 'CLS-11', category: 'CLS', difficulty: 5, shell: 'popup', behaviors: { spawn: { id: 'spawn:immediate' }, close: { id: 'close:fake' } }, comboTags: ['popup', 'fake-close'] }),
  pattern({ id: 'DEC-02', category: 'DEC', difficulty: 4, shell: 'fakeDownload', behaviors: { spawn: { id: 'spawn:delayed', params: { afterMs: { min: 800, max: 2500 } } }, deception: { id: 'deception:fake-download' } }, comboTags: ['fake-download'], correctInaction: true }),
  // close 部位なし + correctInaction なし → 閉じる手段がないので選ばれてはいけない（R6b）
  pattern({ id: 'DEC-04', category: 'DEC', difficulty: 4, shell: 'fakeDownload', behaviors: { spawn: { id: 'spawn:immediate' }, deception: { id: 'deception:fake-download' } } }),
  // 実装なし（shell 未登録）→ 選ばれてはいけない
  pattern({ id: 'ATT-02', category: 'ATT', difficulty: 3, shell: 'videoPlayer', behaviors: { spawn: { id: 'spawn:immediate' } } }),
  // behavior 未登録 → 選ばれてはいけない
  pattern({ id: 'LAY-01', category: 'LAY', difficulty: 3, shell: 'popup', behaviors: { spawn: { id: 'spawn:immediate' }, hitbox: { id: 'hitbox:invisible' } } }),
  // 摩擦上限超過 → 選ばれてはいけない
  pattern({ id: 'CLS-13', category: 'CLS', difficulty: 4, shell: 'popup', behaviors: { spawn: { id: 'spawn:immediate' }, close: { id: 'close:heavy' } } }),
  // SAFE-01 違反（delayMs 上限超え）→ 選ばれてはいけない
  pattern({ id: 'TIME-02', category: 'TIME', difficulty: 2, shell: 'popup', behaviors: { spawn: { id: 'spawn:immediate' }, close: { id: 'close:delayed', params: { delayMs: { min: 9000, max: 12000 } } } } }),
  // frame 要件（textInput）→ mobile では選ばれてはいけない
  pattern({ id: 'MOB-05', category: 'MOB', difficulty: 3, shell: 'popup', behaviors: { spawn: { id: 'spawn:immediate' }, close: { id: 'close:instant' } }, frame: ['textInput'] }),
  // game facet なし → 選ばれてはいけない
  pattern({ id: 'OBS-05', category: 'OBS', difficulty: 1, noGame: true }),
  // COM: 構成要素を同時起動
  pattern({ id: 'COM-03', category: 'COM', difficulty: 4, composedOf: ['OBS-03', 'INT-01'], comboTags: ['sticky', 'popup'] }),
]
