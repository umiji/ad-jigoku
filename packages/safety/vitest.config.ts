import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: { name: 'safety', environment: 'jsdom', include: ['src/**/*.test.{ts,tsx}', 'test/**/*.test.{ts,tsx}'], passWithNoTests: true },
})
