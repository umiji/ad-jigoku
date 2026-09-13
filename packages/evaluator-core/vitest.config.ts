import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: { name: 'evaluator-core', environment: 'node', include: ['src/**/*.test.{ts,tsx}', 'test/**/*.test.{ts,tsx}'], passWithNoTests: true },
})
