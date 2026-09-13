/**
 * `pnpm game:simulate --seed=X --stage=stage-1 --strategy=optimal [--device=mobile] [--real] [--json]`
 * ヘッドレスで 1 ラン実行して結果を出す（TASK-012 DoD）。
 * 既定では preview-stage と同じ「実装済みとみなす」スタブレジストリ（behavior 実装前でもエンジンの既定ルールで遊べる）。
 */
import { catalogVersion, loadCatalog, SLOTS } from '@ad-jigoku/pattern-catalog'
import { createRegistries, defaultRegistries } from '../src/sim/registries'
import { noChange } from '../src/sim/types'
import type { Surface } from '../src/sim/view'
import { getStage } from '../src/stage/data'
import { isStrategyId } from '../src/replay/strategies'
import { simulate } from '../src/replay/simulate'

const args = new Map(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => {
  const [k, v] = a.slice(2).split('=')
  return [k ?? '', v ?? 'true'] as const
}))
const seed = args.get('seed') ?? 'demo'
const stageId = args.get('stage') ?? 'stage-1'
const device = (args.get('device') ?? 'desktop') as 'mobile' | 'desktop'
const strategyArg = args.get('strategy') ?? 'optimal'
if (!isStrategyId(strategyArg)) {
  console.error(`未知の strategy "${strategyArg}"（optimal / naive / spam / idle / fake-close-victim）`)
  process.exit(2)
}

const catalog = loadCatalog()
const SURFACE_BY_SHELL: Record<string, Surface> = { popup: 'overlay', interstitial: 'fullscreen', stickyBanner: 'sticky-bottom', videoPlayer: 'corner', inlineRect: 'inline', densityStack: 'overlay', fakeDownload: 'inline', fakePlay: 'inline' }
function stubRegistries() {
  const r = createRegistries()
  for (const p of catalog) {
    const g = p.game
    if (!g?.shell || !g.behaviors) continue
    if (!r.shells.has(g.shell)) r.shells.register({ id: g.shell, parts: ['label', 'body', 'cta', 'close'], supports: [...SLOTS], surface: SURFACE_BY_SHELL[g.shell] ?? 'overlay', sizeHint: 'medium' })
    for (const slot of SLOTS) {
      const spec = g.behaviors[slot]
      if (spec && !r.behaviors.has(spec.id)) r.behaviors.register({ id: spec.id, slot, friction: slot === 'close' || slot === 'deception' ? 1 : 0, load: 1, init: () => noChange(null), onTick: (s) => noChange(s), onIntent: (s) => noChange(s) })
    }
  }
  return r
}
const registries = args.get('real') === 'true' ? defaultRegistries : stubRegistries()
const stage = getStage(stageId)

const { summary, record } = simulate(
  { seed, mode: 'story', stageId, catalog, accessibility: { reducedMotion: false, pointerPrecision: 'fine', audioEnabled: false, extendedTimeouts: false }, device, contentTotalLines: stage.contentLength, ...(stage.timeLimitMs !== undefined ? { timeLimitMs: stage.timeLimitMs } : {}) },
  strategyArg,
  catalogVersion.catalogVersion,
  { registries },
)

if (args.get('json') === 'true') {
  console.log(JSON.stringify({ summary, record }, null, 2))
} else {
  console.log(`seed=${seed} stage=${stageId} strategy=${strategyArg} device=${device} engine=${record.version.engine} catalog=${record.version.catalog}`)
  console.log(`result: ${summary.phase.toUpperCase()}  score=${summary.score}  patience=${summary.patience}  time=${(summary.elapsedMs / 1000).toFixed(1)}s  ads=${summary.adsSeen}  mistakes=${summary.mistakes}  bestChain=${summary.bestChain}`)
  if (summary.culprit) console.log(`culprit: ${summary.culprit}`)
  if (summary.namedCombos.length) console.log(`enemy combos: ${summary.namedCombos.join(' / ')}`)
  console.log(`hash: ${summary.hash}  inputs=${record.inputs.length}  steps=${record.totalSteps}`)
}
