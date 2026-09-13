import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

/**
 * シェル（TASK-013A / 013B）のブラウザ実測。
 *
 * 検査対象は `/dev/shells`（6 シェル × 状態が並ぶページ）。
 * ここで見るのは「ブラウザに載せないと分からないこと」だけ:
 *   - 閉じるボタンの当たり判定 44×44（DESIGN.md §19）
 *   - コントラスト / 支援技術（axe）
 *   - 外部遷移・ダウンロード・音声の経路が存在しないこと（SAFE-05 / DESIGN.md §20 NEVER）
 *   - 視覚回帰
 * ロジックの検査は vitest（packages/ui/src/shells/**）側の担当。
 */
const PAGE = '/dev/shells/'
const MIN_TAP_TARGET_PX = 44
const SHELL_IDS = ['popup', 'interstitial', 'stickyBanner', 'inlineRect', 'videoPlayer', 'densityStack']

/** `next dev` は開発用オーバーレイを body に足すので、検査はページ本体（main）だけに絞る */
const IN_PAGE = 'main '

async function gotoShells(page: Page) {
  await page.goto(PAGE)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
}

test('6 シェルすべてが描画されている（GenericShell に落ちていない）', async ({ page }) => {
  await gotoShells(page)
  for (const id of SHELL_IDS) {
    const count = await page.locator(`${IN_PAGE}[data-shell-root="${id}"]`).count()
    expect(count, `${id} が 1 つも描画されていない`).toBeGreaterThan(0)
  }
  expect(await page.locator('[data-generic-shell]').count()).toBe(0)
})

test('すべての × は 44×44 以上（DESIGN.md §19）', async ({ page }, testInfo) => {
  await gotoShells(page)

  const targets = page.locator(`${IN_PAGE}[data-target="close"]`)
  const total = await targets.count()
  expect(total).toBeGreaterThan(0)

  const measurements: string[] = []
  for (let i = 0; i < total; i += 1) {
    const target = targets.nth(i)
    const box = await target.boundingBox()
    expect(box, `#${i} に boundingBox が無い`).not.toBeNull()
    if (box === null) continue

    const shell = await target.evaluate(
      (el) => el.closest('[data-shell-root]')?.getAttribute('data-shell-root') ?? '?',
    )
    measurements.push(`${String(i).padStart(2, '0')} ${shell} → ${box.width.toFixed(1)}×${box.height.toFixed(1)}`)
    expect.soft(box.width, `${shell} #${i} の幅`).toBeGreaterThanOrEqual(MIN_TAP_TARGET_PX)
    expect.soft(box.height, `${shell} #${i} の高さ`).toBeGreaterThanOrEqual(MIN_TAP_TARGET_PX)
  }

  await testInfo.attach('shell-close-sizes.txt', { body: measurements.join('\n'), contentType: 'text/plain' })
  console.log(`[${testInfo.project.name}] シェルの × の実測:\n${measurements.join('\n')}`)
})

test('偽の再生コントロールも 44×44 以上（videoPlayer）', async ({ page }) => {
  await gotoShells(page)
  const controls = page.locator(`${IN_PAGE}[data-shell-root="videoPlayer"] button[data-target="media"]`)
  const total = await controls.count()
  expect(total).toBeGreaterThan(0)
  for (let i = 0; i < total; i += 1) {
    const box = await controls.nth(i).boundingBox()
    expect(box).not.toBeNull()
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(MIN_TAP_TARGET_PX)
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(MIN_TAP_TARGET_PX)
  }
})

test('axe: serious / critical の違反が 0（DESIGN.md §20 / DESIGN_REQ §19）', async ({ page }, testInfo) => {
  await gotoShells(page)

  const results = await new AxeBuilder({ page }).analyze()
  const blocking = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')

  if (blocking.length > 0) {
    await testInfo.attach('axe-violations.json', {
      body: JSON.stringify(blocking, null, 2),
      contentType: 'application/json',
    })
  }
  expect(blocking.map((v) => `${v.impact}: ${v.id} (${v.nodes.length})`)).toEqual([])
})

test('外部遷移 / ダウンロード / 音声の経路が存在しない（SAFE-05 / DESIGN.md §20 NEVER）', async ({ page }) => {
  await gotoShells(page)
  expect(await page.locator(`${IN_PAGE}a[href], ${IN_PAGE}[download]`).count()).toBe(0)
  expect(await page.locator(`${IN_PAGE}audio, ${IN_PAGE}video, ${IN_PAGE}[autoplay]`).count()).toBe(0)
})

test('reducedMotion のシェルはアニメーションを持たない（DESIGN.md §20）', async ({ page }) => {
  await gotoShells(page)
  const still = page.locator(`${IN_PAGE}[data-shell-root="videoPlayer"][data-reduced-motion="true"]`).first()
  await expect(still).toBeVisible()
  const names = await still.evaluate((el) =>
    [...el.querySelectorAll('*')].map((child) => getComputedStyle(child).animationName),
  )
  expect(names.every((name) => name === 'none')).toBe(true)

  const moving = page.locator(`${IN_PAGE}[data-shell-root="videoPlayer"][data-reduced-motion="false"]`).first()
  const movingNames = await moving.evaluate((el) =>
    [...el.querySelectorAll('*')].map((child) => getComputedStyle(child).animationName),
  )
  expect(movingNames.some((name) => name !== 'none')).toBe(true)
})

test('モバイル幅で横スクロールが出ない（DESIGN.md §19 mobile first）', async ({ page }) => {
  await gotoShells(page)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test.describe('視覚回帰', () => {
  // CI は Linux でフォントが違う。Linux 用のベースラインが揃うまではローカル専用
  test.skip(!!process.env.CI, 'visual baselines are local-only until a Linux baseline set exists')

  test('シェル一覧のスクリーンショット', async ({ page }) => {
    await gotoShells(page)
    await page.evaluate(() => document.fonts.ready)
    await expect(page.locator('main')).toHaveScreenshot('shells.png', {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    })
  })
})
