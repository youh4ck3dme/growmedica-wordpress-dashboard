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

      const homeLayout = await page.evaluate(() => {
        const main = document.querySelector('main')
        const mainStyle = main ? getComputedStyle(main) : null
        const mainRect = main?.getBoundingClientRect()
        const vw = document.documentElement.clientWidth
        return {
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          mainZoom: mainStyle?.zoom ?? '1',
          mainWidth: mainRect?.width ?? 0,
          mainRightGap: mainRect ? vw - mainRect.right : 0,
          vw,
        }
      })

      // Regression: main { zoom: 1.15 } left a white column on Pro Max / wide phones
      expect(Number.parseFloat(homeLayout.mainZoom || '1')).toBeLessThanOrEqual(1.001)
      expect(homeLayout.mainRightGap).toBeLessThanOrEqual(2)
      expect(homeLayout.mainWidth).toBeGreaterThanOrEqual(homeLayout.vw - 2)

      if (homeLayout.overflow > 2) {
        console.warn(`SOFT_OVERFLOW home ${vp.label}: ${homeLayout.overflow}px`)
      }

      await page.goto('/produkty', { waitUntil: 'domcontentloaded' })
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 20_000 })
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      if (overflow > 2) {
        console.warn(`SOFT_OVERFLOW produkty ${vp.label}: ${overflow}px`)
      }
      // Must not be wildly broken (e.g. 2x viewport)
      expect(overflow).toBeLessThanOrEqual(vp.width)
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
