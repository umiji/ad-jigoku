// @ad-jigoku/pattern-catalog — Shared Kernel（ADR-001）。React / DOM / Playwright を import しない。
export * from './schema'
export { parsePatterns, parseCatalog, CatalogParseError, formatZodError } from './load'
export * from './query'
export { loadCatalog, resetCatalogCache } from './data'
export { computeGameDifficulty, difficultyAxesMean } from './derived'
export {
  validateCatalog,
  formatValidation,
  DEFAULT_MAX_CLOSE_DELAY_MS,
  type ValidationIssue,
  type ValidationResult,
  type ValidateOptions,
  type ImplementationMaps,
  type MarkdownCatalogEntry,
} from './validate'
export { default as catalogVersion } from './version.json'

// --- Creative（広告の中身。TASK-013D / DECISIONS_v0.2 §1.4）---
export {
  CREATIVE_KINDS,
  CREATIVE_TAGS,
  CREATIVE_THEMES,
  CREATIVE_TEXT_FIELDS,
  CREATIVE_ID_RE,
  creativeSchema,
  creativeKindSchema,
  creativeTagSchema,
  creativeThemeSchema,
  type Creative,
  type CreativeKind,
  type CreativeTag,
  type CreativeTheme,
  type CreativeTextField,
} from './creative/schema'
export {
  loadCreatives,
  resetCreativeCache,
  parseCreatives,
  parseCreativeFiles,
  filterCreatives,
  selectCreative,
  CreativeParseError,
} from './creative/selector'
export {
  findBrandViolations,
  normalizeForBrandCheck,
  parseNgWordList,
  ngWordListSchema,
  type BrandViolation,
  type NgWordList,
} from './creative/ng-check'
