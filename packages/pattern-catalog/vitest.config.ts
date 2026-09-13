import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: { name: 'pattern-catalog', environment: 'node', include: ['src/**/*.test.{ts,tsx}', 'test/**/*.test.{ts,tsx}'], passWithNoTests: true },
})
