import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Locator, type Page } from '@playwright/test'

/**
 * 部位（parts）のブラウザ実測（TASK-013 test requirements / acceptance criteria）。
 *
 * 検査対象は `/dev/components`（全部位 × 全状態が並ぶページ）。
 */
const PAGE = '/dev/components/'

/** DESIGN.md §19「minimum close target: 44px × 44px」 */
const MIN_TAP_TARGET_PX = 44

/**
 * 検査対象はページ本体（`main`）だけに絞る。
 * `next dev` は開発用オーバーレイのボタンを body に足すので、素の `button` を数えると混ざる。
 */
const IN_PAGE = 'main '

async function gotoParts(page: Page) {
  await page.goto(PAGE)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
}

async function activationCount(page: Page): Promise<number> {
  const value = await page.locator('#activation-count').getAttribute('data-activation-count')
  return Number(value ?? '-1')
}

test.describe('閉じるボタンの当たり判定（DESIGN.md §19 / DESIGN_REQ §5.3 C）', () => {
  test('すべての × は見た目の大きさに関わらず 44×44 以上ある', async ({ page }, testInfo) => {
    await gotoParts(page)

    // 本物の × だけでなく偽 × / 囮も同じ基準にする（押し間違いを「小ささ」で作らない）
    const targets = page.locator(
      `${IN_PAGE}[data-target="close"], ${IN_PAGE}[data-target="fake-close"], ${IN_PAGE}[data-target="decoy"]`,
    )
    const total = await targets.count()
    expect(total).toBeGreaterThan(0)

    const measurements: string[] = []
    for (let i = 0; i < total; i += 1) {
      const target: Locator = targets.nth(i)
      const box = await target.boundingBox()
      expect(box, `#${i} に boundingBox が無い`).not.toBeNull()
      if (box === null) continue

      const kind = await target.getAttribute('data-target')
      const scale = await target.evaluate(
        (el) => getComputedStyle(el).getPropertyValue('--close-visual-scale').trim(),
      )
      measurements.push(
        `${String(i).padStart(2, '0')} ${kind} visualScale=${scale || '1'} → ${box.width.toFixed(1)}×${box.height.toFixed(1)}`,
      )

      expect.soft(box.width, `${kind} #${i} の幅`).toBeGreaterThanOrEqual(MIN_TAP_TARGET_PX)
      expect.soft(box.height, `${kind} #${i} の高さ`).toBeGreaterThanOrEqual(MIN_TAP_TARGET_PX)
    }

    // 実測値をレポートに残す（「44px を守った」ではなく「守っているのを測った」ため）
    await testInfo.attach('close-target-sizes.txt', { body: measurements.join('\n'), contentType: 'text/plain' })
    console.log(`[${testInfo.project.name}] 閉じる系ボタンの実測:\n${measurements.join('\n')}`)
  })

  test('見た目が半分の × でも当たり判定は縮まない', async ({ page }) => {
    await gotoParts(page)

    const scaled = await page.locator(`${IN_PAGE}[data-target="close"]`).evaluateAll((nodes) =>
      nodes
        .filter((node) => getComputedStyle(node).getPropertyValue('--close-visual-scale').trim() === '0.5')
        .map((node) => {
          const rect = node.getBoundingClientRect()
          return { width: rect.width, height: rect.height }
        }),
    )

    expect(scaled.length, 'visualScale=0.5 の × がページに無い').toBeGreaterThan(0)
    for (const rect of scaled) {
      expect(rect.width).toBeGreaterThanOrEqual(MIN_TAP_TARGET_PX)
      expect(rect.height).toBeGreaterThanOrEqual(MIN_TAP_TARGET_PX)
    }
  })
})

