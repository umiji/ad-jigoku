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
