import { computeGameDifficulty } from './derived'
import { SLOTS, type Slot } from './schema/game'
import type { PatternDefinition } from './schema/pattern'

/**
 * PATTERN_SCHEMA.md §8 Validation Rules (V-01..V-14)。
 * データ単体で検査できるものはここで完結。実装の存在確認（V-05/06/07/13）は registry がまだ無いので、
 * 呼び出し側が `ImplementationMaps` を注入する（TASK-003 要件 5）。
 */

export type ValidationIssue = { rule: string; severity: 'error' | 'warn' | 'info'; patternId?: string; message: string }
export type ValidationResult = { errors: ValidationIssue[]; warnings: ValidationIssue[]; infos: ValidationIssue[] }

/** Markdown 側から抽出した値（scripts/catalog-parity が作る。V-01/V-02） */
export type MarkdownCatalogEntry = { id: string; severity: number; gameDifficulty: number }

export type ImplementationMaps = {
  /** ShellRegistry: id → supports(スロット集合) */
  shells?: ReadonlyMap<string, readonly Slot[]>
  /** BehaviorRegistry: behaviorId → slot */
  behaviors?: ReadonlyMap<string, Slot>
  /** DetectorRegistry: detectorId 集合 */
  detectors?: ReadonlySet<string>
  /** data/escape-techniques.json の id 集合 */
  escapeTechniques?: ReadonlySet<string>
}

export type ValidateOptions = {
  markdown?: readonly MarkdownCatalogEntry[]
  impl?: ImplementationMaps
  /** SAFE-01 のグローバル上限（エンジンの EngineTuning.MAX_CLOSE_DELAY_MS と一致させる） */
  maxCloseDelayMs?: number
  /** V-11: Probe が収集できる signal の集合（省略時はスキーマ enum 全部が収集可能とみなす） */
  collectableSignals?: ReadonlySet<string>
}

export const DEFAULT_MAX_CLOSE_DELAY_MS = 8000

