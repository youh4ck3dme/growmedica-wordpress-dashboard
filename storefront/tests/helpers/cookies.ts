import { expect, type Page } from '@playwright/test'

export async function acceptCookies(page: Page) {
  try {
    const isAccepted = await page.evaluate(() => {
      const consent = localStorage.getItem('gm_cookie_consent')
      if (consent === 'accepted') return true
      localStorage.setItem('gm_cookie_consent', 'accepted')
      return false
    })
    if (isAccepted) return
  } catch {
    // Ignore
  }

  const cookieButton = page.getByRole('button', { name: 'Prijať všetky' })
  try {
    if (await cookieButton.isVisible()) {
      await cookieButton.click()
      await expect(cookieButton).toBeHidden()
    }
  } catch {
    // Banner already dismissed or not shown
  }
}

