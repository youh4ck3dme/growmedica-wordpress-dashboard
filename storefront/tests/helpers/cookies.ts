import type { Page } from '@playwright/test'

/** Accept cookie consent when the GrowMedica banner is present. */
export async function acceptCookies(page: Page) {
  const accept = page.getByTestId('cookie-consent-accept-all')
  if (await accept.count()) {
    await accept.click()
  }
}
