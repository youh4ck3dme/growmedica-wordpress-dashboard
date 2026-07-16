/**
 * Mock integrity — layout na iPhone viewportoach (bez WordPressu, bez live API).
 * Beží s Playwright webServerom + SHOPIFY/WOO mock.
 */
import { test, expect } from '@playwright/test'
import { IPHONE_17_ONLY, IPHONE_VIEWPORTS } from '../helpers/iphone-viewports'

// Plný set by spomalil mock suite — default iPhone 17 family + SE + Pro Max.
const VIEWPORTS =
  process.env.IPHONE_ALL === '1'
    ? IPHONE_VIEWPORTS
    : [
        ...IPHONE_VIEWPORTS.filter((v) =>
          ['iphone-se', 'iphone-15-pro-max', 'iphone-17', 'iphone-17-pro', 'iphone-17-pro-max'].includes(
            v.id,
          ),
        ),
      ]

for (const vp of VIEWPORTS) {
  test.describe(`Mock mobile layout — ${vp.label}`, () => {
    test.use({
      viewport: { width: vp.width, height: vp.height },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: vp.deviceScaleFactor,
      userAgent: vp.userAgent,
    })

    test('homepage + produkty bez horizontal overflow', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' })
      await expect(page.locator('body')).toBeVisible()
      const homeOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(homeOverflow).toBeLessThanOrEqual(2)

      await page.goto('/produkty', { waitUntil: 'domcontentloaded' })
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 20_000 })
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(2)
    })
  })
}

test.describe('iPhone 17 family only (mock)', () => {
  for (const vp of IPHONE_17_ONLY) {
    test(`${vp.label} kosik empty state fits`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto('/kosik', { waitUntil: 'domcontentloaded' })
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 })
    })
  }
})
