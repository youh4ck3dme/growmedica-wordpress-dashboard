import type { Page } from '@playwright/test'

/** Cookie consent banner was removed — keep helper as no-op for older e2e suites. */
export async function acceptCookies(_page: Page) {
  return
}
