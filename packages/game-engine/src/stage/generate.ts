import type { BehaviorId, PatternDefinition, PatternId, Slot } from '@ad-jigoku/pattern-catalog'
import { type DeviceProfile, type EngineTuning } from '../config'
import { msToSteps } from '../core/clock'
import { makeRng, type Rng } from '../core/rng'
import { pickFromRange, resolveParam } from '../core/range'
import type { Registries } from '../sim/registries'
import type { ScheduledSpawn } from '../state/types'
import { isWithinBand, stageDifficulty } from './difficulty'
import { rendezvousPick } from './rendezvous'
import { componentsOf, FRAME_CAPABILITIES_BY_DEVICE, isGamePattern, loadOf, passesStaticRules, usedSlots, type GamePattern } from './rules'
import type { EncounterTemplate, GenerationWarning, RoleSlot, StageDefinition } from './types'

/**
 * ステージ生成器（GAME_ENGINE_DESIGN.md §8.2 の 11 ステップ）。
 *
 *  1. stageDef からテンプレート列を選ぶ（物語ステージは固定、Endless は緩い）
 *  2. RoleSlot ごとに difficulty band / categories / requireTags で候補を絞る
 *  3. game facet を持ち、shell と全 behavior が登録済みのものだけ残す（AD-2）
 *  4. R2（シェル互換）・R3（ペア非互換）・R4（摩擦上限）・R6（SAFE-01）・R8（frame）で除外
 *  5. rendezvous hashing で 1 つ抽選（seed が同じなら同じ結果、カタログ追加で大半が保存される）
 *  6. rng('timing') で Range を確定値に焼き込む
 *  7. R5（認知負荷予算）・同時出現上限（DESIGN §19）を満たすまで出現を遅らせる
 *  8. R7（難易度帯）を検査。収まらなければ salt を変えて再抽選（最大 N 回。超えたら緩和して警告）
 *  9. ScheduledSpawn[] を返す（以降、実行中に再抽選しない）
 */

export type GenerateInput = {
  stageDef: StageDefinition
  catalog: readonly PatternDefinition[]
  registries: Registries
  tuning: EngineTuning
  seed: string
  device: DeviceProfile
  /** 'fixed' = 物語（テンプレート順固定） / 'loose' = Endless（ウェーブごとに難易度帯を上げる） */
  mode?: 'fixed' | 'loose'
  /** Endless のウェーブ番号（0 始まり）。難易度帯を +wave×0.5 する */
  wave?: number
}

export type GenerateResult = {
  spawns: ScheduledSpawn[]
  difficulty: number
  warnings: GenerationWarning[]
  /** 実際に使ったテンプレート ID 列（テストで「起承転結」が保たれることを確認する） */
  templateIds: string[]
}

/** R5 の判定窓: この時間内に出た広告の load を合算する */
export const LOAD_WINDOW_MS = 6000
const SPAWN_DELAY_STEP_MS = 500
const MAX_DELAY_ITERATIONS = 40
const FIRST_SPAWN_MS = 800

export function generateStage(input: GenerateInput): GenerateResult {
  const { stageDef, tuning } = input
  const retries = tuning.GENERATE_MAX_RETRIES
  let last: GenerateResult | undefined
  for (let salt = 0; salt <= retries; salt++) {
    const result = generateOnce(input, salt)
    if (isWithinBand(result.difficulty, stageDef.targetDifficulty, tuning.DIFFICULTY_TOLERANCE)) return result
    last = result
  }
  const relaxed = last ?? generateOnce(input, 0)
  relaxed.warnings.push({
    code: 'R7-relaxed',
    message: `難易度 ${relaxed.difficulty.toFixed(2)} が目標帯 ${stageDef.targetDifficulty.min}-${stageDef.targetDifficulty.max}（±${tuning.DIFFICULTY_TOLERANCE}）に ${retries + 1} 回で収まらず、最後の結果を採用`,
  })
  return relaxed
}

