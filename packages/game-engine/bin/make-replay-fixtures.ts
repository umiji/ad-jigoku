/**
 * `pnpm --filter @ad-jigoku/game-engine replay:fixtures`
 * test/fixtures/replays/*.json を再生成する。**エンジンの挙動を意図的に変えたときだけ実行する**
 * （回帰テスト replay.test.ts が落ちるのは「結果が変わった」の検出であり、それが意図どおりならこのスクリプトで更新する）。
 * ミニカタログ（src/testing）で記録するので、実カタログの変更には影響されない。
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { REPLAY_FIXTURE_CASES, FIXTURE_CATALOG_VERSION } from '../src/replay/fixture-cases'
import { simulate } from '../src/replay/simulate'
import { fixtureRegistries } from '../src/testing/mini-catalog'

const dir = join(import.meta.dirname, '..', 'test', 'fixtures', 'replays')
mkdirSync(dir, { recursive: true })
for (const c of REPLAY_FIXTURE_CASES) {
  const { record, summary } = simulate(c.config, c.strategy, FIXTURE_CATALOG_VERSION, { registries: fixtureRegistries(), ...(c.maxSteps !== undefined ? { maxSteps: c.maxSteps } : {}) })
  writeFileSync(join(dir, `${c.name}.json`), JSON.stringify(record, null, 2) + '\n')
  console.log(`${c.name}: ${summary.phase} score=${summary.score} patience=${summary.patience} steps=${record.totalSteps} inputs=${record.inputs.length} hash=${summary.hash}`)
}