export function validateCatalog(catalog: readonly PatternDefinition[], options: ValidateOptions = {}): ValidationResult {
  const issues: ValidationIssue[] = []
  const ids = new Set(catalog.map((p) => p.id))
  const push = (rule: string, severity: ValidationIssue['severity'], message: string, patternId?: string) =>
    issues.push(patternId ? { rule, severity, patternId, message } : { rule, severity, message })

  // V-01 / V-02: Markdown ↔ JSON
  if (options.markdown) {
    const md = new Map(options.markdown.map((m) => [m.id, m]))
    for (const m of options.markdown) if (!ids.has(m.id as PatternDefinition['id'])) push('V-01', 'error', `Markdown にあるが JSON にない: ${m.id}`, m.id)
    for (const p of catalog) {
      const m = md.get(p.id)
      if (!m) {
        push('V-01', 'error', `JSON にあるが Markdown にない: ${p.id}`, p.id)
        continue
      }
      if (m.severity !== p.severity) push('V-02', 'error', `severity 不一致: Markdown=${m.severity} JSON=${p.severity}（Markdown が正）`, p.id)
      if (m.gameDifficulty !== p.gameDifficulty)
        push('V-02', 'error', `gameDifficulty 不一致: Markdown=${m.gameDifficulty} JSON=${p.gameDifficulty}（Markdown が正）`, p.id)
    }
  }

  for (const p of catalog) {
    // V-03: composedOf の参照先
    for (const ref of p.composedOf ?? []) {
      if (!ids.has(ref)) push('V-03', 'error', `composedOf の参照先が存在しない: ${ref}`, p.id)
    }
    const g = p.game
    if (g) {
      // V-04: incompatibleWith の対称性
      for (const other of g.incompatibleWith) {
        const o = catalog.find((x) => x.id === other)
        if (!o) push('V-04', 'error', `incompatibleWith の参照先が存在しない: ${other}`, p.id)
        else if (!o.game?.incompatibleWith.includes(p.id)) push('V-04', 'error', `incompatibleWith が非対称: ${p.id} → ${other} はあるが逆がない`, p.id)
      }
      // V-05 / V-13: shell の存在と supports
      const shells = options.impl?.shells
      if (shells) {
        const supports = shells.get(g.shell)
        if (!supports) push('V-05', 'error', `shell "${g.shell}" が ShellRegistry に存在しない`, p.id)
        else {
          const used = (Object.keys(g.behaviors) as Slot[]).filter((s) => g.behaviors[s] !== undefined)
          for (const s of used) if (!supports.includes(s)) push('V-13', 'error', `shell "${g.shell}" はスロット "${s}" を supports に含まない`, p.id)
        }
      }
      const behaviors = options.impl?.behaviors
      if (behaviors) {
        for (const s of SLOTS) {
          const spec = g.behaviors[s]
          if (spec && !behaviors.has(spec.id)) push('V-05', 'error', `behavior "${spec.id}" が BehaviorRegistry に存在しない`, p.id)
        }
      }
      // V-08: maxCloseDelayMs がグローバル上限以下
      const cap = options.maxCloseDelayMs ?? DEFAULT_MAX_CLOSE_DELAY_MS
      if (g.maxCloseDelayMsOverride !== undefined && g.maxCloseDelayMsOverride > cap)
        push('V-08', 'error', `maxCloseDelayMsOverride=${g.maxCloseDelayMsOverride} がグローバル上限 ${cap} を超える（SAFE-01）`, p.id)
      // V-10: 導出 gameDifficulty との乖離
      const derived = computeGameDifficulty(p)
      if (derived !== undefined && Math.abs(derived - p.gameDifficulty) > 1)
        push('V-10', 'warn', `導出 gameDifficulty=${derived} とカタログ値=${p.gameDifficulty} の乖離が ±1 を超える`, p.id)
    }
    // V-06 / V-11: detect
    const d = p.detect
    if (d) {
      if (options.impl?.detectors && !options.impl.detectors.has(d.detectorId)) push('V-06', 'error', `detector "${d.detectorId}" の実装がない`, p.id)
      if (options.collectableSignals) for (const s of d.signals) if (!options.collectableSignals.has(s)) push('V-11', 'error', `signal "${s}" は Probe が収集できない`, p.id)
    }
    // V-09: adFriendlyAlternative
    if (p.improve && p.improve.adFriendlyAlternative.ja.trim().length === 0) push('V-09', 'error', 'improve.adFriendlyAlternative が空', p.id)
    // V-12: hypothesis
    if (p.severitySource === 'hypothesis') push('V-12', 'info', 'severity は仮説値（公開レポートで明示する）', p.id)
    // V-14: escape.techniques の参照先
    if (p.escape && options.impl?.escapeTechniques) {
      for (const t of p.escape.techniques) if (!options.impl.escapeTechniques.has(t)) push('V-14', 'error', `escape technique "${t}" が data/escape-techniques.json に存在しない`, p.id)
    }
  }

  // V-07: registry にあるが参照されない shell / behavior / detector
  if (options.impl?.shells) {
    const used = new Set(catalog.map((p) => p.game?.shell).filter((x): x is string => x !== undefined))
    for (const id of options.impl.shells.keys()) if (!used.has(id)) push('V-07', 'error', `shell "${id}" はどのパターンからも参照されない`)
  }
  if (options.impl?.behaviors) {
    const used = new Set(catalog.flatMap((p) => Object.values(p.game?.behaviors ?? {}).map((b) => b?.id)).filter((x): x is string => x !== undefined))
    for (const id of options.impl.behaviors.keys()) if (!used.has(id)) push('V-07', 'error', `behavior "${id}" はどのパターンからも参照されない`)
  }
  if (options.impl?.detectors) {
    const used = new Set(catalog.map((p) => p.detect?.detectorId).filter((x): x is string => x !== undefined))
    for (const id of options.impl.detectors) if (!used.has(id)) push('V-07', 'error', `detector "${id}" はどのパターンからも参照されない`)
  }

  return {
    errors: issues.filter((i) => i.severity === 'error'),
    warnings: issues.filter((i) => i.severity === 'warn'),
    infos: issues.filter((i) => i.severity === 'info'),
  }
}

export function formatValidation(result: ValidationResult, { includeInfo = false } = {}): string {
  const lines: string[] = []
  for (const e of result.errors) lines.push(`ERROR ${e.rule} ${e.patternId ?? ''} ${e.message}`.replace(/\s+/g, ' '))
  for (const w of result.warnings) lines.push(`WARN  ${w.rule} ${w.patternId ?? ''} ${w.message}`.replace(/\s+/g, ' '))
  if (includeInfo) for (const i of result.infos) lines.push(`INFO  ${i.rule} ${i.patternId ?? ''} ${i.message}`.replace(/\s+/g, ' '))
  return lines.join('\n')
}
