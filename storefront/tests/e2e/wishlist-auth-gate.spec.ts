import { test, expect } from '@playwright/test'
import { acceptCookies } from '../helpers/cookies'

test.describe('Wishlist auth-gate (browser)', () => {
  test('logged-out user sees login prompt and wishlist is not mutated', async ({ page }) => {
    await page.goto('/produkty')
    await acceptCookies(page)

    const before = await page.evaluate(() => localStorage.getItem('gm_wishlist'))

    const wishlistBtn = page.locator('[id^="wishlist-btn"]').first()
    await expect(wishlistBtn).toBeVisible()
    await wishlistBtn.evaluate((el) =>
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })),
    )

    await expect(page.locator('.noor-toast, [role="status"]').first()).toBeVisible()
    await expect(
      page.getByRole('button', { name: /prihlásiť sa|přihlásit se|log in|anmelden/i }),
    ).toBeVisible()

    const after = await page.evaluate(() => localStorage.getItem('gm_wishlist'))
    expect(after).toBe(before)
  })

  test('toast action button navigates to /prihlasenie', async ({ page }) => {
    await page.goto('/produkty')
    await acceptCookies(page)

    const wishlistBtn = page.locator('[id^="wishlist-btn"]').first()
    await wishlistBtn.evaluate((el) =>
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })),
    )

    await page.getByRole('button', { name: /prihlásiť sa|přihlásit se|log in|anmelden/i }).click()
    await expect(page).toHaveURL(/\/prihlasenie/)
  })

  test('logged-in user (simulated via flag cookie) can still toggle wishlist', async ({
    page,
    context,
    baseURL,
  }) => {
    await context.addCookies([
      { name: 'gm_customer_logged_in', value: '1', url: baseURL ?? 'http://127.0.0.1:5557' },
    ])
    await page.goto('/produkty')
    await acceptCookies(page)

    const wishlistBtn = page.locator('[id^="wishlist-btn"]').first()
    await wishlistBtn.evaluate((el) =>
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })),
    )

    const wishlist = await page.evaluate(() => localStorage.getItem('gm_wishlist'))
    expect(wishlist).not.toBeNull()
  })

  test('site header stays pinned to top after scrolling (no WebKit sticky flicker regression)', async ({
    page,
  }) => {
    await page.goto('/')
    await acceptCookies(page)

    const header = page.locator('[data-site-header]')
    await expect(header).toBeVisible()

    await page.mouse.wheel(0, 1200)
    await page.waitForTimeout(300)

    const box = await header.boundingBox()
    expect(box?.y).toBeCloseTo(0, 0)
  })
})
