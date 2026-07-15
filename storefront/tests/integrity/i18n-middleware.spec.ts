import { test, expect } from '@playwright/test'
import { LOCALE_COOKIE } from '../../src/lib/i18n'

test.describe('i18n middleware integration', () => {
  test('?lang=en sets cookie and redirects', async ({ request }) => {
    const response = await request.get('/?lang=en', { maxRedirects: 0 })
    expect(response.status()).toBeGreaterThanOrEqual(300)
    expect(response.status()).toBeLessThan(400)
    const setCookie = response.headers()['set-cookie'] ?? ''
    expect(setCookie).toContain(`${LOCALE_COOKIE}=en`)
  })

  test('x-vercel-ip-country DE sets growmedica_locale cookie', async ({ request }) => {
    const response = await request.get('/', {
      headers: { 'x-vercel-ip-country': 'DE' },
    })
    expect(response.ok()).toBe(true)
    const setCookie = response.headers()['set-cookie'] ?? ''
    expect(setCookie).toContain(`${LOCALE_COOKIE}=de`)
  })

  test('cookie override renders lang=sk', async ({ request }) => {
    const response = await request.get('/', {
      headers: { cookie: `${LOCALE_COOKIE}=sk` },
    })
    expect(response.ok()).toBe(true)
    const html = await response.text()
    expect(html).toMatch(/lang="sk"/)
  })

  test('GlassNavbar contains locale switcher', async ({ request }) => {
    const response = await request.get('/')
    expect(response.ok()).toBe(true)
    const html = await response.text()
    expect(html).toContain('data-testid="locale-switcher"')
  })
})
