import { test, expect } from '@playwright/test'

const BASE = process.env.E2E_BASE_URL || 'https://www.growmedica.cz'
const HANDLE = process.env.E2E_PRODUCT_HANDLE || 'mycomedica-bio-polyporus-100-g'

test.describe('E2E nákup 1 produkt (Woo live)', () => {
  test.setTimeout(180_000)

  test('homepage → produkt → košík → cms checkout', async ({ page }) => {
    const steps: string[] = []
    const log = (s: string) => {
      steps.push(s)
      console.log('STEP:', s)
    }

    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
    log('home')
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 25_000 })

    await page.goto(`${BASE}/produkty/${HANDLE}`, { waitUntil: 'domcontentloaded' })
    log(`pdp:${HANDLE}`)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 25_000 })

    const addBtn = page.locator('#add-to-cart-btn')
    await expect(addBtn).toBeVisible({ timeout: 15_000 })
    await expect(addBtn).toBeEnabled()

    const [addRes] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/cart/add') && r.request().method() === 'POST',
        { timeout: 20_000 },
      ),
      addBtn.click(),
    ])
    expect(addRes.ok(), `cart/add HTTP ${addRes.status()}`).toBeTruthy()
    const addJson = (await addRes.json()) as { count?: number }
    expect(addJson.count, 'cart count after add').toBeGreaterThan(0)
    log(`add-to-cart-ok count=${addJson.count}`)

    await page.goto(`${BASE}/kosik`, { waitUntil: 'domcontentloaded' })
    log('kosik')
    await expect(page.locator('body')).toContainText(/Polyporus|polyporus/i, { timeout: 20_000 })
    log('cart-has-product')

    const checkout = page.locator('#checkout-btn, a[href*="kontrola-objednavky"], a[href*="cms.growmedica"]').first()
    await expect(checkout).toBeVisible({ timeout: 15_000 })
    const href = await checkout.getAttribute('href')
    log(`checkout-link:${href}`)
    expect(href).toBeTruthy()

    const res = await page.goto(href!.startsWith('http') ? href! : `${BASE}${href}`, {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    })
    log(`checkout-status:${res?.status() ?? '?'} url:${page.url()}`)
    log(`checkout-title:${await page.title()}`)

    // CMS checkout should load (may be 200 on cart or checkout)
    expect(page.url()).toMatch(/cms\.growmedica\.cz|kontrola-objednavky|kosik|checkout|order/i)

    const body = (await page.locator('body').innerText()).toLowerCase()
    if (body.includes('bank') || body.includes('prevod') || body.includes('dobierka') || body.includes('platba')) {
      log('checkout-payments-visible')
    }
    if (body.includes('doprava') || body.includes('packeta') || body.includes('dpd') || body.includes('shipping')) {
      log('checkout-shipping-visible')
    }

    console.log('REACHED_FINAL:', steps.join(' -> '))
  })
})
