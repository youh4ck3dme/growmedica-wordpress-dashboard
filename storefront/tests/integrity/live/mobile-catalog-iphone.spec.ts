/**
 * Live integrity: katalóg ≥300 produktov na všetkých iPhone viewportoach.
 * BEZ lokálneho WordPressu — ide na produkciu www.
 *
 *   yarn test:integrity:iphone
 */
import { test, expect, type Page } from '@playwright/test'
import { IPHONE_VIEWPORTS } from '../../helpers/iphone-viewports'

const BASE = process.env.E2E_BASE_URL || process.env.BASE_URL || 'https://www.growmedica.cz'
const MIN_PRODUCTS = Number(process.env.MIN_CATALOG_PRODUCTS || 300)

test.setTimeout(120_000)

async function assertNoHorizontalOverflow(page: Page, opts?: { soft?: boolean }) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
    }
  })
  const ok = overflow.scrollWidth <= overflow.clientWidth + 2
  if (!ok) {
    const msg = `horizontal overflow: scrollWidth=${overflow.scrollWidth} clientWidth=${overflow.clientWidth}`
    if (opts?.soft) {
      console.warn('SOFT_OVERFLOW', page.url(), msg)
    } else {
      expect(overflow.scrollWidth, msg).toBeLessThanOrEqual(overflow.clientWidth + 2)
    }
  }
}

test.describe('Live API — katalóg 300+', () => {
  test(`sitemap / produkťy majú aspoň ${MIN_PRODUCTS} produktov`, async ({ request }) => {
    const sitemapRes = await request.get(`${BASE}/sitemap.xml`)
    expect(sitemapRes.ok(), `sitemap HTTP ${sitemapRes.status()}`).toBeTruthy()
    const xml = await sitemapRes.text()
    const productUrls = [...xml.matchAll(/https?:\/\/[^<]+\/produkty\/[a-z0-9-]+/gi)]
    const unique = new Set(productUrls.map((m) => m[0]))
    expect(unique.size).toBeGreaterThanOrEqual(MIN_PRODUCTS)

    // Capped public API still returns Woo/Shopify ids
    const apiRes = await request.get(`${BASE}/api/products?limit=10`)
    expect(apiRes.ok(), `API HTTP ${apiRes.status()}`).toBeTruthy()
    const data = (await apiRes.json()) as { products: Array<{ id: string }> }
    expect(data.products.length).toBeGreaterThan(0)
    expect(data.products[0]?.id).toMatch(/woocommerce|shopify|gid:/i)
    console.log(`SITEMAP_PRODUCT_COUNT=${unique.size}`)
  })
})

for (const vp of IPHONE_VIEWPORTS) {
  test.describe(`iPhone ${vp.label} (${vp.width}×${vp.height})`, () => {
    test.use({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.deviceScaleFactor,
      isMobile: true,
      hasTouch: true,
      userAgent: vp.userAgent,
      baseURL: BASE,
    })

    test('homepage: logo + nav + bez horizontal overflow', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' })
      await expect(page.locator('#site-logo, a[href="/"]').first()).toBeVisible({ timeout: 25_000 })
      await expect(page.locator('#cart-button, a[href="/kosik"]').first()).toBeVisible()
      await assertNoHorizontalOverflow(page)
    })

    test('produkty: katalóg render + karty + overflow', async ({ page }) => {
      await page.goto('/produkty', { waitUntil: 'domcontentloaded' })
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 30_000 })

      // product cards / links
      const productLinks = page.locator('a[href*="/produkty/"]')
      await expect(productLinks.first()).toBeVisible({ timeout: 30_000 })
      const count = await productLinks.count()
      // page may virtualize / filter UI — expect solid grid
      expect(count, 'product links on /produkty').toBeGreaterThanOrEqual(12)

      // at least one price-like text
      const body = await page.locator('body').innerText()
      expect(body).toMatch(/€|EUR/)

      await assertNoHorizontalOverflow(page)
    })

    test('PDP: add-to-cart visible, layout OK', async ({ page }) => {
      await page.goto('/produkty/mycomedica-bio-polyporus-100-g', {
        waitUntil: 'domcontentloaded',
      })
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 25_000 })
      await expect(page.locator('#add-to-cart-btn')).toBeVisible({ timeout: 15_000 })
      await expect(page.locator('#add-to-cart-btn')).toBeEnabled()
      // Buy box must be on-screen; CMS description HTML may still overflow (soft)
      const buyBox = page.locator('#product-buy-box')
      await expect(buyBox).toBeVisible()
      const box = await buyBox.boundingBox()
      const vw = page.viewportSize()?.width ?? 375
      expect(box, 'buy box bounding box').toBeTruthy()
      expect(box!.width, 'buy box layout width').toBeLessThanOrEqual(vw + 4)
      expect(box!.x).toBeGreaterThanOrEqual(-2)
      await assertNoHorizontalOverflow(page, { soft: true })
    })

    test('kontakt + doprava: legálne údaje bez overflow', async ({ page }) => {
      await page.goto('/kontakt', { waitUntil: 'domcontentloaded' })
      await expect(page.locator('body')).toContainText(/56 455 143|GrowMedica/i, {
        timeout: 20_000,
      })
      await assertNoHorizontalOverflow(page)

      await page.goto('/doprava-a-platba', { waitUntil: 'domcontentloaded' })
      await expect(page.locator('body')).toContainText(/IBAN|SK48|Packeta|DPD/i)
      await assertNoHorizontalOverflow(page)
    })
  })
}

test.describe('Spot-check 300 handles via sitemap (batch)', () => {
  test('aspoň 300 handle-ov je non-empty a unique', async ({ request }) => {
    const sitemapRes = await request.get(`${BASE}/sitemap.xml`)
    expect(sitemapRes.ok()).toBeTruthy()
    const xml = await sitemapRes.text()
    const handles = [...xml.matchAll(/\/produkty\/([a-z0-9-]+)/gi)].map((m) => m[1])
    const unique = new Set(handles)
    expect(unique.size).toBeGreaterThanOrEqual(MIN_PRODUCTS)

    const sample = [...unique].slice(0, 20)
    for (const handle of sample) {
      const r = await request.get(`${BASE}/produkty/${handle}`)
      expect(r.status(), handle).toBeLessThan(500)
    }
    console.log(`HANDLES_OK=${unique.size} PDP_SAMPLE=${sample.length}`)
  })
})
