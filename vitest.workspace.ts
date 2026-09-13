// Root workspace: `pnpm vitest` from the repo root runs every package's tests.
// Each package also owns its own vitest.config.ts so `turbo run test` works per package.
export default ['packages/*/vitest.config.ts', 'apps/*/vitest.config.ts', 'scripts/vitest.config.ts']
