import { test, expect } from '@playwright/test'

// Every storefront route must render GrowMedicaHeader (via HeaderShell in RootLayout),
// except /dashboard which intentionally has no shop chrome.
const STOREFRONT_ROUTES = [
  '/',
  '/kolekcie',
  '/produkty',
  '/o-nas',
  '/balicky',
  '/kosik',
  '/oblubene',
  '/kontakt',
  '/prihlasenie',
  '/profil',
]

test.describe('GrowMedicaHeader — prítomnosť na všetkých stránkach', () => {
  for (const route of STOREFRONT_ROUTES) {
    test(`header sa zobrazuje na "${route}"`, async ({ page }) => {
      await page.goto(route)
      await expect(page.getByTestId('category-nav')).toBeVisible()
    })
  }

  test('/dashboard nemá shop header (zámerná výnimka)', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByTestId('category-nav')).toHaveCount(0)
  })
})
