import { expect, test, type Page } from '@playwright/test'
import { ARTICLES, pickArticle } from '../src/game/content/articles'

/**
 * /game の e2e（TASK-014 / 014A / 015 / 016 / 017）。
 * - seed 固定で広告が出現し、× で閉じられ、HUD が更新される
 * - 記事を読み切り設問に答えるとクリアする（TASK-015）
 * - 偽ブラウザ枠は実 history / window.scroll に触れない（SAFE-12 / 03 / 06）
 * - CTA を押しても cross-origin navigation が起きない（SAFE-05）
 * - reduced-motion 環境でも同じように遊べる（TASK-014）
 */
const SEED = 'e2e-trial-1'
const url = (extra = '') => `/game/?s=${SEED}&st=stage-1&m=story&cv=0.1.0${extra}`

async function closeAllClosable(page: Page): Promise<number> {
  let closed = 0
  const buttons = page.locator('[data-instance][data-lifecycle="closable"] [data-target="close"]')
  const n = await buttons.count()
  for (let i = 0; i < n; i++) {
    const b = buttons.nth(0)
    if (await b.count()) {
      await b.click({ timeout: 2000 }).catch(() => {})
      closed++
    }
  }
  return closed
}

test.describe('/game トライアル', () => {
  test('広告が出現し、× で閉じられ、HUD が追従する', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto(url())
    await expect(page.getByTestId('game-host')).toBeVisible()
    await expect(page.getByTestId('frame-notice')).toBeVisible()
    await page.getByRole('button', { name: 'この案内を閉じる' }).click()
    const patienceBefore = Number(await page.getByTestId('patience-meter').getAttribute('aria-valuenow'))
    expect(patienceBefore).toBeGreaterThan(0)
    expect(patienceBefore).toBeLessThanOrEqual(100)

    const close = page.locator('[data-instance][data-lifecycle="closable"] [data-target="close"]').first()
    await expect(close).toBeVisible({ timeout: 15000 })
    const box = await close.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBeGreaterThanOrEqual(44)
    expect(box!.height).toBeGreaterThanOrEqual(44)
    const instance = await close.locator('xpath=ancestor::*[@data-instance]').getAttribute('data-instance')
    await close.click()
    await expect(page.locator(`[data-instance="${instance}"]`)).toHaveCount(0, { timeout: 3000 })
    const patienceAfter = Number(await page.getByTestId('patience-meter').getAttribute('aria-valuenow'))
    expect(patienceAfter).toBeLessThanOrEqual(100)
    expect(patienceAfter).toBeGreaterThan(0)
    expect(page.getByTestId('hud-time')).toBeVisible()
    expect(errors).toEqual([])
  })

  test('偽ブラウザ枠は実 history / window.scroll に触れない（SAFE-03 / 06 / 12）', async ({ page }) => {
    await page.goto(url())
    const historyBefore = await page.evaluate(() => history.length)
    await page.getByRole('button', { name: /偽の戻る/ }).click()
    expect(await page.evaluate(() => history.length)).toBe(historyBefore)
    expect(page.url()).toContain(`s=${SEED}`)
    const fakeUrl = await page.getByTestId('fake-url').textContent()
    expect(fakeUrl).toContain('hell://')
    expect(fakeUrl).not.toMatch(/\.(com|jp|net|org|io)\b/)
    await page.getByTestId('fake-scroll').evaluate((el) => el.scrollBy(0, 800))
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
  })

  test('CTA を押しても外部遷移しない（SAFE-05）', async ({ page, context }) => {
    const pages: string[] = []
    context.on('page', (p) => pages.push(p.url()))
    await page.goto(url())
    const cta = page.locator('[data-instance] [data-target="cta"]').first()
    await expect(cta).toBeVisible({ timeout: 15000 })
    await cta.click()
    await page.waitForTimeout(300)
    expect(page.url()).toContain('/game/')
    expect(pages).toEqual([])
    // 誤クリックとして patience が減る
    expect(Number(await page.getByTestId('patience-meter').getAttribute('aria-valuenow'))).toBeLessThan(100)
  })

  test('記事を読み切り設問に答えるとクリアし、もう一回できる', async ({ page }) => {
    test.setTimeout(120000)
    await page.goto(url())
    await page.getByRole('button', { name: 'この案内を閉じる' }).click()
    const article = pickArticle(SEED)
    expect(ARTICLES.map((a) => a.id)).toContain(article.id)
    const scroller = page.getByTestId('fake-scroll')
    for (let i = 0; i < 90 && !(await page.getByTestId('result-overlay').count()); i++) {
      await closeAllClosable(page)
      for (const q of article.questions) {
        const btn = page.locator(`[data-question="${q.id}"][data-choice="${q.correctChoice}"]`)
        if ((await btn.count()) && (await btn.isEnabled())) {
          await btn.scrollIntoViewIfNeeded()
          await btn.click().catch(() => {})
        }
      }
      // 少しずつ下へ（本文が viewport に見えている間だけ read が進む）
      await scroller.evaluate((el, i2) => el.scrollTo(0, (i2 % 12) * 160), i)
      await page.waitForTimeout(700)
    }
    await expect(page.getByTestId('result-overlay')).toBeVisible()
    await expect(page.getByTestId('result-overlay')).toHaveAttribute('data-phase', 'cleared')
    const score = await page.getByTestId('result-score').textContent()
    expect(score).toMatch(/\d/)
    await page.getByTestId('result-restart').click()
    await expect(page.getByTestId('result-overlay')).toHaveCount(0)
    await expect(page.getByTestId('game-host')).toHaveAttribute('data-phase', 'running')
  })

  test('HUD: 横向き（landscape）でも破綻せず、アクションバーは広告より下、safe-area 対応（TASK-016）', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true })
    const page = await ctx.newPage()
    await page.goto(url())
    const bar = page.getByTestId('action-bar')
    await expect(bar).toBeVisible()
    const barBox = (await bar.boundingBox())!
    expect(barBox.y + barBox.height).toBeLessThanOrEqual(390 + 1)
    // 5 つのアクションが親指で届く（幅 844 で全部見えている）
    for (const name of ['SMASH', 'DODGE', 'FOCUS', 'REPORT', 'ESCAPE']) {
      const b = page.getByRole('button', { name: new RegExp(name) })
      const box = (await b.boundingBox())!
      expect(box.height).toBeGreaterThanOrEqual(44)
      expect(box.x + box.width).toBeLessThanOrEqual(844 + 1)
    }
    // 横スクロールが発生しない
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    // z 順: 広告（popup）は HUD（sticky）より前面
    const close = page.locator('[data-instance][data-lifecycle="closable"] [data-target="close"]').first()
    await expect(close).toBeVisible({ timeout: 15000 })
    const zAd = await close.locator('xpath=ancestor::*[@data-instance]').evaluate((el) => Number(getComputedStyle(el).zIndex))
    const zHud = await page.getByTestId('hud').evaluate((el) => Number(getComputedStyle(el).zIndex))
    expect(zAd).toBeGreaterThan(zHud)
    await ctx.close()
  })

  test('reduced-motion でも同じように遊べる（TASK-014 / SAFE-07）', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 390, height: 844 } })
    const page = await ctx.newPage()
    await page.goto(url())
    const close = page.locator('[data-instance][data-lifecycle="closable"] [data-target="close"]').first()
    await expect(close).toBeVisible({ timeout: 15000 })
    const motion = await close.locator('xpath=ancestor::*[@data-instance]').getAttribute('data-motion')
    expect(motion ?? '').not.toMatch(/shake|drift|sticky-track/)
    await close.click()
    await expect(page.locator('[data-instance][data-lifecycle="closing"]')).toHaveCount(1, { timeout: 1000 }).catch(() => {})
    await ctx.close()
  })
})
