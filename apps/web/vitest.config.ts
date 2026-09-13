import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  esbuild: { jsx: 'automatic', jsxImportSource: 'react' },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: { name: 'web', environment: 'jsdom', include: ['src/**/*.test.{ts,tsx}'], setupFiles: ['./test/setup.ts'], passWithNoTests: true },
})