test('axe: serious / critical の違反が 0（DESIGN.md §20 / DESIGN_REQ §19）', async ({ page }, testInfo) => {
  await gotoParts(page)

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

test.describe('キーボード操作（DESIGN.md §20 MUST / TASK-013 acceptance）', () => {
  test('Tab で全てのボタンに到達でき、フォーカスリングが見える', async ({ page }) => {
    await gotoParts(page)

    const buttonCount = await page.locator(`${IN_PAGE}button`).count()
    expect(buttonCount).toBeGreaterThan(0)

    const reached = new Set<number>()
    let outlineSeen = false

    for (let i = 0; i < buttonCount * 2; i += 1) {
      await page.keyboard.press('Tab')
      const focused = await page.evaluate(() => {
        const el = document.activeElement
        if (!(el instanceof HTMLElement) || el.tagName !== 'BUTTON') return null
        if (el.closest('main') === null) return null
        const style = getComputedStyle(el)
        const index = Array.from(document.querySelectorAll('main button')).indexOf(el as HTMLButtonElement)
        return {
          index,
          outlineStyle: style.outlineStyle,
          outlineWidth: style.outlineWidth,
          matchesFocusVisible: el.matches(':focus-visible'),
        }
      })
      if (focused === null) continue

      reached.add(focused.index)
      if (focused.matchesFocusVisible) {
        expect(focused.outlineStyle, 'キーボードフォーカス中の outline-style').not.toBe('none')
        expect(Number.parseFloat(focused.outlineWidth)).toBeGreaterThan(0)
        outlineSeen = true
      }
    }

    expect(outlineSeen, ':focus-visible なボタンが 1 つも無い').toBe(true)
    expect(reached.size, 'Tab で到達できないボタンがある').toBe(buttonCount)
  })

  test('Enter と Space の両方でボタンが発火する', async ({ page }) => {
    await gotoParts(page)

    const before = await activationCount(page)
    const cta = page.getByRole('button', { name: '今すぐ無料で遊ぶ' }).first()
    await cta.focus()

    await page.keyboard.press('Enter')
    expect(await activationCount(page)).toBe(before + 1)

    await page.keyboard.press('Space')
    expect(await activationCount(page)).toBe(before + 2)

    // カウントダウン中（enabled=false）の × も押せる。早すぎたかを決めるのはエンジン
    const closeCount = await activationCount(page)
    const inertClose = page.locator(`${IN_PAGE}[data-target="close"][data-enabled="false"]`).first()
    await inertClose.focus()
    await page.keyboard.press('Enter')
    expect(await activationCount(page)).toBe(closeCount + 1)
  })
})

test('偽の × は支援技術に嘘をつかない（TASK-013 req.4 / SAFE-05）', async ({ page }) => {
  await gotoParts(page)

  const fakes = page.locator('[data-target="fake-close"], [data-target="decoy"]')
  const total = await fakes.count()
  expect(total).toBeGreaterThan(0)

  for (let i = 0; i < total; i += 1) {
    const label = (await fakes.nth(i).getAttribute('aria-label')) ?? ''
    expect(label, '広告のボタンであることを言っていない').toContain('広告')
    // 「閉じる」を含むなら、必ず否定形として含む（閉じると誤解させない）
    if (label.includes('閉じる')) {
      expect(label, '「閉じる」を肯定形で名乗っている').toContain('閉じるボタンではありません')
    }
  }

  // 外部遷移・ダウンロードの経路がページに存在しない
  expect(await page.locator('a[href^="http"], a[download], [download]').count()).toBe(0)
})

test.describe('視覚回帰', () => {
  // CI は Linux でフォントが違う。Linux 用のベースラインが揃うまではローカル専用
  test.skip(!!process.env.CI, 'visual baselines are local-only until a Linux baseline set exists')

  test('部位一覧のスクリーンショット', async ({ page }) => {
    await gotoParts(page)
    await page.evaluate(() => document.fonts.ready)
    // `main` だけを撮る。`next dev` のオーバーレイを写さないため
    await expect(page.locator('main')).toHaveScreenshot('parts.png', {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    })
  })
})
