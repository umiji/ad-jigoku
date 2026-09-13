/**
 * デバッグ CLI（TASK-008 DoD）: `pnpm game:preview-stage --seed=X --stage=stage-1 [--device=mobile] [--real]`
 * 生成結果（ScheduledSpawn[]）をテキスト表示する。
 *
 * 既定では `--assume-implemented`: カタログが参照する shell / behavior を全て「実装済み」とみなす
 * スタブレジストリで生成する（behavior 実装前にテンプレートを調整するため）。
 * `--real` を付けると `defaultRegistries`（実際に登録済みのもの）だけを候補にする。
 */
import { loadCatalog, SLOTS } from '@ad-jigoku/pattern-catalog'
import { DEFAULT_TUNING } from '../src/config'
import { STEP_MS } from '../src/core/clock'
import { createRegistries, defaultRegistries } from '../src/sim/registries'
import { noChange } from '../src/sim/types'
import type { Surface } from '../src/sim/view'
import { generateStage } from '../src/stage/generate'
import { getStage, STAGES } from '../src/stage/data'

const args = new Map(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => {
  const [k, v] = a.slice(2).split('=')
  return [k ?? '', v ?? 'true'] as const
}))
const seed = args.get('seed') ?? 'demo'
const stageId = args.get('stage') ?? 'stage-1'
const device = (args.get('device') ?? 'desktop') as 'mobile' | 'desktop'
const useReal = args.get('real') === 'true'

const catalog = loadCatalog()
const stageDef = getStage(stageId)

const SURFACE_BY_SHELL: Record<string, Surface> = {
  popup: 'overlay',
  interstitial: 'fullscreen',
  stickyBanner: 'sticky-bottom',
  videoPlayer: 'corner',
  inlineRect: 'inline',
  densityStack: 'overlay',
  fakeDownload: 'inline',
  fakePlay: 'inline',
}

function stubRegistries() {
  const r = createRegistries()
  for (const p of catalog) {
    const g = p.game
    if (!g?.shell || !g.behaviors) continue
    if (!r.shells.has(g.shell)) {
      r.shells.register({ id: g.shell, parts: ['label', 'body', 'cta', 'close'], supports: [...SLOTS], surface: SURFACE_BY_SHELL[g.shell] ?? 'overlay', sizeHint: 'medium' })
    }
    for (const slot of SLOTS) {
      const spec = g.behaviors[slot]
      if (spec && !r.behaviors.has(spec.id)) {
        r.behaviors.register({ id: spec.id, slot, friction: slot === 'close' || slot === 'deception' ? 1 : 0, load: 1, init: () => noChange(null), onTick: (s) => noChange(s), onIntent: (s) => noChange(s) })
      }
    }
  }
  return r
}

const registries = useReal ? defaultRegistries : stubRegistries()
const result = generateStage({ stageDef, catalog, registries, tuning: DEFAULT_TUNING, seed, device })

console.log(`stage=${stageId} "${stageDef.name.ja}"  seed=${seed}  device=${device}  registries=${useReal ? 'real' : 'stub(assume-implemented)'}`)
console.log(`templates: ${result.templateIds.join(' → ')}`)
console.log(`difficulty: ${result.difficulty.toFixed(2)} (target ${stageDef.targetDifficulty.min}-${stageDef.targetDifficulty.max})`)
console.log('')
console.log('  t(ms)   step  role                 pattern  shell         behaviors')
for (const s of [...result.spawns].sort((a, b) => a.atStep - b.atStep)) {
  const p = catalog.find((x) => x.id === s.patternId)
  const behaviors = Object.values(s.behaviors)
    .map((b) => `${b!.id}${Object.keys(b!.params).length ? JSON.stringify(b!.params) : ''}`)
    .join(' ')
  console.log(`${String(Math.round(s.atStep * STEP_MS)).padStart(7)}  ${String(s.atStep).padStart(5)}  ${(s.role ?? '').padEnd(20)} ${s.patternId.padEnd(8)} ${s.shellId.padEnd(13)} ${behaviors}  # ${p?.name.ja ?? ''}`)
}
if (result.warnings.length > 0) {
  console.log('')
  for (const w of result.warnings) console.log(`warning[${w.code}]: ${w.message}`)
}
if (result.spawns.length === 0) console.log(`(出現なし。--real の場合は behavior 未実装の可能性。登録済み stage: ${Object.keys(STAGES).join(', ')})`)
