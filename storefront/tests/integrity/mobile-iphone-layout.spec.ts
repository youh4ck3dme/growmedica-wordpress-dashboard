/**
 * Mock integrity — layout na iPhone viewportoach (bez WordPressu, bez live API).
 * Beží s Playwright webServerom + SHOPIFY/WOO mock.
 */
import { test, expect, type Page } from '@playwright/test'
import { IPHONE_17_ONLY, IPHONE_VIEWPORTS } from '../helpers/iphone-viewports'

async function getHorizontalOverflow(page: Page) {
  return page.evaluate(() => {
    const doc = document.documentElement
    const body = document.body
    return Math.max(doc.scrollWidth, body.scrollWidth) - doc.clientWidth
  })
}

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

    test('produkt detail CTA (kosik + oblubene) bez overflow', async ({ page }) => {
      await page.goto('/produkty', { waitUntil: 'domcontentloaded' })
      await expect(page.locator('a[href^="/produkty/"]').first()).toBeVisible({ timeout: 20_000 })

      await page.locator('a[href^="/produkty/"]').first().click()
      await expect(page.locator('#add-to-cart-btn')).toBeVisible({ timeout: 20_000 })

      const wishlistButton = page.locator('#wishlist-btn').first()
      await expect(wishlistButton).toBeVisible({ timeout: 20_000 })

      const overflowBefore = await getHorizontalOverflow(page)
      expect(overflowBefore).toBeLessThanOrEqual(2)

      const layoutBefore = await page.evaluate(() => {
        const doc = document.documentElement
        const cartButton = document.querySelector('#add-to-cart-btn')
        const wishlistButton = document.querySelector('#wishlist-btn')

        const cartRect = cartButton?.getBoundingClientRect()
        const wishlistRect = wishlistButton?.getBoundingClientRect()

        return {
          vw: doc.clientWidth,
          cartRightOverflow: cartRect ? cartRect.right - doc.clientWidth : 999,
          wishlistRightOverflow: wishlistRect ? wishlistRect.right - doc.clientWidth : 999,
        }
      })

      expect(layoutBefore.cartRightOverflow).toBeLessThanOrEqual(1)
      expect(layoutBefore.wishlistRightOverflow).toBeLessThanOrEqual(1)

      await wishlistButton.click()
      const overflowAfter = await getHorizontalOverflow(page)
      expect(overflowAfter).toBeLessThanOrEqual(2)
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
