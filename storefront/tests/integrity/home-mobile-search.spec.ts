import { test, expect } from '@playwright/test'

test.describe('Homepage mobile inline search', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('pill is a searchable input (not a dead link)', async ({ page }) => {
    await page.goto('/')
    const input = page.getByTestId('home-mobile-search-input')
    await expect(input).toBeVisible()
    await expect(input).toHaveAttribute('type', 'search')
    await expect(input).toHaveAttribute('placeholder', /./)
    const deadLink = page.locator('a.search-pill[href="/vyhladavanie"]')
    await expect(deadLink).toHaveCount(0)
  })

  test('typing shows suggestions; submit goes to /vyhladavanie?q=', async ({ page }) => {
    test.setTimeout(60_000)

    await page.route('**/api/search?**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          products: [
            {
              handle: 'mock-search-product',
              title: 'Mock Search Product',
              vendor: 'GrowMedica',
              availableForSale: true,
              priceLabel: '19,90 €',
            },
          ],
        }),
      })
    })

    await page.goto('/')
    const input = page.getByTestId('home-mobile-search-input')
    await input.click()
    await input.fill('vi')

    await expect(page.getByRole('option').filter({ hasText: 'Mock Search Product' })).toBeVisible({
      timeout: 5_000,
    })
    await expect(
      page.getByRole('link', { name: /Zobraziť všetky výsledky|View all results/i }),
    ).toBeVisible()

    await input.evaluate((el: HTMLInputElement) => {
      el.form?.requestSubmit()
    })
    await expect(page).toHaveURL(/\/vyhladavanie\?q=vi/, { timeout: 15_000 })
  })
})