function generateOnce(input: GenerateInput, salt: number): GenerateResult {
  const { stageDef, catalog, registries, tuning, seed, device } = input
  const mode = input.mode ?? 'fixed'
  const wave = input.wave ?? 0
  const byId = new Map(catalog.map((p) => [p.id, p]))
  const rng = makeRng(`${seed}#${salt}`)
  const capabilities = FRAME_CAPABILITIES_BY_DEVICE[device]
  const warnings: GenerationWarning[] = []
  const spawns: ScheduledSpawn[] = []
  const maxConcurrent = stageDef.maxConcurrent?.[device] ?? tuning.MAX_CONCURRENT_ADS[device]
  const loadBudget = tuning.LOAD_BUDGET[device]
  const gamePatterns = catalog.filter(isGamePattern)

  const templates = mode === 'fixed' ? stageDef.templates : looseTemplates(stageDef, wave, rng)
  const forcedQueue = [...(stageDef.forcedPatterns ?? [])]
  let cursorMs = FIRST_SPAWN_MS
  let seq = 0

  templates.forEach((template, encounterIndex) => {
    const intensity = lerp(stageDef.escalation.startIntensity, stageDef.escalation.endIntensity, templates.length <= 1 ? 1 : encounterIndex / (templates.length - 1))
    const chosen: PatternDefinition[] = []
    template.roles.forEach((role, roleIndex) => {
      const key = `${salt}:${encounterIndex}:${roleIndex}`
      const roleWave = mode === 'loose' ? wave : 0
      const forcedId = role.forced ?? (role.role === 'interrupt' ? forcedQueue.shift() : undefined)
      const pick = choosePattern({ role, forcedId, gamePatterns, byId, registries, tuning, capabilities, chosen, seed, key, stageDef, roleWave, warnings })
      if (!pick) return
      chosen.push(pick)
      const components = componentsOf(pick, byId)
      components.forEach((component, ci) => {
        const spawnMs = scheduleTime(cursorMs, spawns, byId, registries, maxConcurrent, loadBudget, component, warnings)
        cursorMs = spawnMs
        // パラメータ焼き込みはスロット固有の RNG で行う: あるスロットのパターンが変わっても他スロットの確定値が動かない（seed 安定性）
        const slotRng = makeRng(`${seed}#${salt}:${key}:${ci}`)
        spawns.push(bakeSpawn(component, `e${encounterIndex}-r${roleIndex}-${ci}-${seq++}`, msToSteps(spawnMs), slotRng, role.role, pick.id))
        if (components.length > 1) cursorMs += 250 // COM の構成要素はほぼ同時（わずかにずらす）
      })
      const spacing = pickFromRange(template.spacingMs, rng('timing'))
      cursorMs += Math.round(spacing * (1 - 0.5 * intensity))
    })
    const gap = pickFromRange(stageDef.encounterGapMs, rng('timing'))
    cursorMs += Math.round(gap * (1 - 0.5 * intensity))
  })

  if (forcedQueue.length > 0) warnings.push({ code: 'forced-missing', message: `forcedPatterns が割り当てられなかった: ${forcedQueue.join(', ')}` })
  const difficulty = stageDifficulty(spawns, byId)
  return { spawns, difficulty, warnings, templateIds: templates.map((t) => t.id) }
}

type ChooseInput = {
  role: RoleSlot
  forcedId: PatternId | undefined
  gamePatterns: GamePattern[]
  byId: Map<string, PatternDefinition>
  registries: Registries
  tuning: EngineTuning
  capabilities: readonly ('back' | 'url' | 'tabs' | 'scrollContainer' | 'textInput' | 'linkNav')[]
  chosen: PatternDefinition[]
  seed: string
  key: string
  stageDef: StageDefinition
  roleWave: number
  warnings: GenerationWarning[]
}

function choosePattern(c: ChooseInput): GamePattern | undefined {
  const filter = {
    registries: c.registries,
    tuning: c.tuning,
    capabilities: c.capabilities,
    byId: c.byId,
    chosen: c.chosen,
    ...(c.stageDef.allowedPatterns ? { allowed: c.stageDef.allowedPatterns } : {}),
  }
  if (c.forcedId) {
    const forced = c.byId.get(c.forcedId)
    if (forced && isGamePattern(forced) && passesStaticRules(forced, filter)) return forced
    c.warnings.push({ code: 'forced-missing', message: `forced ${c.forcedId} は候補条件（実装・互換・安全）を満たさない` })
  }
  const band = c.role.difficulty ? { min: c.role.difficulty.min + c.roleWave * 0.5, max: c.role.difficulty.max + c.roleWave * 0.5 } : undefined
  let candidates = c.gamePatterns.filter((p) => {
    if (c.role.categories && !c.role.categories.includes(p.category)) return false
    if (band && (p.gameDifficulty < Math.floor(band.min) || p.gameDifficulty > Math.ceil(band.max))) return false
    if (c.role.requireTags && !c.role.requireTags.every((t) => p.game.comboTags.includes(t))) return false
    return passesStaticRules(p, filter)
  })
  if (candidates.length === 0 && c.role.role === 'wildcard') {
    candidates = c.gamePatterns.filter((p) => passesStaticRules(p, filter))
  }
  if (candidates.length === 0) {
    c.warnings.push({ code: 'no-candidate', message: `役割 ${c.role.role}（${c.key}）に候補なし` })
    return undefined
  }
  return rendezvousPick(candidates, (p) => p.id, c.seed, 'stage', c.key, (p) => c.stageDef.categoryWeights?.[p.category] ?? 1)
}

