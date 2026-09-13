import { defineConfig } from '@playwright/test'

/**
 * Playwright（TASK-013 test requirements: 当たり判定の実測 / axe / 視覚回帰）。
 *
 * ここで見るのは「ブラウザに載せないと分からないこと」だけ:
 *   - 当たり判定 44×44（CSS の max() と min-inline-size が実際に効いているか）
 *   - コントラスト（axe）
 *   - キーボード操作とフォーカスリング
 *   - 視覚回帰
 * ロジックの検査は vitest（packages/ui/src/parts/*.test.tsx）側の担当。
 *
 * mobile が主（DESIGN.md §3 MUST 1 / §19「Mobile is the primary composition」）。
 */
const PORT = 3100
const BASE_URL = `http://127.0.0.1:${PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // next dev はページを最初に開いた瞬間にその場でコンパイルする。
  // webServer の待機は /dev/components/ しか見ないので、他のルート（/dev/shells/ 等）は
  // 「テスト開始後に初回コンパイル」となり、遅い CI ランナーでは既定の 30s を超える。
  // CI だけ余裕を持たせる（ローカルは短いままにして遅さに気づけるようにする）。
  timeout: process.env.CI ? 60_000 : 30_000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  // 生成物は e2e/__screenshots__/<project>/<name> に置く（OS 差が出るので Windows ローカル基準）
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{arg}{ext}',
  use: {
    baseURL: BASE_URL,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'mobile',
      use: {
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'desktop',
      use: {
        browserName: 'chromium',
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  webServer: {
    command: `pnpm dev --port ${PORT}`,
    url: `${BASE_URL}/dev/components/`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
})
