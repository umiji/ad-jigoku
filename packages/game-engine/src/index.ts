// @ad-jigoku/game-engine — ヘッドレス決定論エンジン（ADR-002）
export * from './core'
export { DEFAULT_TUNING, resolveTuning, type EngineTuning, type DeviceProfile } from './config'
export * from './state/intent'
export * from './state/effect'
export * from './state/types'
export * from './sim'
export { createRun, step, hashState, tuningOf, type StepResult } from './run'