/**
 * R5 認知負荷予算と同時出現上限を満たす出現時刻を決める（満たさなければ遅らせる）。
 * 「同時」の定義: 出現から LOAD_WINDOW_MS の間はその広告が存在するとみなす。
 * 新しい出現時刻 t に対して (t - W, t] にある出現数 < maxConcurrent かつ Σ load + 自分 ≤ budget。
 */
function scheduleTime(
  desiredMs: number,
  spawns: readonly ScheduledSpawn[],
  byId: Map<string, PatternDefinition>,
  registries: Registries,
  maxConcurrent: number,
  loadBudget: number,
  next: GamePattern,
  warnings: GenerationWarning[],
): number {
  let ms = desiredMs
  const nextLoad = loadOf(next, registries)
  for (let i = 0; i < MAX_DELAY_ITERATIONS; i++) {
    const atStep = msToSteps(ms)
    const active = spawns.filter((s) => {
      const dSteps = atStep - s.atStep
      return dSteps >= 0 && dSteps <= msToSteps(LOAD_WINDOW_MS)
    })
    const load = active.reduce((sum, s) => {
      const p = byId.get(s.patternId)
      return sum + (p && isGamePattern(p) ? loadOf(p, registries) : 1)
    }, 0)
    if (active.length < maxConcurrent && load + nextLoad <= loadBudget) return ms
    ms += SPAWN_DELAY_STEP_MS
    if (i === 0) warnings.push({ code: 'R5-delayed', message: `${next.id} の出現を認知負荷予算/同時上限のため遅延` })
  }
  return ms
}

/** Range を確定値へ焼き込む（PATTERN_SCHEMA §3.4） */
function bakeSpawn(p: GamePattern, instanceId: string, atStep: number, rng: Rng, role: string, sourceId: PatternId): ScheduledSpawn {
  const behaviors: Partial<Record<Slot, { id: BehaviorId; params: Record<string, number> }>> = {}
  for (const slot of usedSlots(p)) {
    const spec = p.game.behaviors?.[slot]
    if (!spec) continue
    const params: Record<string, number> = {}
    for (const [k, v] of Object.entries(spec.params ?? {})) params[k] = resolveParam(v, rng('timing'))
    behaviors[slot] = { id: spec.id, params }
  }
  const creativeIndex = Math.floor(rng('creative')() * 1_000_000)
  const spawn: ScheduledSpawn = { instanceId, atStep, patternId: p.id, shellId: p.game.shell ?? '', behaviors, creativeIndex, role: sourceId === p.id ? role : `${role}:${sourceId}` }
  return spawn
}

function looseTemplates(stageDef: StageDefinition, wave: number, rng: Rng): EncounterTemplate[] {
  // Endless: テンプレートを緩く循環。wave ごとに 1 つ多く、役割のカテゴリ制約を外す（wildcard 化）
  const count = Math.min(stageDef.templates.length + wave, stageDef.templates.length * 2)
  const out: EncounterTemplate[] = []
  for (let i = 0; i < count; i++) {
    const base = stageDef.templates[Math.floor(rng('stage')() * stageDef.templates.length)]!
    const roles: RoleSlot[] = base.roles.map((r, j) => {
      if (j !== base.roles.length - 1) return r
      const { categories: _c, ...rest } = r
      return { ...rest, role: 'wildcard' }
    })
    out.push({ ...base, id: `${base.id}~w${wave}.${i}`, roles })
  }
  return out
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t))
}
