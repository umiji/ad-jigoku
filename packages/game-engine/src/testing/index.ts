/**
 * テスト・デバッグ用のフィクスチャキット。本番コードから import しない。
 * - MINI_CATALOG / fixtureRegistries: 生成器の性質検証用のミニカタログ（実装スタブ付き）
 * - noopShell / noopBehavior: 何もしない shell / behavior（sim/noop.ts）
 */
export { MINI_CATALOG, SHELLS, fixtureRegistries, pattern, testBehavior } from './mini-catalog'
export { noopShell, noopBehavior } from '../sim/noop'
